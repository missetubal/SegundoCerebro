import { ArrowLeft, Check, Pencil, Trash } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { listAreas } from '@/features/areas/server';
import { requireUserId } from '@/features/auth/server';
import { NextStepForm } from '@/features/goals';
import {
  completeNextStepAction,
  createNextStepAction,
  deleteGoalAction,
  deleteNextStepAction,
  getGoal,
  listNextSteps,
  setGoalStatusAction,
} from '@/features/goals/server';
import { listHorizons } from '@/features/horizons/server';
import { ConfirmDeleteDialog, ItemActionButton } from '@/shared/ui';
import { card, eyebrow, primaryButton, secondaryButton } from '@/shared/ui';

export default function GoalPage({ params }: PageProps<'/app/goals/[id]'>) {
  return (
    <main className='mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 p-6'>
      <Link
        href='/app/goals'
        className='inline-flex items-center gap-2 self-start text-sm'
      >
        <ArrowLeft className='size-4' aria-hidden />
        Metas
      </Link>
      <Suspense fallback={<p>Carregando…</p>}>
        <GoalDetail params={params} />
      </Suspense>
    </main>
  );
}

async function GoalDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();
  const goal = await getGoal(userId, id);
  if (!goal) notFound();

  const [areas, horizons, steps] = await Promise.all([
    listAreas(userId),
    listHorizons(userId),
    listNextSteps(userId, goal.id),
  ]);
  const areaName =
    [...areas.active, ...areas.archived].find(
      (area) => area.id === goal.primaryAreaId,
    )?.name ?? 'Área';
  const horizonName =
    horizons.find((horizon) => horizon.id === goal.horizonId)?.name ??
    'Horizonte';

  return (
    <>
      <header className='flex flex-col gap-3'>
        <span className={eyebrow}>Meta</span>
        <h1 className='text-3xl font-semibold'>{goal.title}</h1>
        <p className='text-sm text-muted'>
          Área: {areaName} · Horizonte: {horizonName}
        </p>
        <div className='flex flex-wrap gap-2'>
          <Link
            href={`/app/goals/${goal.id}/edit`}
            className={secondaryButton}
          >
            <Pencil className='size-4' aria-hidden />
            Editar
          </Link>
          {goal.status !== 'completed' && (
            <ItemActionButton
              action={setGoalStatusAction}
              id={goal.id}
              label='Concluir meta'
              fields={{ status: 'completed' }}
              className={secondaryButton}
            >
              <Check className='size-4' aria-hidden />
              Concluir
            </ItemActionButton>
          )}
          {goal.status !== 'archived' && (
            <ItemActionButton
              action={setGoalStatusAction}
              id={goal.id}
              label='Arquivar meta'
              fields={{ status: 'archived' }}
              className={secondaryButton}
            >
              Arquivar
            </ItemActionButton>
          )}
          {goal.status !== 'active' && (
            <ItemActionButton
              action={setGoalStatusAction}
              id={goal.id}
              label='Reativar meta'
              fields={{ status: 'active' }}
              className={secondaryButton}
            >
              Reativar
            </ItemActionButton>
          )}
          <ConfirmDeleteDialog
            action={deleteGoalAction}
            id={goal.id}
            title='Excluir meta?'
            description='Isso remove a meta e os próximos passos. Prefira arquivar se quiser guardar o histórico.'
            triggerClassName={secondaryButton}
            triggerLabel='Excluir meta'
            trigger={
              <>
                <Trash className='size-4' aria-hidden />
                Excluir
              </>
            }
          />
        </div>
      </header>

      <section className={`${card} flex flex-col gap-4 p-5`}>
        <h2 className='text-lg font-semibold'>Próximos passos</h2>
        {steps.length === 0 ? (
          <p className='text-sm text-muted'>
            Ainda não há próximos passos — tudo bem. Você pode adicionar quando
            quiser.
          </p>
        ) : (
          <ul className='flex flex-col gap-2'>
            {steps.map((step) => (
              <li
                key={step.id}
                className='flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 last:border-0'
              >
                <span
                  className={
                    step.status === 'done' ? 'text-muted line-through' : ''
                  }
                >
                  {step.title}
                </span>
                <div className='flex gap-2'>
                  {step.status === 'open' && (
                    <ItemActionButton
                      action={completeNextStepAction}
                      id={step.id}
                      label='Concluir passo'
                      className={primaryButton}
                    >
                      Concluir
                    </ItemActionButton>
                  )}
                  <ItemActionButton
                    action={deleteNextStepAction}
                    id={step.id}
                    label='Remover passo'
                    className={secondaryButton}
                  >
                    Remover
                  </ItemActionButton>
                </div>
              </li>
            ))}
          </ul>
        )}
        <NextStepForm goalId={goal.id} action={createNextStepAction} />
      </section>
    </>
  );
}
