import { like } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '@/db';
import { createPasswordUser } from '@/db/credentials';
import { rateLimits } from '@/db/schema';
import { hashPassword } from '@/lib/password';
import {
  LOGIN_IP_MAX,
  loginAccountLimit,
  loginIpLimit,
} from '@/lib/rate-limit-policies';
import { createUserFixtures } from '@/test/fixtures';
import { authorizeCredentials, RateLimitedSignin } from './credentials-authorize';

const PASSWORD = 'correct horse battery';
const runId = crypto.randomUUID();
const fixtures = createUserFixtures();
let passwordHash: string;

beforeAll(async () => {
  passwordHash = await hashPassword(PASSWORD);
});

afterAll(async () => {
  await fixtures.cleanup();
  await db.delete(rateLimits).where(like(rateLimits.key, `%${runId}%`));
});

function uniqueIp() {
  return `ip-${runId}-${crypto.randomUUID()}`;
}

function requestFrom(ip: string) {
  return new Request('http://localhost/api/auth/callback/credentials', {
    headers: { 'x-forwarded-for': ip },
  });
}

async function createAccount() {
  const email = `test-${crypto.randomUUID()}@test.local`;
  const result = await createPasswordUser({ name: 'Ana', email, passwordHash });
  if (result.status !== 'created') throw new Error('setup failed');
  fixtures.track(result.userId);
  return { email, userId: result.userId };
}

async function failTimes(email: string, ip: string, times: number) {
  for (let i = 0; i < times; i++) {
    await authorizeCredentials({ email, password: 'wrong password' }, requestFrom(ip));
  }
}

describe('authorizeCredentials', () => {
  it('returns the user without the hash for the right password', async () => {
    const { email, userId } = await createAccount();

    const user = await authorizeCredentials(
      { email: ` ${email.toUpperCase()} `, password: PASSWORD },
      requestFrom(uniqueIp()),
    );

    expect(user).toEqual({ id: userId, name: 'Ana', email, image: null });
  });

  it('clears the account counter after a successful login', async () => {
    const { email, userId } = await createAccount();
    const ip = uniqueIp();
    await failTimes(email, ip, 4);

    await expect(
      authorizeCredentials({ email, password: PASSWORD }, requestFrom(ip)),
    ).resolves.toMatchObject({ id: userId });

    await failTimes(email, ip, 4);
    await expect(
      authorizeCredentials({ email, password: PASSWORD }, requestFrom(ip)),
    ).resolves.toMatchObject({ id: userId });
  });

  it('returns null for a wrong password, an unknown email and a Google-only account', async () => {
    const { email } = await createAccount();
    const googleUserId = await fixtures.createUser();
    const unknown = `test-${crypto.randomUUID()}@test.local`;
    const request = () => requestFrom(uniqueIp());

    await expect(
      authorizeCredentials({ email, password: 'wrong password' }, request()),
    ).resolves.toBeNull();
    await expect(
      authorizeCredentials({ email: unknown, password: PASSWORD }, request()),
    ).resolves.toBeNull();
    await expect(
      authorizeCredentials(
        { email: `${googleUserId}@test.local`, password: PASSWORD },
        request(),
      ),
    ).resolves.toBeNull();
  });

  it('returns null for malformed input', async () => {
    await expect(authorizeCredentials({})).resolves.toBeNull();
  });

  it('blocks the 6th attempt from the same IP after 5 failures, even with the right password', async () => {
    const { email } = await createAccount();
    const ip = uniqueIp();
    await failTimes(email, ip, 5);

    const attempt = authorizeCredentials({ email, password: PASSWORD }, requestFrom(ip));

    await expect(attempt).rejects.toBeInstanceOf(RateLimitedSignin);
    await expect(attempt).rejects.toMatchObject({ code: 'rate_limited' });
  });

  it('does not lock the owner out when failures come from another IP', async () => {
    const { email, userId } = await createAccount();
    await failTimes(email, uniqueIp(), 5);

    await expect(
      authorizeCredentials({ email, password: PASSWORD }, requestFrom(uniqueIp())),
    ).resolves.toMatchObject({ id: userId });
  });

  it('does not block other emails from the same IP below the IP limit', async () => {
    const blocked = await createAccount();
    const other = await createAccount();
    const ip = uniqueIp();
    await failTimes(blocked.email, ip, 5);

    await expect(
      authorizeCredentials({ email: other.email, password: PASSWORD }, requestFrom(ip)),
    ).resolves.toMatchObject({ id: other.userId });
  });

  it(`blocks an IP after ${LOGIN_IP_MAX} attempts across different emails`, async () => {
    const { email } = await createAccount();
    const ip = uniqueIp();
    await db.insert(rateLimits).values({
      key: loginIpLimit(ip).key,
      count: LOGIN_IP_MAX - 1,
    });
    await authorizeCredentials(
      { email: `spray-${runId}@test.local`, password: 'x' },
      requestFrom(ip),
    );

    await expect(
      authorizeCredentials({ email, password: PASSWORD }, requestFrom(ip)),
    ).rejects.toBeInstanceOf(RateLimitedSignin);
  });

  it('ignores failures older than 15 minutes', async () => {
    const { email, userId } = await createAccount();
    const ip = uniqueIp();
    await db.insert(rateLimits).values({
      key: loginAccountLimit(email, ip).key,
      count: 5,
      windowStartedAt: new Date(Date.now() - 16 * 60 * 1000),
    });

    await expect(
      authorizeCredentials({ email, password: PASSWORD }, requestFrom(ip)),
    ).resolves.toMatchObject({ id: userId });
  });
});
