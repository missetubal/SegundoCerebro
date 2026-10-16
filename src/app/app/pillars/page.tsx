import {
  Archive,
  ArchiveRestore,
  ArrowUpRight,
  Pencil,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { ItemActionButton } from '@/components/item-action-button';
import { MoveButtons } from '@/components/move-buttons';
import { PillarTile } from '@/components/pillar-tile';
import { card, eyebrow, iconButton, primaryButton } from '@/components/ui';
import { listPillars, type Pillar } from '@/db/pillars';
import { requireUserId } from '@/lib/session';
import {
  archivePillarAction,
  movePillarAction,
  unarchivePillarAction,
} from './actions';

export default function PillarsPage() {
  return (
    <main className='mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 p-6'>
      <Link href='/app' className='text-sm underline'>
        Voltar
      </Link>
      <header className='flex flex-wrap items-end justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <span className={eyebrow}>Estrutura</span>
          <h1 className='text-3xl font-semibold'>Pilares</h1>
          <p className='text-sm text-zinc-600 dark:text-zinc-400'>
            As áreas da sua vida que você acompanha. Reordene, edite cores e
            ícones quando quiser.
          </p>
        </div>
        <Link href='/app/pillars/new' className={primaryButton}>
          <Plus className='size-4' aria-hidden />
          Novo pilar
        </Link>
      </header>
      <Suspense fallback={<p>Carregando…</p>}>
        <PillarsContent />
      </Suspense>
    </main>
  );
}

async function PillarsContent() {
  const userId = await requireUserId();
  const { active, archived } = await listPillars(userId);

  return (
    <>
      {active.length === 0 ? (
        <section className={`${card} flex flex-col items-center gap-3 p-8 text-center`}>
          <p className='font-medium'>Nenhum pilar ativo por aqui.</p>
          <p className='text-sm text-zinc-600 dark:text-zinc-400'>
            Comece pelas áreas que mais importam para você agora.
          </p>
          <Link href='/app/pillars/new' className={primaryButton}>
            <Plus className='size-4' aria-hidden />
            Novo pilar
          </Link>
        </section>
      ) : (
        <ol className='flex flex-col gap-3'>
          {active.map((pillar, index) => (
            <ActivePillarRow
              key={pillar.id}
              pillar={pillar}
              isFirst={index === 0}
              isLast={index === active.length - 1}
            />
          ))}
        </ol>
      )}

      {archived.length > 0 && (
        <details className='group'>
          <summary className='cursor-pointer text-sm font-medium text-zinc-600 dark:text-zinc-400'>
            Arquivados ({archived.length})
          </summary>
          <ul className='mt-3 flex flex-col gap-3'>
            {archived.map((pillar) => (
              <ArchivedPillarRow key={pillar.id} pillar={pillar} />
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

function PillarSummary({ pillar }: { pillar: Pillar }) {
  return (
    <>
      <PillarTile color={pillar.color} icon={pillar.icon} />
      <div className='min-w-0 flex-1'>
        <p className='truncate font-medium'>{pillar.name}</p>
        {pillar.description && (
          <p className='truncate text-sm text-zinc-600 dark:text-zinc-400'>
            {pillar.description}
          </p>
        )}
      </div>
    </>
  );
}

function ActivePillarRow({
  pillar,
  isFirst,
  isLast,
}: {
  pillar: Pillar;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <li className={`${card} flex items-center gap-3 p-3`}>
      <MoveButtons
        action={movePillarAction}
        id={pillar.id}
        name={pillar.name}
        isFirst={isFirst}
        isLast={isLast}
      />
      <PillarSummary pillar={pillar} />
      <Link
        href={`/app/pillars/${pillar.id}`}
        className='inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900'
      >
        Abrir
        <ArrowUpRight className='size-4' aria-hidden />
      </Link>
      <Link
        href={`/app/pillars/${pillar.id}/edit`}
        aria-label={`Editar ${pillar.name}`}
        title={`Editar ${pillar.name}`}
        className={iconButton}
      >
        <Pencil className='size-4' aria-hidden />
      </Link>
      <ItemActionButton
        action={archivePillarAction}
        id={pillar.id}
        label={`Arquivar ${pillar.name}`}
        className={iconButton}
      >
        <Archive className='size-4' aria-hidden />
      </ItemActionButton>
    </li>
  );
}

function ArchivedPillarRow({ pillar }: { pillar: Pillar }) {
  return (
    <li className={`${card} flex items-center gap-3 p-3 opacity-80`}>
      <PillarSummary pillar={pillar} />
      <Link
        href={`/app/pillars/${pillar.id}`}
        className='inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900'
      >
        Abrir
        <ArrowUpRight className='size-4' aria-hidden />
      </Link>
      <ItemActionButton
        action={unarchivePillarAction}
        id={pillar.id}
        label={`Desarquivar ${pillar.name}`}
        className={iconButton}
      >
        <ArchiveRestore className='size-4' aria-hidden />
      </ItemActionButton>
    </li>
  );
}
