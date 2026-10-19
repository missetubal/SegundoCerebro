import Link from 'next/link';
import { bodyText, caption, card } from '@/shared/ui';

export type AreaSummaryItem = {
  id: string;
  name: string;
};

export type AreaGoalCountItem = {
  primaryAreaId: string;
};

type Props = {
  areas: AreaSummaryItem[];
  goals: AreaGoalCountItem[];
};

export function AreaSummaryCard({ areas, goals }: Props) {
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
