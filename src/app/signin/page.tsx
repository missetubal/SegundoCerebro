import Link from 'next/link';
import { Suspense } from 'react';
import { signIn } from '@/auth';
import { secondaryButton } from '@/components/ui';
import { PasswordSignInForm } from './password-sign-in-form';

export default function SignInPage({ searchParams }: PageProps<'/signin'>) {
  return (
    <main className='mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6'>
      <h1 className='text-2xl font-semibold'>Entrar</h1>
      <Suspense fallback={null}>
        <AuthErrorNotice searchParams={searchParams} />
      </Suspense>
      <PasswordSignInForm />
      <p className='text-center text-sm text-zinc-600 dark:text-zinc-400'>ou</p>
      <form
        action={async () => {
          'use server';
          await signIn('google', { redirectTo: '/app' });
        }}
      >
        <button type='submit' className={`${secondaryButton} w-full`}>
          Entrar com Google
        </button>
      </form>
      <p className='text-sm'>
        Ainda não tem conta?{' '}
        <Link href='/signup' className='underline'>
          Criar conta
        </Link>
      </p>
    </main>
  );
}

async function AuthErrorNotice({
  searchParams,
}: Pick<PageProps<'/signin'>, 'searchParams'>) {
  const { error } = await searchParams;
  if (!error) return null;

  const message =
    error === 'OAuthAccountNotLinked'
      ? 'Este e-mail já tem uma conta com senha. Entre com e-mail e senha.'
      : 'Não foi possível entrar. Tente de novo.';

  return (
    <p
      role='alert'
      className='rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300'
    >
      {message}
    </p>
  );
}
