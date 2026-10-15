import { eq, inArray } from 'drizzle-orm';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { signIn } from '@/auth';
import { db } from '@/db';
import { createPasswordUser } from '@/db/credentials';
import { userPasswords, users } from '@/db/schema';
import { verifyPassword } from '@/lib/password';
import { createUserFixtures } from '@/test/fixtures';
import { signUpAction } from './actions';

vi.mock('@/auth', () => ({
  signIn: vi.fn(async () => {
    throw new Error('NEXT_REDIRECT:/app');
  }),
}));

const PASSWORD = 'correct horse battery';
const EMAIL_UNAVAILABLE =
  'Não foi possível criar a conta com este e-mail. Se ele já é seu, entre com e-mail e senha ou com Google.';
const fixtures = createUserFixtures();
const emails: string[] = [];

afterAll(async () => {
  await fixtures.cleanup();
  if (emails.length > 0) {
    await db.delete(users).where(inArray(users.email, emails));
  }
});

function uniqueEmail() {
  const email = `test-${crypto.randomUUID()}@test.local`;
  emails.push(email);
  return email;
}

function signUpForm(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

async function findUser(email: string) {
  const [row] = await db
    .select({ id: users.id, name: users.name, hash: userPasswords.passwordHash })
    .from(users)
    .leftJoin(userPasswords, eq(userPasswords.userId, users.id))
    .where(eq(users.email, email));
  return row;
}

describe('signUpAction', () => {
  it('creates the account with a normalized email, stores only a hash and signs in', async () => {
    const email = uniqueEmail();

    await expect(
      signUpAction(
        { status: 'idle' },
        signUpForm({ name: ' Ana ', email: ` ${email.toUpperCase()} `, password: PASSWORD }),
      ),
    ).rejects.toThrow('NEXT_REDIRECT:/app');

    const user = await findUser(email);
    expect(user.name).toBe('Ana');
    expect(user.hash).not.toContain(PASSWORD);
    await expect(verifyPassword(PASSWORD, user.hash!)).resolves.toBe(true);
    expect(vi.mocked(signIn)).toHaveBeenCalledWith('credentials', {
      email,
      password: PASSWORD,
      redirectTo: '/app',
    });
  });

  it('refuses an email that already has a password account, without changing it', async () => {
    const email = uniqueEmail();
    await createPasswordUser({ name: 'Ana', email, passwordHash: 'hash-a' });

    const state = await signUpAction(
      { status: 'idle' },
      signUpForm({ name: 'Outra', email: email.toUpperCase(), password: PASSWORD }),
    );

    expect(state).toMatchObject({ status: 'error', message: EMAIL_UNAVAILABLE });
    expect(await findUser(email)).toMatchObject({ name: 'Ana', hash: 'hash-a' });
  });

  it('refuses the email of a Google account and does not give it a password', async () => {
    const userId = await fixtures.createUser();
    const email = `${userId}@test.local`;

    const state = await signUpAction(
      { status: 'idle' },
      signUpForm({ name: 'Bia', email, password: PASSWORD }),
    );

    expect(state).toMatchObject({ status: 'error', message: EMAIL_UNAVAILABLE });
    expect(await findUser(email)).toMatchObject({ id: userId, name: null, hash: null });
  });

  it('rejects invalid input, keeps the typed fields and writes nothing', async () => {
    const email = uniqueEmail();

    const state = await signUpAction(
      { status: 'idle' },
      signUpForm({ name: 'Ana', email, password: '1234567' }),
    );

    expect(state).toEqual({
      status: 'error',
      message: 'A senha precisa ter pelo menos 8 caracteres.',
      fields: { name: 'Ana', email },
    });
    expect(await findUser(email)).toBeUndefined();
  });
});
