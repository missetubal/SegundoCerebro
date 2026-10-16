import Link from 'next/link';
import { Suspense } from 'react';
import { eyebrow } from '@/shared/ui';
import { requireUserId } from '@/features/auth/server';
import { createAreaAction } from '@/features/areas/server';
import { AreaForm } from '@/features/areas';

export default function NewAreaPage() {
  return (
    <main className='mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 p-6'>
      <Link href='/app/areas' className='text-sm underline'>
        ← Áreas
      </Link>
      <header className='flex flex-col gap-1'>
        <span className={eyebrow}>Área</span>
        <h1 className='text-3xl font-semibold'>Nova área</h1>
      </header>
      <Suspense fallback={<p>Carregando…</p>}>
        <NewAreaContent />
      </Suspense>
    </main>
  );
}

async function NewAreaContent() {
  await requireUserId();

  return (
    <AreaForm
      action={createAreaAction}
      submitLabel='Criar área'
      cancelHref='/app/areas'
    />
  );
}
