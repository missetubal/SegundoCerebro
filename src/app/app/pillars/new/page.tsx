import Link from 'next/link';
import { Suspense } from 'react';
import { eyebrow } from '@/shared/ui';
import { requireUserId } from '@/features/auth/server';
import { createPillarAction } from '@/features/pillars/server';
import { PillarForm } from '@/features/pillars';

export default function NewPillarPage() {
  return (
    <main className='mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 p-6'>
      <Link href='/app/pillars' className='text-sm underline'>
        ← Áreas
      </Link>
      <header className='flex flex-col gap-1'>
        <span className={eyebrow}>Área</span>
        <h1 className='text-3xl font-semibold'>Nova área</h1>
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
      submitLabel='Criar área'
      cancelHref='/app/pillars'
    />
  );
}
