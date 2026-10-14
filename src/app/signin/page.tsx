import { signIn } from '@/auth';

export default function SignInPage() {
  return (
    <main className='mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6'>
      <h1 className='text-2xl font-semibold'>Entrar</h1>
      <form
        action={async () => {
          'use server';
          await signIn('google', { redirectTo: '/app' });
        }}
      >
        <button
          type='submit'
          className='w-full rounded bg-black px-4 py-2 text-white'
        >
          Entrar com Google
        </button>
      </form>
    </main>
  );
}
