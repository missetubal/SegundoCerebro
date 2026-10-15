'use client';

import { useActionState } from 'react';
import { signInWithPasswordAction, type SignInState } from './actions';

const initialState: SignInState = { status: 'idle' };

export function PasswordSignInForm() {
  const [state, formAction, pending] = useActionState(
    signInWithPasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className='flex flex-col gap-4'>
      <div className='flex flex-col gap-2'>
        <label htmlFor='email' className='font-medium'>
          E-mail
        </label>
        <input
          id='email'
          name='email'
          type='email'
          autoComplete='email'
          required
          className='rounded border px-3 py-2'
        />
      </div>
      <div className='flex flex-col gap-2'>
        <label htmlFor='password' className='font-medium'>
          Senha
        </label>
        <input
          id='password'
          name='password'
          type='password'
          autoComplete='current-password'
          required
          className='rounded border px-3 py-2'
        />
      </div>
      <button
        type='submit'
        disabled={pending}
        className='rounded bg-black px-4 py-2 text-white disabled:opacity-50'
      >
        {pending ? 'Entrando…' : 'Entrar com e-mail'}
      </button>
      <p aria-live='polite' className='text-sm'>
        {state.status === 'error' && state.message}
      </p>
    </form>
  );
}
