import {
  Archive,
  ArchiveRestore,
  ArrowUpRight,
  Pencil,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { ItemActionButton } from '@/shared/ui';
import { MoveButtons } from '@/shared/ui';
import { AreaTile } from '@/features/areas';
import { card, eyebrow, iconButton, primaryButton } from '@/shared/ui';
import { listAreas, type Area } from '@/features/areas/server';
import { requireUserId } from '@/features/auth/server';
import {
  archiveAreaAction,
  moveAreaAction,
  unarchiveAreaAction,
} from '@/features/areas/server';

export default function AreasPage() {
  return (
    <main className='mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 p-6'>
      <Link href='/app' className='text-sm underline'>
        Voltar
      </Link>
      <header className='flex flex-wrap items-end justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <span className={eyebrow}>Estrutura</span>
          <h1 className='text-3xl font-semibold'>Áreas</h1>
          <p className='text-sm text-muted'>
            As áreas da sua vida que você acompanha. Reordene, edite cores e
            ícones quando quiser.
          </p>
        </div>
        <Link href='/app/areas/new' className={primaryButton}>
          <Plus className='size-4' aria-hidden />
          Nova área
        </Link>
      </header>
      <Suspense fallback={<p>Carregando…</p>}>
        <AreasContent />
      </Suspense>
    </main>
  );
}

async function AreasContent() {
  const userId = await requireUserId();
  const { active, archived } = await listAreas(userId);

  return (
    <>
      {active.length === 0 ? (
        <section className={`${card} flex flex-col items-center gap-3 p-8 text-center`}>
          <p className='font-medium'>Nenhuma área ainda — que tal Finanças, Planejamento ou Aprendizado?</p>
          <p className='text-sm text-muted'>
            Comece pelas áreas que mais importam para você agora.
          </p>
          <Link href='/app/areas/new' className={primaryButton}>
            <Plus className='size-4' aria-hidden />
            Nova área
          </Link>
        </section>
      ) : (
        <ol className='flex flex-col gap-3'>
          {active.map((area, index) => (
            <ActiveAreaRow
              key={area.id}
              area={area}
              isFirst={index === 0}
              isLast={index === active.length - 1}
            />
          ))}
        </ol>
      )}

      {archived.length > 0 && (
        <details className='group'>
          <summary className='cursor-pointer text-sm font-medium text-muted'>
            Arquivados ({archived.length})
          </summary>
          <ul className='mt-3 flex flex-col gap-3'>
            {archived.map((area) => (
              <ArchivedAreaRow key={area.id} area={area} />
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

function AreaSummary({ area }: { area: Area }) {
  return (
    <>
      <AreaTile color={area.color} icon={area.icon} />
      <div className='min-w-0 flex-1'>
        <p className='truncate font-medium'>{area.name}</p>
        {area.description && (
          <p className='truncate text-sm text-muted'>
            {area.description}
          </p>
        )}
      </div>
    </>
  );
}

function ActiveAreaRow({
  area,
  isFirst,
  isLast,
}: {
  area: Area;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <li className={`${card} flex items-center gap-3 p-3`}>
      <MoveButtons
        action={moveAreaAction}
        id={area.id}
        name={area.name}
        isFirst={isFirst}
        isLast={isLast}
      />
      <AreaSummary area={area} />
      <Link
        href={`/app/areas/${area.id}`}
        className='inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm text-ink hover:bg-bg-app'
      >
        Abrir
        <ArrowUpRight className='size-4' aria-hidden />
      </Link>
      <Link
        href={`/app/areas/${area.id}/edit`}
        aria-label={`Editar ${area.name}`}
        title={`Editar ${area.name}`}
        className={iconButton}
      >
        <Pencil className='size-4' aria-hidden />
      </Link>
      <ItemActionButton
        action={archiveAreaAction}
        id={area.id}
        label={`Arquivar ${area.name}`}
        className={iconButton}
      >
        <Archive className='size-4' aria-hidden />
      </ItemActionButton>
    </li>
  );
}

function ArchivedAreaRow({ area }: { area: Area }) {
  return (
    <li className={`${card} flex items-center gap-3 p-3 opacity-80`}>
      <AreaSummary area={area} />
      <Link
        href={`/app/areas/${area.id}`}
        className='inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm text-ink hover:bg-bg-app'
      >
        Abrir
        <ArrowUpRight className='size-4' aria-hidden />
      </Link>
      <ItemActionButton
        action={unarchiveAreaAction}
        id={area.id}
        label={`Desarquivar ${area.name}`}
        className={iconButton}
      >
        <ArchiveRestore className='size-4' aria-hidden />
      </ItemActionButton>
    </li>
  );
}
