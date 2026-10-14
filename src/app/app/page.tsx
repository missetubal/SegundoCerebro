import Link from 'next/link';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/auth';

export default function AppHome() {
  return (
    <main className='mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6'>
      <Suspense fallback={<p>Carregando…</p>}>
        <Greeting />
      </Suspense>
      <p>Em breve: check-in, hábitos e pilares.</p>
      <Link href='/app/preferences' className='underline'>
        Preferências
      </Link>
      <form
        action={async () => {
          'use server';
          await signOut({ redirectTo: '/' });
        }}
      >
        <button type='submit' className='rounded border px-4 py-2'>
          Sair
        </button>
      </form>
    </main>
  );
}

async function Greeting() {
  const session = await auth();
  if (!session?.user) redirect('/signin');

  return <h1 className='text-2xl font-semibold'>Olá, {session.user.name}</h1>;
}
