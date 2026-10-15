import { inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '@/db';
import { createPasswordUser } from '@/db/credentials';
import { loginFailures } from '@/db/schema';
import { hashPassword } from '@/lib/password';
import { createUserFixtures } from '@/test/fixtures';
import { authorizeCredentials, RateLimitedSignin } from './credentials-authorize';

const PASSWORD = 'correct horse battery';
const fixtures = createUserFixtures();
const emails: string[] = [];
let passwordHash: string;

beforeAll(async () => {
  passwordHash = await hashPassword(PASSWORD);
});

afterAll(async () => {
  await fixtures.cleanup();
  if (emails.length > 0) {
    await db.delete(loginFailures).where(inArray(loginFailures.email, emails));
  }
});

async function createAccount() {
  const email = `test-${crypto.randomUUID()}@test.local`;
  emails.push(email);
  const result = await createPasswordUser({ name: 'Ana', email, passwordHash });
  if (result.status !== 'created') throw new Error('setup failed');
  fixtures.track(result.userId);
  return { email, userId: result.userId };
}

async function failTimes(email: string, times: number) {
  for (let i = 0; i < times; i++) {
    await authorizeCredentials({ email, password: 'wrong password' });
  }
}

describe('authorizeCredentials', () => {
  it('returns the user without the hash for the right password', async () => {
    const { email, userId } = await createAccount();

    const user = await authorizeCredentials({
      email: ` ${email.toUpperCase()} `,
      password: PASSWORD,
    });

    expect(user).toEqual({ id: userId, name: 'Ana', email, image: null });
  });

  it('clears login failures after a successful login', async () => {
    const { email, userId } = await createAccount();
    await failTimes(email, 4);

    await expect(
      authorizeCredentials({ email, password: PASSWORD }),
    ).resolves.toMatchObject({ id: userId });

    await expect(
      authorizeCredentials({ email, password: PASSWORD }),
    ).resolves.toMatchObject({ id: userId });
  });

  it('returns null for a wrong password, an unknown email and a Google-only account', async () => {
    const { email } = await createAccount();
    const googleUserId = await fixtures.createUser();
    const unknown = `test-${crypto.randomUUID()}@test.local`;
    emails.push(unknown, `${googleUserId}@test.local`);

    await expect(
      authorizeCredentials({ email, password: 'wrong password' }),
    ).resolves.toBeNull();
    await expect(
      authorizeCredentials({ email: unknown, password: PASSWORD }),
    ).resolves.toBeNull();
    await expect(
      authorizeCredentials({
        email: `${googleUserId}@test.local`,
        password: PASSWORD,
      }),
    ).resolves.toBeNull();
  });

  it('returns null for malformed input', async () => {
    await expect(authorizeCredentials({})).resolves.toBeNull();
  });

  it('blocks the 6th attempt after 5 failures, even with the right password', async () => {
    const { email } = await createAccount();
    await failTimes(email, 5);

    const attempt = authorizeCredentials({ email, password: PASSWORD });

    await expect(attempt).rejects.toBeInstanceOf(RateLimitedSignin);
    await expect(attempt).rejects.toMatchObject({ code: 'rate_limited' });
  });

  it('does not block other emails', async () => {
    const blocked = await createAccount();
    const other = await createAccount();
    await failTimes(blocked.email, 5);

    await expect(
      authorizeCredentials({ email: other.email, password: PASSWORD }),
    ).resolves.toMatchObject({ id: other.userId });
  });

  it('ignores failures older than 15 minutes', async () => {
    const { email, userId } = await createAccount();
    await db.insert(loginFailures).values({
      email,
      failureCount: 5,
      windowStartedAt: new Date(Date.now() - 16 * 60 * 1000),
    });

    await expect(
      authorizeCredentials({ email, password: PASSWORD }),
    ).resolves.toMatchObject({ id: userId });
  });
});
