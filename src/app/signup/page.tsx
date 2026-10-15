import Link from 'next/link';
import { SignUpForm } from './sign-up-form';

export default function SignUpPage() {
  return (
    <main className='mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6'>
      <h1 className='text-2xl font-semibold'>Criar conta</h1>
      <SignUpForm />
      <p className='text-sm'>
        Já tem conta?{' '}
        <Link href='/signin' className='underline'>
          Entrar
        </Link>
      </p>
    </main>
  );
}
