'use client';

import { useActionState } from 'react';
import { signUpAction, type SignUpState } from './actions';

const initialState: SignUpState = { status: 'idle' };

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);
  const fields = state.status === 'error' ? state.fields : undefined;

  return (
    <form action={formAction} className='flex flex-col gap-4'>
      <div className='flex flex-col gap-2'>
        <label htmlFor='name' className='font-medium'>
          Nome
        </label>
        <input
          id='name'
          name='name'
          autoComplete='name'
          required
          maxLength={80}
          defaultValue={fields?.name}
          className='rounded border px-3 py-2'
        />
      </div>
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
          defaultValue={fields?.email}
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
          autoComplete='new-password'
          required
          minLength={8}
          maxLength={128}
          aria-describedby='password-hint'
          className='rounded border px-3 py-2'
        />
        <span id='password-hint' className='text-sm opacity-70'>
          De 8 a 128 caracteres.
        </span>
      </div>
      <button
        type='submit'
        disabled={pending}
        className='rounded bg-black px-4 py-2 text-white disabled:opacity-50'
      >
        {pending ? 'Criando conta…' : 'Criar conta'}
      </button>
      <p aria-live='polite' className='text-sm'>
        {state.status === 'error' && state.message}
      </p>
    </form>
  );
}
