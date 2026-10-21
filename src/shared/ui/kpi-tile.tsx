import type { ReactNode } from 'react';
import { caption } from './tokens';

const PASTEL = {
  sky: {
    bg: 'bg-pastel-sky',
    label: 'text-sky-700 dark:text-sky-300',
  },
  mint: {
    bg: 'bg-pastel-mint',
    label: 'text-emerald-700 dark:text-emerald-300',
  },
  peach: {
    bg: 'bg-pastel-peach',
    label: 'text-orange-700 dark:text-orange-300',
  },
  lilac: {
    bg: 'bg-pastel-lilac',
    label: 'text-violet-700 dark:text-violet-300',
  },
  rose: {
    bg: 'bg-pastel-rose',
    label: 'text-rose-700 dark:text-rose-300',
  },
} as const;

export type KpiPastel = keyof typeof PASTEL;

type Props = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  pastel: KpiPastel;
};

export function KpiTile({ label, value, hint, pastel }: Props) {
  const tone = PASTEL[pastel];
  return (
    <div className={`flex flex-col gap-1 rounded-2xl p-4 ${tone.bg}`}>
      <span className={`${caption} font-semibold uppercase tracking-wider ${tone.label}`}>
        {label}
      </span>
      <span className='text-xl font-semibold tracking-tight text-ink tabular-nums'>{value}</span>
      {hint != null && <span className={caption}>{hint}</span>}
    </div>
  );
}
