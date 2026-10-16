import { Archive, ArchiveRestore, ArrowLeft, Pencil, Trash } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ConfirmDeleteDialog } from '@/shared/ui';
import { ItemActionButton } from '@/shared/ui';
import { AreaTile } from '@/features/areas';
import { card, dangerButton, eyebrow, secondaryButton } from '@/shared/ui';
import { getArea } from '@/features/areas/server';
import { requireUserId } from '@/features/auth/server';
import {
  archiveAreaAction,
  deleteAreaAction,
  unarchiveAreaAction,
} from '@/features/areas/server';

export default function AreaPage({ params }: PageProps<'/app/areas/[id]'>) {
  return (
    <main className='mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 p-6'>
      <Link
        href='/app/areas'
        className='inline-flex items-center gap-2 self-start text-sm'
      >
        <ArrowLeft className='size-4' aria-hidden />
        Áreas
      </Link>
      <Suspense fallback={<p>Carregando…</p>}>
        <AreaDetail params={params} />
      </Suspense>
    </main>
  );
}

async function AreaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();
  const area = await getArea(userId, id);
  if (!area) notFound();

  const isArchived = area.archivedAt !== null;

  return (
    <>
      <header className='flex flex-col gap-3'>
        <span className={eyebrow}>Área</span>
        <div className='flex items-center gap-4'>
          <AreaTile color={area.color} icon={area.icon} size='lg' />
          <h1 className='text-3xl font-semibold'>{area.name}</h1>
          {isArchived && (
            <span className='rounded-full bg-bg-app px-3 py-1 text-xs font-medium text-muted'>
              Arquivado
            </span>
          )}
        </div>
        {area.description && (
          <p className='whitespace-pre-line text-muted'>
            {area.description}
          </p>
        )}
      </header>

      <div className='flex flex-wrap gap-2'>
        <Link href={`/app/areas/${area.id}/edit`} className={secondaryButton}>
          <Pencil className='size-4' aria-hidden />
          Editar
        </Link>
        {isArchived ? (
          <ItemActionButton
            action={unarchiveAreaAction}
            id={area.id}
            label='Desarquivar'
            className={secondaryButton}
          >
            <ArchiveRestore className='size-4' aria-hidden />
            Desarquivar
          </ItemActionButton>
        ) : (
          <ItemActionButton
            action={archiveAreaAction}
            id={area.id}
            label='Arquivar'
            className={secondaryButton}
          >
            <Archive className='size-4' aria-hidden />
            Arquivar
          </ItemActionButton>
        )}
        <ConfirmDeleteDialog
          action={deleteAreaAction}
          id={area.id}
          title={`Excluir “${area.name}”?`}
          description='A exclusão não pode ser desfeita. Se quiser apenas tirar a área das telas principais, arquive em vez de excluir.'
          triggerLabel='Excluir'
          triggerClassName={dangerButton}
          trigger={
            <>
              <Trash className='size-4' aria-hidden />
              Excluir
            </>
          }
        />
      </div>

      <section className={`${card} p-6`}>
        <h2 className='font-medium'>Metas e hábitos</h2>
        <p className='mt-2 text-sm text-muted'>
          As metas e os hábitos desta área vão aparecer aqui.
        </p>
      </section>
    </>
  );
}
