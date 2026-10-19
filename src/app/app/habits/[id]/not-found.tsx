import Link from 'next/link';
import { primaryButton } from '@/shared/ui';

export default function HabitNotFound() {
  return (
    <main className='mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-start justify-center gap-4 p-6'>
      <h1 className='text-2xl font-semibold'>Hábito não encontrado</h1>
      <p className='text-muted'>
        Esse hábito não existe ou não está disponível na sua conta.
      </p>
      <Link href='/app/habits' className={primaryButton}>
        Voltar para hábitos
      </Link>
    </main>
  );
}
