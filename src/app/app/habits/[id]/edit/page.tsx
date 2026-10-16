import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { listAreas } from '@/features/areas/server';
import { requireUserId } from '@/features/auth/server';
import { HabitForm } from '@/features/habits';
import {
  getHabit,
  updateHabitAction,
  type HabitWithAreas,
} from '@/features/habits/server';
import { eyebrow } from '@/shared/ui';

export default function EditHabitPage({
  params,
}: PageProps<'/app/habits/[id]/edit'>) {
  return (
    <main className='mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 p-6'>
      <Suspense fallback={<p>Carregando…</p>}>
        <EditHabitContent params={params} />
      </Suspense>
    </main>
  );
}

async function EditHabitContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();
  const habit = await getHabit(userId, id);
  if (!habit) notFound();

  const { active, archived } = await listAreas(userId);
  const areaOptions = areaOptionsForHabit(active, archived, habit.areaIds);

  return (
    <>
      <Link href='/app/habits' className='text-sm underline'>
        Voltar
      </Link>
      <header className='flex flex-col gap-1'>
        <span className={eyebrow}>Rotina</span>
        <h1 className='text-3xl font-semibold'>Editar hábito</h1>
      </header>
      <HabitForm
        action={updateHabitAction}
        areas={areaOptions}
        initial={toFormValues(habit)}
        submitLabel='Salvar'
        cancelHref='/app/habits'
      />
    </>
  );
}

function areaOptionsForHabit(
  active: Array<{ id: string; name: string }>,
  archived: Array<{ id: string; name: string }>,
  linkedIds: string[],
) {
  const options = active.map((area) => ({ id: area.id, name: area.name }));
  const activeIds = new Set(options.map((area) => area.id));
  for (const id of linkedIds) {
    if (activeIds.has(id)) continue;
    const archivedArea = archived.find((area) => area.id === id);
    if (archivedArea) {
      options.push({
        id: archivedArea.id,
        name: `${archivedArea.name} (arquivada)`,
      });
    }
  }
  return options;
}

function toFormValues(habit: HabitWithAreas) {
  return {
    id: habit.id,
    name: habit.name,
    trackingType: habit.trackingType,
    frequencyKind: habit.frequencyKind,
    weekdays: habit.weekdays,
    targetValue: habit.targetValue,
    unit: habit.unit,
    areaIds: habit.areaIds,
  };
}
