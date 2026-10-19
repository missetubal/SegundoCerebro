'use client';

import { useState } from 'react';
import { primaryButton } from '@/shared/ui';
import { AuthAlert, AuthTextField, authCard } from './auth-frame';

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className={authCard}
      onSubmit={(event) => {
        event.preventDefault();
        const email = String(new FormData(event.currentTarget).get('email') ?? '').trim();
        setMessage(
          email
            ? 'Ainda não enviamos e-mail de recuperação.'
            : 'Informe um e-mail válido.',
        );
      }}
    >
      {message ? <AuthAlert>{message}</AuthAlert> : null}
      <AuthTextField
        id='email'
        name='email'
        label='E-mail'
        type='email'
        autoComplete='email'
        required
        placeholder='voce@email.com'
      />
      <button type='submit' className={`${primaryButton} w-full py-2.5`}>
        Enviar link
      </button>
    </form>
  );
}
