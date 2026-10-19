'use client';

import Link from 'next/link';
import { useActionState, type ReactNode } from 'react';
import { primaryButton } from '@/shared/ui';
import {
  signInWithPasswordAction,
  type SignInState,
} from '../application/sign-in-actions';
import { AuthAlert, AuthDivider, AuthTextField, authCard, authLink } from './auth-frame';

const initialState: SignInState = { status: 'idle' };

export function PasswordSignInForm({
  notice,
  google,
}: {
  notice?: string | null;
  google: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(
    signInWithPasswordAction,
    initialState,
  );
  const message = state.status === 'error' ? state.message : notice;

  return (
    <div className={authCard}>
      {message ? <AuthAlert>{message}</AuthAlert> : null}
      {google}
      <AuthDivider />
      <form action={formAction} className='flex flex-col gap-4'>
        <AuthTextField
          id='email'
          name='email'
          label='E-mail'
          type='email'
          autoComplete='email'
          required
          placeholder='voce@email.com'
        />
        <AuthTextField
          id='password'
          name='password'
          label='Senha'
          type='password'
          autoComplete='current-password'
          required
          placeholder='••••••••'
          hint={
            <Link href='/forgot-password' className={`${authLink} text-[13px]`}>
              Esqueceu a senha?
            </Link>
          }
        />
        <button type='submit' disabled={pending} className={`${primaryButton} w-full py-2.5`}>
          {pending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
