import Link from 'next/link';
import { Suspense } from 'react';
import { eyebrow } from '@/components/ui';
import { requireUserId } from '@/lib/session';
import { createPillarAction } from '../actions';
import { PillarForm } from '../pillar-form';

export default function NewPillarPage() {
  return (
    <main className='mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 p-6'>
      <Link href='/app/pillars' className='text-sm underline'>
        ← Pilares
      </Link>
      <header className='flex flex-col gap-1'>
        <span className={eyebrow}>Pilar</span>
        <h1 className='text-3xl font-semibold'>Novo pilar</h1>
      </header>
      <Suspense fallback={<p>Carregando…</p>}>
        <NewPillarContent />
      </Suspense>
    </main>
  );
}

async function NewPillarContent() {
  await requireUserId();

  return (
    <PillarForm
      action={createPillarAction}
      submitLabel='Criar pilar'
      cancelHref='/app/pillars'
    />
  );
}
