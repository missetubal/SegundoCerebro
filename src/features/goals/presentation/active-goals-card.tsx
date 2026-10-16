import Link from 'next/link';
import { bodyText, caption, card } from '@/shared/ui';

export type ActiveGoalItem = {
  id: string;
  title: string;
  horizonId: string;
};

export type HorizonOption = {
  id: string;
  name: string;
};

type Props = {
  goals: ActiveGoalItem[];
  horizons: HorizonOption[];
};

export function ActiveGoalsCard({ goals, horizons }: Props) {
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
