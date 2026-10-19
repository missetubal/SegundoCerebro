'use client';

import { useActionState, type ReactNode } from 'react';
import { primaryButton } from '@/shared/ui';
import { PASSWORD_MAX, PASSWORD_MIN } from '../domain';
import { signUpAction, type SignUpState } from '../application/sign-up-actions';
import { AuthAlert, AuthDivider, AuthTextField, authCard } from './auth-frame';

const initialState: SignUpState = { status: 'idle' };

export function SignUpForm({ google }: { google: ReactNode }) {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);
  const fields = state.status === 'error' ? state.fields : undefined;

  return (
    <div className={authCard}>
      {state.status === 'error' ? <AuthAlert>{state.message}</AuthAlert> : null}
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
          defaultValue={fields?.email}
        />
        <AuthTextField
          id='password'
          name='password'
          label='Senha'
          type='password'
          autoComplete='new-password'
          required
          minLength={PASSWORD_MIN}
          maxLength={PASSWORD_MAX}
          placeholder='••••••••'
        />
        <AuthTextField
          id='confirmPassword'
          name='confirmPassword'
          label='Confirmar senha'
          type='password'
          autoComplete='new-password'
          required
          minLength={PASSWORD_MIN}
          maxLength={PASSWORD_MAX}
          placeholder='••••••••'
        />
        <button type='submit' disabled={pending} className={`${primaryButton} w-full py-2.5`}>
          {pending ? 'Criando conta…' : 'Criar conta'}
        </button>
      </form>
    </div>
  );
}
