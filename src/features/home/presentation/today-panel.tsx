import Link from 'next/link';
import { caption, KpiTile } from '@/shared/ui';
import type { TodaySnapshot } from '../domain';

type Props = {
  snapshot: TodaySnapshot;
};

export function TodayPanel({ snapshot }: Props) {
  const nothingPending =
    snapshot.pendingHabits.length === 0 &&
    snapshot.pendingMedications.length === 0;

  return (
    <section className='flex flex-col gap-3'>
      <h2 className='text-base font-semibold text-ink'>Hoje</h2>

      <div className='grid gap-3 sm:grid-cols-3'>
        <KpiTile
          pastel='sky'
          label='Check-in'
          value={snapshot.checkInDone ? 'Feito' : 'Em aberto'}
          hint={snapshot.checkInDone ? 'registrado hoje' : 'quando quiser'}
        />
        <KpiTile
          pastel='mint'
          label='Hábitos'
          value={habitValue(snapshot)}
          hint={habitHint(snapshot)}
        />
        <KpiTile
          pastel='peach'
          label='Medicamentos'
          value={medicationValue(snapshot)}
          hint={medicationHint(snapshot)}
        />
      </div>

      {nothingPending ? (
        <p className='text-sm text-muted'>Nada pendente para hoje.</p>
      ) : (
        <ul className='flex flex-col gap-2'>
          {snapshot.pendingHabits.map((habit) => (
            <li key={habit.id}>
              <Link
                href='/app/check-in'
                className='flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border bg-bg-card px-3 py-2'
              >
                <span className='min-w-0 text-sm font-medium text-ink'>{habit.name}</span>
                <span className={`${caption} shrink-0`}>Em aberto</span>
              </Link>
            </li>
          ))}
          {snapshot.pendingMedications.map((item) => (
            <li key={item.key}>
              <Link
                href='/app/check-in'
                className='flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border bg-bg-card px-3 py-2'
              >
                <span className='min-w-0 text-sm font-medium text-ink'>
                  {item.name}
                  <span className='font-normal text-muted'>
                    {' '}
                    · {item.scheduledTime}
                  </span>
                </span>
                <span className={`${caption} shrink-0`}>Em aberto</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function habitValue(snapshot: TodaySnapshot): string {
  if (snapshot.habitsDue === 0) return 'Nenhum previsto';
  if (snapshot.pendingHabits.length === 0) return 'Em dia';
  return String(snapshot.pendingHabits.length);
}

function habitHint(snapshot: TodaySnapshot): string {
  if (snapshot.habitsDue === 0) return 'hoje está livre';
  if (snapshot.pendingHabits.length === 0) return 'nada em aberto';
  return 'em aberto';
}

function medicationValue(snapshot: TodaySnapshot): string {
  if (snapshot.medicationsDue === 0) return 'Nenhum previsto';
  if (snapshot.pendingMedications.length === 0) return 'Em dia';
  return String(snapshot.pendingMedications.length);
}

function medicationHint(snapshot: TodaySnapshot): string {
  if (snapshot.medicationsDue === 0) return 'hoje está livre';
  if (snapshot.pendingMedications.length === 0) return 'nada em aberto';
  return 'em aberto';
}
