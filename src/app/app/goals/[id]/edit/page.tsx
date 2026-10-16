import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { listAreas } from '@/features/areas/server';
import { requireUserId } from '@/features/auth/server';
import { GoalForm, parseGoalStatus } from '@/features/goals';
import {
  getGoal,
  updateGoalAction,
  type Goal,
} from '@/features/goals/server';
import { listHorizons } from '@/features/horizons/server';
import { eyebrow } from '@/shared/ui';

export default function EditGoalPage({
  params,
}: PageProps<'/app/goals/[id]/edit'>) {
  return (
    <main className='mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 p-6'>
      <Suspense fallback={<p>Carregando…</p>}>
        <EditGoalContent params={params} />
      </Suspense>
    </main>
  );
}

async function EditGoalContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();
  const goal = await getGoal(userId, id);
  if (!goal) notFound();

  const [{ active, archived }, horizons] = await Promise.all([
    listAreas(userId),
    listHorizons(userId),
  ]);

  const areaOptions = areaOptionsForGoal(active, archived, goal.primaryAreaId);

  return (
    <>
      <Link href={`/app/goals/${goal.id}`} className='text-sm underline'>
        Voltar
      </Link>
      <header className='flex flex-col gap-1'>
        <span className={eyebrow}>Direção</span>
        <h1 className='text-3xl font-semibold'>Editar meta</h1>
      </header>
      <GoalForm
        action={updateGoalAction}
        areas={areaOptions}
        horizons={horizons.map((horizon) => ({
          id: horizon.id,
          name: horizon.name,
        }))}
        initial={toFormValues(goal)}
        submitLabel='Salvar'
        cancelHref={`/app/goals/${goal.id}`}
      />
    </>
  );
}

function areaOptionsForGoal(
  active: Array<{ id: string; name: string }>,
  archived: Array<{ id: string; name: string }>,
  primaryAreaId: string,
) {
  const options = active.map((area) => ({ id: area.id, name: area.name }));
  if (options.some((area) => area.id === primaryAreaId)) return options;

  const current = archived.find((area) => area.id === primaryAreaId);
  if (current) {
    options.push({
      id: current.id,
      name: `${current.name} (arquivada)`,
    });
  }
  return options;
}

function toFormValues(goal: Goal) {
  return {
    id: goal.id,
    title: goal.title,
    primaryAreaId: goal.primaryAreaId,
    horizonId: goal.horizonId,
    status: parseGoalStatus(goal.status),
    startDate: goal.startDate,
    targetDate: goal.targetDate,
  };
}
