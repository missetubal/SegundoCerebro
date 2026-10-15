'use server';

import { AuthError, CredentialsSignin } from 'next-auth';
import { signIn } from '@/auth';
import { RateLimitedSignin } from '@/lib/credentials-authorize';

export type SignInState =
  | { status: 'idle' }
  | { status: 'error'; message: string };

function messageFor(error: AuthError): string {
  if (error instanceof RateLimitedSignin) {
    return 'Muitas tentativas seguidas. Tente de novo em alguns minutos.';
  }
  if (error instanceof CredentialsSignin) return 'E-mail ou senha incorretos.';
  return 'Não foi possível entrar agora. Tente de novo em instantes.';
}

export async function signInWithPasswordAction(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  try {
    await signIn('credentials', {
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
      redirectTo: '/app',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { status: 'error', message: messageFor(error) };
    }
    throw error;
  }
  return { status: 'idle' };
}
