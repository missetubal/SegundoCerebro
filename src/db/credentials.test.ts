import { eq, inArray } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';
import { db } from '@/db';
import { loginFailures, userPasswords, users } from '@/db/schema';
import { createUserFixtures } from '@/test/fixtures';
import {
  countRecentLoginFailures,
  createPasswordUser,
  findPasswordUserByEmail,
  recordLoginFailure,
} from './credentials';

const fixtures = createUserFixtures();
const failureEmails: string[] = [];

afterAll(async () => {
  await fixtures.cleanup();
  if (failureEmails.length > 0) {
    await db.delete(loginFailures).where(inArray(loginFailures.email, failureEmails));
  }
});

function uniqueEmail() {
  const email = `test-${crypto.randomUUID()}@test.local`;
  failureEmails.push(email);
  return email;
}

async function createTrackedPasswordUser(email: string, passwordHash = 'hash-a') {
  const result = await createPasswordUser({ name: 'Ana', email, passwordHash });
  if (result.status === 'created') fixtures.track(result.userId);
  return result;
}

describe('createPasswordUser', () => {
  it('creates the user and its password in one go', async () => {
    const email = uniqueEmail();

    const result = await createTrackedPasswordUser(email);

    expect(result.status).toBe('created');
    if (result.status !== 'created') return;
    const [user] = await db.select().from(users).where(eq(users.id, result.userId));
    expect(user).toMatchObject({ name: 'Ana', email });
    const [password] = await db
      .select()
      .from(userPasswords)
      .where(eq(userPasswords.userId, result.userId));
    expect(password.passwordHash).toBe('hash-a');
  });

  it('reports email_taken and keeps the existing account untouched', async () => {
    const email = uniqueEmail();
    const first = await createTrackedPasswordUser(email, 'hash-a');

    const second = await createTrackedPasswordUser(email, 'hash-b');

    expect(second).toEqual({ status: 'email_taken' });
    if (first.status !== 'created') throw new Error('setup failed');
    const [password] = await db
      .select()
      .from(userPasswords)
      .where(eq(userPasswords.userId, first.userId));
    expect(password.passwordHash).toBe('hash-a');
    expect(await db.$count(users, eq(users.email, email))).toBe(1);
  });
});

describe('findPasswordUserByEmail', () => {
  it('finds a password user ignoring case', async () => {
    const email = uniqueEmail();
    const created = await createTrackedPasswordUser(email);
    if (created.status !== 'created') throw new Error('setup failed');

    const found = await findPasswordUserByEmail(email.toUpperCase());

    expect(found).toEqual({
      id: created.userId,
      name: 'Ana',
      email,
      image: null,
      passwordHash: 'hash-a',
    });
  });

  it('finds a Google-only user without a password', async () => {
    const userId = await fixtures.createUser();

    const found = await findPasswordUserByEmail(`${userId}@test.local`);

    expect(found?.id).toBe(userId);
    expect(found?.passwordHash).toBeNull();
  });

  it('returns null for an unknown email', async () => {
    await expect(findPasswordUserByEmail(uniqueEmail())).resolves.toBeNull();
  });
});

describe('login failures', () => {
  it('counts failures inside the window for that email only', async () => {
    const email = uniqueEmail();
    const other = uniqueEmail();

    await recordLoginFailure(email);
    await recordLoginFailure(email);
    await recordLoginFailure(other);

    expect(await countRecentLoginFailures(email)).toBe(2);
    expect(await countRecentLoginFailures(other)).toBe(1);
  });

  it('ignores failures older than the window', async () => {
    const email = uniqueEmail();
    await db.insert(loginFailures).values({
      email,
      createdAt: new Date(Date.now() - 16 * 60 * 1000),
    });

    expect(await countRecentLoginFailures(email)).toBe(0);
  });

  it('removes failures older than one day when recording a new one', async () => {
    const email = uniqueEmail();
    await db.insert(loginFailures).values({
      email,
      createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
    });

    await recordLoginFailure(email);

    expect(await db.$count(loginFailures, eq(loginFailures.email, email))).toBe(1);
  });
});
