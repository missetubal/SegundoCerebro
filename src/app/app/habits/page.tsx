import { Archive, ArchiveRestore, Pencil, Plus } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { requireUserId } from '@/features/auth/server';
import {
  archiveHabitAction,
  listHabits,
  listHabitsForDate,
  unarchiveHabitAction,
  type HabitWithAreas,
} from '@/features/habits/server';
import { getPreferences } from '@/features/preferences/server';
import { calendarDateInTimeZone } from '@/shared/lib/calendar';
import { ItemActionButton, card, eyebrow, iconButton, primaryButton } from '@/shared/ui';

export default function HabitsPage() {
  return (
    <main className='mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 p-6'>
      <Link href='/app' className='text-sm underline'>
        Voltar
      </Link>
      <header className='flex flex-wrap items-end justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <span className={eyebrow}>Rotina</span>
          <h1 className='text-3xl font-semibold'>Hábitos</h1>
          <p className='text-sm text-muted'>
            Hábitos livres, sem catálogo fixo — base do check-in diário.
          </p>
        </div>
        <Link href='/app/habits/new' className={primaryButton}>
          <Plus className='size-4' aria-hidden />
          Novo hábito
        </Link>
      </header>
      <Suspense fallback={<p>Carregando…</p>}>
        <HabitsContent />
      </Suspense>
    </main>
  );
}

async function HabitsContent() {
  const userId = await requireUserId();
  const preferences = await getPreferences(userId);
  const today = calendarDateInTimeZone(preferences.timezone);
  const [todayHabits, { active, archived }] = await Promise.all([
    listHabitsForDate(userId, today, preferences.timezone),
    listHabits(userId),
  ]);

  return (
    <>
      <section className='flex flex-col gap-3'>
        <h2 className='text-lg font-semibold'>Hoje</h2>
        <p className='text-sm text-muted'>
          Hábitos ativos para {today} ({preferences.timezone}).
        </p>
        {todayHabits.length === 0 ? (
          <p className={`${card} p-4 text-sm text-muted`}>
            Nenhum hábito para hoje — você pode criar um novo quando quiser.
          </p>
        ) : (
          <HabitList habits={todayHabits} showArchive />
        )}
      </section>

      <section className='flex flex-col gap-3'>
        <h2 className='text-lg font-semibold'>Todos os ativos</h2>
        {active.length === 0 ? (
          <p className={`${card} p-4 text-sm text-muted`}>
            Nenhum hábito ativo ainda.
          </p>
        ) : (
          <HabitList habits={active} showArchive />
        )}
      </section>

      {archived.length > 0 && (
        <details className='group'>
          <summary className='cursor-pointer text-lg font-semibold'>
            Arquivados ({archived.length})
          </summary>
          <div className='mt-3'>
            <HabitList habits={archived} showUnarchive />
          </div>
        </details>
      )}
    </>
  );
}

function HabitList({
  habits,
  showArchive = false,
  showUnarchive = false,
}: {
  habits: HabitWithAreas[];
  showArchive?: boolean;
  showUnarchive?: boolean;
}) {
  return (
    <ul className='flex flex-col gap-2'>
      {habits.map((habit) => (
        <li
          key={habit.id}
          className={`${card} flex flex-wrap items-center justify-between gap-3 p-4`}
        >
          <div className='flex flex-col gap-1'>
            <span className='font-medium'>{habit.name}</span>
            <span className='text-sm text-muted'>
              {habit.trackingType === 'completion'
                ? 'Conclusão'
                : `Quantidade · ${habit.targetValue} ${habit.unit}`}
              {' · '}
              {habit.frequencyKind === 'daily'
                ? 'Diário'
                : `Dias: ${(habit.weekdays ?? []).join(', ')}`}
            </span>
          </div>
          <div className='flex items-center gap-1'>
            <Link
              href={`/app/habits/${habit.id}/edit`}
              className={iconButton}
              aria-label={`Editar ${habit.name}`}
            >
              <Pencil className='size-4' aria-hidden />
            </Link>
            {showArchive && (
              <ItemActionButton
                action={archiveHabitAction}
                id={habit.id}
                label={`Arquivar ${habit.name}`}
                className={iconButton}
              >
                <Archive className='size-4' aria-hidden />
              </ItemActionButton>
            )}
            {showUnarchive && (
              <ItemActionButton
                action={unarchiveHabitAction}
                id={habit.id}
                label={`Desarquivar ${habit.name}`}
                className={iconButton}
              >
                <ArchiveRestore className='size-4' aria-hidden />
              </ItemActionButton>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
