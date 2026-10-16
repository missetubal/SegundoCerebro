import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { requireUserId } from '@/features/auth/server';
import { listGoals, type Goal } from '@/features/goals/server';
import { card, eyebrow, primaryButton } from '@/shared/ui';

export default function GoalsPage() {
  return (
    <main className='mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 p-6'>
      <Link href='/app' className='text-sm underline'>
        Voltar
      </Link>
      <header className='flex flex-wrap items-end justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <span className={eyebrow}>Direção</span>
          <h1 className='text-3xl font-semibold'>Metas</h1>
          <p className='text-sm text-muted'>
            Metas leves ligadas a uma área e a um horizonte.
          </p>
        </div>
        <Link href='/app/goals/new' className={primaryButton}>
          <Plus className='size-4' aria-hidden />
          Nova meta
        </Link>
      </header>
      <Suspense fallback={<p>Carregando…</p>}>
        <GoalsContent />
      </Suspense>
    </main>
  );
}

async function GoalsContent() {
  const userId = await requireUserId();
  const { active, completed, archived } = await listGoals(userId);

  return (
    <>
      <GoalSection title='Ativas' goals={active} empty='Nenhuma meta ativa ainda.' />
      <GoalSection
        title='Concluídas'
        goals={completed}
        empty='Nenhuma meta concluída.'
      />
      <GoalSection
        title='Arquivadas'
        goals={archived}
        empty='Nenhuma meta arquivada.'
      />
    </>
  );
}

function GoalSection({
  title,
  goals,
  empty,
}: {
  title: string;
  goals: Goal[];
  empty: string;
}) {
  return (
    <section className='flex flex-col gap-3'>
      <h2 className='text-lg font-semibold'>{title}</h2>
      {goals.length === 0 ? (
        <p className={`${card} p-4 text-sm text-muted`}>{empty}</p>
      ) : (
        <ul className='flex flex-col gap-2'>
          {goals.map((goal) => (
            <li key={goal.id}>
              <Link
                href={`/app/goals/${goal.id}`}
                className={`${card} flex items-center justify-between gap-3 p-4 hover:bg-bg-app`}
              >
                <span className='font-medium'>{goal.title}</span>
                <span className='text-sm text-muted'>Abrir</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
