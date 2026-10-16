import { Archive, ArchiveRestore, ArrowLeft, Pencil, Trash } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ConfirmDeleteDialog } from '@/shared/ui';
import { ItemActionButton } from '@/shared/ui';
import { PillarTile } from '@/features/pillars';
import { card, dangerButton, eyebrow, secondaryButton } from '@/shared/ui';
import { getPillar } from '@/features/pillars/server';
import { requireUserId } from '@/features/auth/server';
import {
  archivePillarAction,
  deletePillarAction,
  unarchivePillarAction,
} from '@/features/pillars/server';

export default function PillarPage({ params }: PageProps<'/app/pillars/[id]'>) {
  return (
    <main className='mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 p-6'>
      <Link
        href='/app/pillars'
        className='inline-flex items-center gap-2 self-start text-sm'
      >
        <ArrowLeft className='size-4' aria-hidden />
        Pilares
      </Link>
      <Suspense fallback={<p>Carregando…</p>}>
        <PillarDetail params={params} />
      </Suspense>
    </main>
  );
}

async function PillarDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();
  const pillar = await getPillar(userId, id);
  if (!pillar) notFound();

  const isArchived = pillar.archivedAt !== null;

  return (
    <>
      <header className='flex flex-col gap-3'>
        <span className={eyebrow}>Pilar</span>
        <div className='flex items-center gap-4'>
          <PillarTile color={pillar.color} icon={pillar.icon} size='lg' />
          <h1 className='text-3xl font-semibold'>{pillar.name}</h1>
          {isArchived && (
            <span className='rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'>
              Arquivado
            </span>
          )}
        </div>
        {pillar.description && (
          <p className='whitespace-pre-line text-zinc-600 dark:text-zinc-400'>
            {pillar.description}
          </p>
        )}
      </header>

      <div className='flex flex-wrap gap-2'>
        <Link href={`/app/pillars/${pillar.id}/edit`} className={secondaryButton}>
          <Pencil className='size-4' aria-hidden />
          Editar
        </Link>
        {isArchived ? (
          <ItemActionButton
            action={unarchivePillarAction}
            id={pillar.id}
            label='Desarquivar'
            className={secondaryButton}
          >
            <ArchiveRestore className='size-4' aria-hidden />
            Desarquivar
          </ItemActionButton>
        ) : (
          <ItemActionButton
            action={archivePillarAction}
            id={pillar.id}
            label='Arquivar'
            className={secondaryButton}
          >
            <Archive className='size-4' aria-hidden />
            Arquivar
          </ItemActionButton>
        )}
        <ConfirmDeleteDialog
          action={deletePillarAction}
          id={pillar.id}
          title={`Excluir “${pillar.name}”?`}
          description='A exclusão não pode ser desfeita. Se quiser apenas tirar o pilar das telas principais, arquive em vez de excluir.'
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
        <p className='mt-2 text-sm text-zinc-600 dark:text-zinc-400'>
          As metas e os hábitos deste pilar vão aparecer aqui.
        </p>
      </section>
    </>
  );
}
