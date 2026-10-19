import Link from 'next/link';
import { bodyText, caption, card, secondaryButton } from '@/shared/ui';

export type HabitTodayItem = {
  id: string;
  name: string;
  trackingType: string;
  targetValue: number | null;
  unit: string | null;
};

type Props = {
  habits: HabitTodayItem[];
};

export function HabitsTodayCard({ habits }: Props) {
  return (
    <section className={`${card} flex flex-col gap-3 p-4`}>
      <div className='flex items-center justify-between gap-2'>
        <h2 className='text-base font-semibold'>Hábitos de hoje</h2>
        <Link href='/app/check-in' className='text-sm text-muted underline'>
          Abrir check-in
        </Link>
      </div>
      {habits.length === 0 ? (
        <p className={caption}>
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
