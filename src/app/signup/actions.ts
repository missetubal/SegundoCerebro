'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/auth';
import { createPasswordUser, findPasswordUserByEmail } from '@/db/credentials';
import { hashPassword } from '@/lib/password';
import { signUpSchema } from '@/lib/validation/credentials';

export type SignUpState =
  | { status: 'idle' }
  | {
      status: 'error';
      message: string;
      fields: { name: string; email: string };
    };

const PASSWORD_ACCOUNT_EXISTS =
  'Já existe uma conta com este e-mail. Entre com e-mail e senha.';
const GOOGLE_ACCOUNT_EXISTS =
  'Este e-mail já é usado por uma conta Google. Entre com Google.';

async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
}): Promise<string | null> {
  const existing = await findPasswordUserByEmail(input.email);
  if (existing) {
    return existing.passwordHash ? PASSWORD_ACCOUNT_EXISTS : GOOGLE_ACCOUNT_EXISTS;
  }

  const result = await createPasswordUser({
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
  });
  return result.status === 'email_taken' ? PASSWORD_ACCOUNT_EXISTS : null;
}

export async function signUpAction(
  _prevState: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const fields = {
    name: String(formData.get('name') ?? ''),
    email: String(formData.get('email') ?? ''),
  };
  const fail = (message: string): SignUpState => ({
    status: 'error',
    message,
    fields,
  });

  const parsed = signUpSchema.safeParse({
    ...fields,
    password: formData.get('password'),
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  try {
    const refusal = await registerAccount(parsed.data);
    if (refusal) return fail(refusal);
  } catch {
    return fail('Não foi possível criar a conta agora. Tente de novo em instantes.');
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: '/app',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return fail('Conta criada, mas não foi possível entrar agora. Entre com e-mail e senha.');
    }
    throw error;
  }
  return { status: 'idle' };
}
