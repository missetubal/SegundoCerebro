import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { eyebrow } from '@/shared/ui';
import { getArea } from '@/features/areas/server';
import { requireUserId } from '@/features/auth/server';
import { updateAreaAction } from '@/features/areas/server';
import { AreaForm } from '@/features/areas';

export default function EditAreaPage({
  params,
}: PageProps<'/app/areas/[id]/edit'>) {
  return (
    <main className='mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 p-6'>
      <Link href='/app/areas' className='text-sm underline'>
        ← Áreas
      </Link>
      <header className='flex flex-col gap-1'>
        <span className={eyebrow}>Área</span>
        <h1 className='text-3xl font-semibold'>Editar área</h1>
      </header>
      <Suspense fallback={<p>Carregando…</p>}>
        <EditAreaContent params={params} />
      </Suspense>
    </main>
  );
}

async function EditAreaContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();
  const area = await getArea(userId, id);
  if (!area) notFound();

  return (
    <AreaForm
      action={updateAreaAction}
      initial={{
        id: area.id,
        name: area.name,
        description: area.description,
        color: area.color,
        icon: area.icon,
      }}
      submitLabel='Salvar'
      cancelHref={`/app/areas/${area.id}`}
    />
  );
}
