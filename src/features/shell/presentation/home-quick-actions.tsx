import Link from 'next/link';
import { card, primaryButton, secondaryButton } from '@/shared/ui';

export function HomeQuickActions() {
  return (
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
  );
}
