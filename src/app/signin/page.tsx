import Link from 'next/link';
import { Suspense } from 'react';
import { signIn } from '@/auth';
import { PasswordSignInForm } from './password-sign-in-form';

export default function SignInPage({ searchParams }: PageProps<'/signin'>) {
  return (
    <main className='mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6'>
      <h1 className='text-2xl font-semibold'>Entrar</h1>
      <Suspense fallback={null}>
        <AuthErrorNotice searchParams={searchParams} />
      </Suspense>
      <PasswordSignInForm />
      <p className='text-center text-sm opacity-70'>ou</p>
      <form
        action={async () => {
          'use server';
          await signIn('google', { redirectTo: '/app' });
        }}
      >
        <button type='submit' className='w-full rounded border px-4 py-2'>
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
    <p role='alert' className='rounded border px-3 py-2 text-sm'>
      {message}
    </p>
  );
}
