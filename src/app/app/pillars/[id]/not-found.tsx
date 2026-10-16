import { Compass } from 'lucide-react';
import Link from 'next/link';
import { card, primaryButton } from '@/shared/ui';

export default function PillarNotFound() {
  return (
    <main className='mx-auto flex min-h-dvh w-full max-w-3xl flex-col p-6'>
      <section
        className={`${card} flex flex-col items-center gap-3 border-dashed p-10 text-center`}
      >
        <span className='inline-flex size-10 items-center justify-center rounded-full bg-bg-app text-muted'>
          <Compass className='size-5' aria-hidden />
        </span>
        <h1 className='font-medium'>Pilar não encontrado</h1>
        <p className='text-sm text-muted'>
          Ele pode ter sido excluído ou o endereço está incompleto.
        </p>
        <Link href='/app/pillars' className={primaryButton}>
          Voltar para pilares
        </Link>
      </section>
    </main>
  );
}
