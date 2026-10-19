import Link from 'next/link';
import { Suspense } from 'react';
import { listAreas } from '@/features/areas/server';
import { requireUserId } from '@/features/auth/server';
import { HabitForm } from '@/features/habits';
import { createHabitAction } from '@/features/habits/server';
import { eyebrow } from '@/shared/ui';

export default function NewHabitPage() {
  return (
    <main className='mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 p-6'>
      <Link href='/app/habits' className='text-sm underline'>
        Voltar
      </Link>
      <header className='flex flex-col gap-1'>
        <span className={eyebrow}>Rotina</span>
        <h1 className='text-3xl font-semibold'>Novo hábito</h1>
        <p className='text-sm text-muted'>
          Crie o seu — sem lista fixa do sistema.
        </p>
      </header>
      <Suspense fallback={<p>Carregando…</p>}>
        <NewHabitForm />
      </Suspense>
    </main>
  );
}

async function NewHabitForm() {
  const userId = await requireUserId();
  const { active: areas } = await listAreas(userId);

  return (
    <HabitForm
      action={createHabitAction}
      areas={areas.map((area) => ({ id: area.id, name: area.name }))}
      submitLabel='Criar hábito'
      cancelHref='/app/habits'
    />
  );
}
