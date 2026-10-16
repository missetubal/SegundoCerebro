import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { listAreas } from '@/features/areas/server';
import { requireUserId } from '@/features/auth/server';
import { GoalForm } from '@/features/goals';
import {
  getGoal,
  updateGoalAction,
  type Goal,
} from '@/features/goals/server';
import type { GoalStatus } from '@/features/goals';
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

  const [{ active: areas }, horizons] = await Promise.all([
    listAreas(userId),
    listHorizons(userId),
  ]);

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
        areas={areas.map((area) => ({ id: area.id, name: area.name }))}
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

function toFormValues(goal: Goal) {
  return {
    id: goal.id,
    title: goal.title,
    primaryAreaId: goal.primaryAreaId,
    horizonId: goal.horizonId,
    status: goal.status as GoalStatus,
    startDate: goal.startDate,
    targetDate: goal.targetDate,
  };
}
