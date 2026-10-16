import { AuthError, CredentialsSignin } from 'next-auth';
import { describe, expect, it, vi } from 'vitest';
import { RateLimitedSignin } from './authorize';
import { signInWithPasswordAction } from './sign-in-actions';
import { signIn } from '../infra/next-auth';

vi.mock('../infra/next-auth', () => ({ signIn: vi.fn() }));

const mockedSignIn = vi.mocked(signIn);

function credentialsForm(email: string, password: string) {
  const formData = new FormData();
  formData.set('email', email);
  formData.set('password', password);
  return formData;
}

describe('signInWithPasswordAction', () => {
  it('signs in with the credentials provider and lets the redirect through', async () => {
    mockedSignIn.mockImplementation(async () => {
      throw new Error('NEXT_REDIRECT:/app');
    });

    await expect(
      signInWithPasswordAction(
        { status: 'idle' },
        credentialsForm('ana@exemplo.com', 'uma senha boa'),
      ),
    ).rejects.toThrow('NEXT_REDIRECT:/app');
    expect(mockedSignIn).toHaveBeenCalledWith('credentials', {
      email: 'ana@exemplo.com',
      password: 'uma senha boa',
      redirectTo: '/app',
    });
  });

  it('returns the generic message for wrong credentials', async () => {
    mockedSignIn.mockImplementation(async () => {
      throw new CredentialsSignin();
    });

    const state = await signInWithPasswordAction(
      { status: 'idle' },
      credentialsForm('ana@exemplo.com', 'errada'),
    );

    expect(state).toEqual({
      status: 'error',
      message: 'E-mail ou senha incorretos.',
    });
  });

  it('asks to try later when rate limited', async () => {
    mockedSignIn.mockImplementation(async () => {
      throw new RateLimitedSignin();
    });

    const state = await signInWithPasswordAction(
      { status: 'idle' },
      credentialsForm('ana@exemplo.com', 'certa'),
    );

    expect(state).toEqual({
      status: 'error',
      message: 'Muitas tentativas seguidas. Tente de novo em alguns minutos.',
    });
  });

  it('returns a neutral message for other auth errors', async () => {
    mockedSignIn.mockImplementation(async () => {
      throw new AuthError('boom');
    });

    const state = await signInWithPasswordAction(
      { status: 'idle' },
      credentialsForm('ana@exemplo.com', 'certa'),
    );

    expect(state.status).toBe('error');
  });
});
