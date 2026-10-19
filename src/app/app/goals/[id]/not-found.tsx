import Link from 'next/link';
import { primaryButton } from '@/shared/ui';

export default function GoalNotFound() {
  return (
    <main className='mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-start justify-center gap-4 p-6'>
      <h1 className='text-2xl font-semibold'>Meta não encontrada</h1>
      <p className='text-muted'>
        Essa meta não existe ou não está disponível na sua conta.
      </p>
      <Link href='/app/goals' className={primaryButton}>
        Voltar para metas
      </Link>
    </main>
  );
}
