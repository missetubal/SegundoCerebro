import Link from 'next/link';
import { Suspense } from 'react';
import { AreaSummaryCard } from '@/features/areas';
import { listAreas } from '@/features/areas/server';
import { auth, requireUserId, signOut } from '@/features/auth/server';
import { getCheckIn } from '@/features/check-ins/server';
import { ActiveGoalsCard, NextStepsCard } from '@/features/goals';
import { listGoals, listOpenNextSteps } from '@/features/goals/server';
import { HabitsTodayCard } from '@/features/habits';
import { listHabitsForDate } from '@/features/habits/server';
import { buildTodaySnapshot, TodayPanel } from '@/features/home';
import { listHorizons } from '@/features/horizons/server';
import { listOccurrencesForDate } from '@/features/medications/server';
import { getPreferences } from '@/features/preferences/server';
import {
  HomeQuickActions,
  formatLongDate,
  greetingForHour,
} from '@/features/shell';
import { calendarDateInTimeZone, shiftCalendarDate } from '@/shared/lib/calendar';
import { caption, primaryButton, secondaryButton } from '@/shared/ui';

export default function AppHome() {
  return (
    <main className='mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6'>
      <Suspense fallback={<p className='text-muted'>Carregando…</p>}>
        <HomeDashboard />
      </Suspense>
    </main>
  );
}

async function HomeDashboard() {
  const userId = await requireUserId();
  const [session, preferences, areas, goals, horizons, openStepsRaw] =
    await Promise.all([
      auth(),
      getPreferences(userId),
      listAreas(userId),
      listGoals(userId),
      listHorizons(userId),
      listOpenNextSteps(userId),
    ]);
  const today = calendarDateInTimeZone(preferences.timezone);
  const yesterday = shiftCalendarDate(today, -1);
  const [todayHabits, checkIn, medications] = await Promise.all([
    listHabitsForDate(userId, today, preferences.timezone),
    getCheckIn(userId, today),
    listOccurrencesForDate(userId, today),
  ]);
  const loggedHabitIds = new Set(checkIn.habitLogs.map((log) => log.habitId));
  const todaySnapshot = buildTodaySnapshot({
    checkInExists: checkIn.createdAt !== null,
    habits: todayHabits.map((habit) => ({ id: habit.id, name: habit.name })),
    habitLogs: checkIn.habitLogs,
    medications,
  });

  const areaById = new Map(
    [...areas.active, ...areas.archived].map((area) => [area.id, area.name]),
  );
  const openSteps = openStepsRaw.slice(0, 6).map((step) => ({
    id: step.id,
    title: step.title,
    areaName: areaById.get(step.primaryAreaId) ?? 'Área',
  }));

  const firstName = (session?.user?.name ?? 'você').split(' ')[0];
  const greeting = greetingForHour(preferences.timezone);
  const dateLabel = formatLongDate(today, preferences.timezone);

  return (
    <>
      <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-3xl font-semibold text-ink'>
            {greeting}, {firstName}
          </h1>
          <p className='text-sm text-muted'>{dateLabel}</p>
          <p className={caption}>
            Organize no seu ritmo — ausência não é falha
          </p>
        </div>
        <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap'>
          <Link href='/app/check-in' className={`${primaryButton} w-full sm:w-auto`}>
            Check-in de hoje
          </Link>
          <Link
            href={`/app/check-in?date=${yesterday}`}
            className={`${secondaryButton} w-full sm:w-auto`}
          >
            Dia anterior
          </Link>
          <form
            className='w-full sm:w-auto'
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/' });
            }}
          >
            <button type='submit' className={`${secondaryButton} w-full sm:w-auto`}>
              Sair
            </button>
          </form>
        </div>
      </header>

      <TodayPanel snapshot={todaySnapshot} />

      <section className='grid gap-4 lg:grid-cols-2'>
        <HabitsTodayCard
          habits={todayHabits.map((habit) => ({
            ...habit,
            recorded: loggedHabitIds.has(habit.id),
          }))}
        />
        <ActiveGoalsCard
          goals={goals.active}
          horizons={horizons.map((h) => ({ id: h.id, name: h.name }))}
        />
      </section>

      <section className='grid gap-4 lg:grid-cols-2'>
        <NextStepsCard steps={openSteps} />
        <AreaSummaryCard areas={areas.active} goals={goals.active} />
      </section>

      <HomeQuickActions />
    </>
  );
}
