'use client';

import { useState } from 'react';
import { primaryButton } from '@/shared/ui';
import { PASSWORD_MAX, PASSWORD_MIN } from '../domain';
import { AuthAlert, AuthTextField, authCard } from './auth-frame';

export function ResetPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className={authCard}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const password = String(data.get('password') ?? '');
        const confirm = String(data.get('confirmPassword') ?? '');
        if (password.length < PASSWORD_MIN) {
          setMessage(`A senha precisa ter pelo menos ${PASSWORD_MIN} caracteres.`);
          return;
        }
        if (password !== confirm) {
          setMessage('As senhas não coincidem.');
          return;
        }
        setMessage('Ainda não dá para salvar a senha nova por aqui.');
      }}
    >
      {message ? <AuthAlert>{message}</AuthAlert> : null}
      <AuthTextField
        id='password'
        name='password'
        label='Nova senha'
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
        label='Confirmar nova senha'
        type='password'
        autoComplete='new-password'
        required
        minLength={PASSWORD_MIN}
        maxLength={PASSWORD_MAX}
        placeholder='••••••••'
      />
      <button type='submit' className={`${primaryButton} w-full py-2.5`}>
        Salvar senha
      </button>
    </form>
  );
}
