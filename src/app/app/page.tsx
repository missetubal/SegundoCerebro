import Link from 'next/link';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/features/auth/server';
import { secondaryButton } from '@/shared/ui';

export default function AppHome() {
  return (
    <main className='mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6'>
      <Suspense fallback={<p>Carregando…</p>}>
        <Greeting />
      </Suspense>
      <p>Em breve: check-in, metas e hábitos.</p>
      <nav className='flex flex-col gap-2'>
        <Link href='/app/areas' className='underline'>
          Áreas
        </Link>
        <Link href='/app/horizons' className='underline'>
          Horizontes
        </Link>
        <Link href='/app/preferences' className='underline'>
          Preferências
        </Link>
      </nav>
      <form
        action={async () => {
          'use server';
          await signOut({ redirectTo: '/' });
        }}
      >
        <button type='submit' className={secondaryButton}>
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
