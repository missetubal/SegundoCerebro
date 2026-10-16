import Link from 'next/link';
import { Suspense } from 'react';
import { listAreas } from '@/features/areas/server';
import { requireUserId } from '@/features/auth/server';
import { GoalForm } from '@/features/goals';
import { createGoalAction } from '@/features/goals/server';
import { listHorizons } from '@/features/horizons/server';
import { eyebrow } from '@/shared/ui';

export default function NewGoalPage() {
  return (
    <main className='mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 p-6'>
      <Link href='/app/goals' className='text-sm underline'>
        Voltar
      </Link>
      <header className='flex flex-col gap-1'>
        <span className={eyebrow}>Direção</span>
        <h1 className='text-3xl font-semibold'>Nova meta</h1>
      </header>
      <Suspense fallback={<p>Carregando…</p>}>
        <NewGoalForm />
      </Suspense>
    </main>
  );
}

async function NewGoalForm() {
  const userId = await requireUserId();
  const [{ active: areas }, horizons] = await Promise.all([
    listAreas(userId),
    listHorizons(userId),
  ]);

  return (
    <GoalForm
      action={createGoalAction}
      areas={areas.map((area) => ({ id: area.id, name: area.name }))}
      horizons={horizons.map((horizon) => ({
        id: horizon.id,
        name: horizon.name,
      }))}
      submitLabel='Criar meta'
      cancelHref='/app/goals'
    />
  );
}
