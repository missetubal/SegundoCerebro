import { eq } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';
import { db } from '@/shared/db';
import { userPasswords, users } from '@/shared/db';
import { createUserFixtures } from '@/test/fixtures';
import { createPasswordUser, findPasswordUserByEmail } from './credentials';

const fixtures = createUserFixtures();

afterAll(async () => {
  await fixtures.cleanup();
});

function uniqueEmail() {
  return `test-${crypto.randomUUID()}@test.local`;
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

  it('stores the email in lowercase', async () => {
    const local = `Test-${crypto.randomUUID()}`;
    const email = `${local}@test.local`;

    const result = await createTrackedPasswordUser(email.toUpperCase());

    expect(result.status).toBe('created');
    if (result.status !== 'created') return;
    const [user] = await db.select().from(users).where(eq(users.id, result.userId));
    expect(user.email).toBe(email.toLowerCase());
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

  it('reports email_taken for a different casing of the same email', async () => {
    const email = uniqueEmail();
    await createTrackedPasswordUser(email, 'hash-a');

    const second = await createTrackedPasswordUser(email.toUpperCase(), 'hash-b');

    expect(second).toEqual({ status: 'email_taken' });
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
