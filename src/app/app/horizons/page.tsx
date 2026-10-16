import { Trash } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { MoveButtons } from '@/components/move-buttons';
import { card, eyebrow, iconButton } from '@/components/ui';
import { type Horizon, listHorizons } from '@/db/horizons';
import { requireUserId } from '@/lib/session';
import { deleteHorizonAction, moveHorizonAction } from './actions';
import { CreateHorizonForm, RenameHorizonForm } from './horizon-forms';

export default function HorizonsPage() {
  return (
    <main className='mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 p-6'>
      <Link href='/app' className='text-sm underline'>
        Voltar
      </Link>
      <header className='flex flex-col gap-1'>
        <span className={eyebrow}>Direção</span>
        <h1 className='text-3xl font-semibold'>Horizontes</h1>
        <p className='text-sm text-zinc-600 dark:text-zinc-400'>
          Curto, médio e longo prazo são rótulos seus — sem durações fixas no
          sistema.
        </p>
      </header>
      <Suspense fallback={<p>Carregando…</p>}>
        <HorizonsContent />
      </Suspense>
    </main>
  );
}

async function HorizonsContent() {
  const userId = await requireUserId();
  const horizons = await listHorizons(userId);

  return (
    <>
      {horizons.length === 0 ? (
        <section className={`${card} p-6 text-center`}>
          <p className='font-medium'>Nenhum horizonte por aqui.</p>
          <p className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
            Crie os rótulos que fazem sentido para as suas metas.
          </p>
        </section>
      ) : (
        <ol className='flex flex-col gap-3'>
          {horizons.map((horizon, index) => (
            <HorizonRow
              key={horizon.id}
              horizon={horizon}
              isFirst={index === 0}
              isLast={index === horizons.length - 1}
            />
          ))}
        </ol>
      )}
      <CreateHorizonForm />
    </>
  );
}

function HorizonRow({
  horizon,
  isFirst,
  isLast,
}: {
  horizon: Horizon;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <li className={`${card} flex items-center gap-2 p-3`}>
      <MoveButtons
        action={moveHorizonAction}
        id={horizon.id}
        name={horizon.name}
        isFirst={isFirst}
        isLast={isLast}
      />
      <RenameHorizonForm key={horizon.name} id={horizon.id} name={horizon.name} />
      <ConfirmDeleteDialog
        action={deleteHorizonAction}
        id={horizon.id}
        title={`Excluir “${horizon.name}”?`}
        description='A exclusão não pode ser desfeita. Você pode criar outro horizonte quando quiser.'
        triggerLabel={`Excluir ${horizon.name}`}
        triggerClassName={iconButton}
        trigger={<Trash className='size-4' aria-hidden />}
      />
    </li>
  );
}
