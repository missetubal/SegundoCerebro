'use client';

import { CloudOff } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { card, primaryButton, secondaryButton } from '@/shared/ui';

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className='mx-auto flex min-h-dvh w-full max-w-3xl flex-col p-6'>
      <section
        role='alert'
        className={`${card} flex flex-col items-center gap-3 border-dashed p-10 text-center`}
      >
        <span className='inline-flex size-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800'>
          <CloudOff className='size-5' aria-hidden />
        </span>
        <h1 className='font-medium'>Não foi possível carregar esta página</h1>
        <p className='text-sm text-zinc-600 dark:text-zinc-400'>
          Pode ser uma instabilidade passageira. Tente de novo em instantes.
        </p>
        <div className='flex gap-2'>
          <button type='button' onClick={() => retry()} className={primaryButton}>
            Tentar de novo
          </button>
          <Link href='/app' className={secondaryButton}>
            Voltar ao início
          </Link>
        </div>
      </section>
    </main>
  );
}
