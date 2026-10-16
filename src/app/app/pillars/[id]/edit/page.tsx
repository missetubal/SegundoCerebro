import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { eyebrow } from '@/shared/ui';
import { getPillar } from '@/features/pillars/server';
import { requireUserId } from '@/features/auth/server';
import { updatePillarAction } from '@/features/pillars/server';
import { PillarForm } from '@/features/pillars';

export default function EditPillarPage({
  params,
}: PageProps<'/app/pillars/[id]/edit'>) {
  return (
    <main className='mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 p-6'>
      <Link href='/app/pillars' className='text-sm underline'>
        ← Áreas
      </Link>
      <header className='flex flex-col gap-1'>
        <span className={eyebrow}>Área</span>
        <h1 className='text-3xl font-semibold'>Editar área</h1>
      </header>
      <Suspense fallback={<p>Carregando…</p>}>
        <EditPillarContent params={params} />
      </Suspense>
    </main>
  );
}

async function EditPillarContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();
  const pillar = await getPillar(userId, id);
  if (!pillar) notFound();

  return (
    <PillarForm
      action={updatePillarAction}
      initial={{
        id: pillar.id,
        name: pillar.name,
        description: pillar.description,
        color: pillar.color,
        icon: pillar.icon,
      }}
      submitLabel='Salvar'
      cancelHref={`/app/pillars/${pillar.id}`}
    />
  );
}
