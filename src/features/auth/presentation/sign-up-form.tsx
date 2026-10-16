'use client';

import { useActionState } from 'react';
import { primaryButton, textInput } from '@/shared/ui';
import { NAME_MAX, PASSWORD_MAX, PASSWORD_MIN } from '../domain';
import { signUpAction, type SignUpState } from '../application/sign-up-actions';

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
          maxLength={NAME_MAX}
          defaultValue={fields?.name}
          className={textInput}
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
          className={textInput}
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
          minLength={PASSWORD_MIN}
          maxLength={PASSWORD_MAX}
          aria-describedby='password-hint'
          className={textInput}
        />
        <span id='password-hint' className='text-sm text-muted'>
          De {PASSWORD_MIN} a {PASSWORD_MAX} caracteres.
        </span>
      </div>
      <button type='submit' disabled={pending} className={primaryButton}>
        {pending ? 'Criando conta…' : 'Criar conta'}
      </button>
      <p aria-live='polite' className='text-sm text-rose-700 dark:text-rose-300'>
        {state.status === 'error' && state.message}
      </p>
    </form>
  );
}
