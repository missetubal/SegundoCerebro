'use server';

import { headers } from 'next/headers';
import { AuthError } from 'next-auth';
import { createPasswordUser } from '../infra/credentials';
import { signIn } from '../infra/next-auth';
import { consumeRateLimits } from '@/shared/db';
import { clientIp } from '@/shared/lib/client-ip';
import { hashPassword } from '@/shared/lib/password';
import { signUpIpLimit } from '@/shared/lib/rate-limit-policies';
import { signUpSchema } from '../domain';

export type SignUpState =
  | { status: 'idle' }
  | {
      status: 'error';
      message: string;
      fields: { name: string; email: string };
    };

// Same text for password and Google accounts, so the form does not reveal how
// an existing address signs in.
const EMAIL_UNAVAILABLE =
  'Não foi possível criar a conta com este e-mail. Se ele já é seu, entre com e-mail e senha ou com Google.';
const TOO_MANY_ATTEMPTS =
  'Muitas tentativas seguidas. Tente de novo em alguns minutos.';

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

  // Known risk (accepted): no email verification — an attacker can register
  // someone else's address and block Google sign-in for that email until
  // verify-email ships. See PR #4 "Conhecidos".
  try {
    const ip = clientIp(await headers());
    if (!(await consumeRateLimits([signUpIpLimit(ip)]))) {
      return fail(TOO_MANY_ATTEMPTS);
    }
    const result = await createPasswordUser({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
    });
    if (result.status === 'email_taken') return fail(EMAIL_UNAVAILABLE);
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
