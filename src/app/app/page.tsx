import Link from 'next/link';
import { Suspense } from 'react';
import { listAreas } from '@/features/areas/server';
import { auth, requireUserId, signOut } from '@/features/auth/server';
import {
  listGoals,
  listOpenNextSteps,
  type Goal,
  type OpenNextStep,
} from '@/features/goals/server';
import {
  listHabitsForDate,
  type HabitWithAreas,
} from '@/features/habits/server';
import { listHorizons } from '@/features/horizons/server';
import { getPreferences } from '@/features/preferences/server';
import { calendarDateInTimeZone } from '@/shared/lib/calendar';
import {
  bodyText,
  caption,
  card,
  KpiTile,
  primaryButton,
  secondaryButton,
} from '@/shared/ui';

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
    ...step,
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
          Hábitos ativos{' '}
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
          label='Meds'
          value='Em breve'
          hint='medicamentos na próxima fatia'
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

      <section className={`${card} flex flex-col gap-3 p-4`}>
        <h2 className='text-base font-semibold'>Ações rápidas</h2>
        <div className='flex flex-wrap gap-2'>
          <Link href='/app/check-in' className={primaryButton}>
            Check-in
          </Link>
          <Link href='/app/goals/new' className={secondaryButton}>
            Meta
          </Link>
          <Link href='/app/habits/new' className={secondaryButton}>
            Hábito
          </Link>
          <Link href='/app/areas/new' className={secondaryButton}>
            Criar área
          </Link>
        </div>
      </section>
    </>
  );
}

function HabitsTodayCard({ habits }: { habits: HabitWithAreas[] }) {
  return (
    <section className={`${card} flex flex-col gap-3 p-4`}>
      <div className='flex items-center justify-between gap-2'>
        <h2 className='text-base font-semibold'>Hábitos de hoje</h2>
        <Link href='/app/check-in' className='text-sm text-muted underline'>
          Abrir check-in
        </Link>
      </div>
      {habits.length === 0 ? (
        <p className={`${caption}`}>
          Nenhum hábito para hoje.{' '}
          <Link href='/app/habits/new' className='underline'>
            Criar hábito
          </Link>
        </p>
      ) : (
        <ul className='flex flex-col gap-2'>
          {habits.map((habit) => (
            <li
              key={habit.id}
              className='flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0'
            >
              <div className='flex flex-col gap-0.5'>
                <span className={bodyText}>{habit.name}</span>
                <span className={caption}>
                  {habit.trackingType === 'quantity'
                    ? `meta ${habit.targetValue} ${habit.unit}`
                    : 'conclusão'}
                  {' · '}
                  <span className='text-orange-600'>sem registro</span>
                </span>
              </div>
              <Link
                href='/app/check-in'
                className={`${secondaryButton} px-3 py-1 text-xs`}
              >
                Registrar
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ActiveGoalsCard({
  goals,
  horizons,
}: {
  goals: Goal[];
  horizons: Array<{ id: string; name: string }>;
}) {
  return (
    <section className={`${card} flex flex-col gap-3 p-4`}>
      <div className='flex items-center justify-between gap-2'>
        <h2 className='text-base font-semibold'>Metas ativas</h2>
        <Link href='/app/goals' className='text-sm text-muted underline'>
          Ver todas
        </Link>
      </div>
      {goals.length === 0 ? (
        <p className={caption}>
          Nenhuma meta ativa.{' '}
          <Link href='/app/goals/new' className='underline'>
            Criar meta
          </Link>
        </p>
      ) : (
        <ul className='flex flex-col gap-3'>
          {goals.slice(0, 5).map((goal) => {
            const horizon =
              horizons.find((item) => item.id === goal.horizonId)?.name ??
              'Horizonte';
            return (
              <li key={goal.id} className='flex flex-col gap-1'>
                <Link
                  href={`/app/goals/${goal.id}`}
                  className={`${bodyText} hover:underline`}
                >
                  {goal.title}
                </Link>
                <span className={caption}>{horizon}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function NextStepsCard({
  steps,
}: {
  steps: Array<OpenNextStep & { areaName: string }>;
}) {
  return (
    <section className={`${card} flex flex-col gap-3 p-4`}>
      <h2 className='text-base font-semibold'>Próximos passos</h2>
      {steps.length === 0 ? (
        <p className={caption}>Nenhum próximo passo aberto.</p>
      ) : (
        <ul className='flex flex-col gap-2'>
          {steps.map((step) => (
            <li
              key={step.id}
              className='flex items-center justify-between gap-2'
            >
              <span className={bodyText}>{step.title}</span>
              <span className='rounded-full bg-bg-app px-2 py-0.5 text-[11px] text-muted'>
                {step.areaName}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AreaSummaryCard({
  areas,
  goals,
}: {
  areas: Array<{ id: string; name: string }>;
  goals: Goal[];
}) {
  return (
    <section className={`${card} flex flex-col gap-3 p-4`}>
      <h2 className='text-base font-semibold'>Resumo por área</h2>
      {areas.length === 0 ? (
        <p className={caption}>
          <Link href='/app/areas/new' className='underline'>
            Criar área
          </Link>
        </p>
      ) : (
        <div className='grid gap-2 sm:grid-cols-2'>
          {areas.slice(0, 4).map((area) => {
            const count = goals.filter(
              (goal) => goal.primaryAreaId === area.id,
            ).length;
            return (
              <Link
                key={area.id}
                href={`/app/areas/${area.id}`}
                className='rounded-xl bg-bg-app p-3 hover:opacity-90'
              >
                <p className={bodyText}>{area.name}</p>
                <p className={caption}>
                  {count} {count === 1 ? 'meta' : 'metas'}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

function greetingForHour(timeZone: string): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
  );
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatLongDate(dateYmd: string, timeZone: string): string {
  const [year, month, day] = dateYmd.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}
