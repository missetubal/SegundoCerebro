import { Suspense } from 'react';
import { CheckInDateField, CheckInScreen, entryDateSchema } from '@/features/check-ins';
import {
  deleteCheckInAction,
  getCheckIn,
  saveCheckInAction,
} from '@/features/check-ins/server';
import { requireUserId } from '@/features/auth/server';
import { listHabitsForDate } from '@/features/habits/server';
import { listOccurrencesForDate } from '@/features/medications/server';
import { getPreferences } from '@/features/preferences/server';
import { calendarDateInTimeZone } from '@/shared/lib/calendar';
import { caption, card, eyebrow } from '@/shared/ui';

export default function CheckInPage({
  searchParams,
}: PageProps<'/app/check-in'>) {
  return (
    <main className='mx-auto flex w-full max-w-3xl flex-col gap-6 p-6'>
      <Suspense fallback={<p className='text-muted'>Carregando…</p>}>
        <CheckInContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function CheckInContent({
  searchParams,
}: {
  searchParams: PageProps<'/app/check-in'>['searchParams'];
}) {
  const userId = await requireUserId();
  const preferences = await getPreferences(userId);
  const today = calendarDateInTimeZone(preferences.timezone);
  const params = await searchParams;
  const rawDate = firstQueryValue(params.date);
  const requested = rawDate && rawDate.length > 0 ? rawDate : today;
  const parsed = entryDateSchema.safeParse(requested);

  if (!parsed.success || parsed.data > today) {
    const message = parsed.success
      ? 'Essa data ainda não está disponível.'
      : 'Data inválida.';
    return (
      <>
        <header className='flex flex-col gap-3'>
          <div className='flex flex-col gap-1'>
            <span className={eyebrow}>Check-in</span>
            <h1 className='text-3xl font-semibold'>Como foi este dia?</h1>
          </div>
          <CheckInDateField entryDate={today} today={today} />
        </header>
        <p className={`${card} p-4 text-sm`}>{message}</p>
        <p className={caption}>Em branco permanece neutro</p>
      </>
    );
  }

  const entryDate = parsed.data;
  const [habits, checkIn, medications] = await Promise.all([
    listHabitsForDate(userId, entryDate, preferences.timezone),
    getCheckIn(userId, entryDate),
    listOccurrencesForDate(userId, entryDate),
  ]);
  const applicableIds = new Set(habits.map((habit) => habit.id));
  const logsByHabit = new Map(
    checkIn.habitLogs.map((log) => [log.habitId, log]),
  );

  return (
    <CheckInScreen
      key={`${entryDate}:${checkIn.updatedAt?.toISOString() ?? 'empty'}:${checkIn.habitLogs
        .map((log) => `${log.id}:${log.completionStatus}:${log.value}`)
        .join('|')}:${medications
        .map((item) => `${item.medicationId}:${item.scheduledTime}:${item.status}`)
        .join('|')}`}
      action={saveCheckInAction}
      deleteAction={deleteCheckInAction}
      entryDate={entryDate}
      today={today}
      formattedDate={formatCalendarDate(entryDate)}
      isPast={entryDate !== today}
      generalNote={checkIn.generalNote}
      mood={checkIn.mood}
      hasSavedData={checkIn.createdAt !== null || checkIn.habitLogs.length > 0}
      habits={habits.map((habit) => {
        const log = logsByHabit.get(habit.id);
        return {
          id: habit.id,
          name: habit.name,
          trackingType: habit.trackingType,
          unit: habit.unit,
          targetValue: habit.targetValue,
          completionStatus: log?.completionStatus ?? null,
          value: log?.value ?? null,
        };
      })}
      orphans={checkIn.habitLogs
        .filter((log) => !applicableIds.has(log.habitId))
        .map((log) => ({
          habitId: log.habitId,
          habitName: log.habitName,
          summary: orphanSummary(log),
        }))}
      medications={medications.map((item) => ({
        medicationId: item.medicationId,
        name: item.name,
        scheduledTime: item.scheduledTime,
        status: item.status,
        orphan: item.orphan,
      }))}
    />
  );
}

function firstQueryValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function formatCalendarDate(entryDate: string): string {
  const [year, month, day] = entryDate.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function orphanSummary(log: {
  completionStatus: 'done' | 'not_done' | null;
  value: number | null;
  unit: string | null;
}): string {
  if (log.completionStatus === 'done') return 'Feito';
  if (log.completionStatus === 'not_done') return 'Não realizado';
  if (log.value != null) {
    return log.unit ? `${log.value} ${log.unit}` : String(log.value);
  }
  return 'Sem detalhe';
}
