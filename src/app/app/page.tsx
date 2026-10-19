import Link from 'next/link';
import { Suspense } from 'react';
import { AreaSummaryCard } from '@/features/areas';
import { listAreas } from '@/features/areas/server';
import { auth, requireUserId, signOut } from '@/features/auth/server';
import { ActiveGoalsCard, NextStepsCard } from '@/features/goals';
import { listGoals, listOpenNextSteps } from '@/features/goals/server';
import { HabitsTodayCard } from '@/features/habits';
import { listHabitsForDate } from '@/features/habits/server';
import { listHorizons } from '@/features/horizons/server';
import { getPreferences } from '@/features/preferences/server';
import {
  HomeQuickActions,
  formatLongDate,
  greetingForHour,
} from '@/features/shell';
import { calendarDateInTimeZone } from '@/shared/lib/calendar';
import { caption, KpiTile, primaryButton, secondaryButton } from '@/shared/ui';

export default function AppHome() {
  return (
    <main className='mx-auto flex w-full max-w-5xl flex-col gap-6 p-6'>
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
  const todayHabits = await listHabitsForDate(
    userId,
    today,
    preferences.timezone,
  );

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
        <div className='flex flex-wrap gap-2'>
          <Link href='/app/check-in' className={primaryButton}>
            Fazer check-in de hoje
          </Link>
          <Link href='/app/check-in' className={secondaryButton}>
            Preencher dia anterior
          </Link>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/' });
            }}
          >
            <button type='submit' className={secondaryButton}>
              Sair
            </button>
          </form>
        </div>
      </header>

      <div className='flex flex-wrap gap-3 text-sm text-muted'>
        <span>
          Hábitos hoje{' '}
          <strong className='text-ink'>{todayHabits.length}</strong>
        </span>
        <span>
          Metas ativas{' '}
          <strong className='text-ink'>{goals.active.length}</strong>
        </span>
      </div>

      <section className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <KpiTile
          pastel='sky'
          label='Check-in'
          value='Ainda não'
          hint='quando quiser'
        />
        <KpiTile
          pastel='mint'
          label='Hábitos hoje'
          value={`${todayHabits.length}`}
          hint='ativos para o dia'
        />
        <KpiTile
          pastel='peach'
          label='Medicamentos'
          value='No check-in'
          hint='organização do dia'
        />
        <KpiTile
          pastel='lilac'
          label='Áreas'
          value={String(areas.active.length)}
          hint='ativas'
        />
      </section>

      <section className='grid gap-4 lg:grid-cols-2'>
        <HabitsTodayCard habits={todayHabits} />
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
