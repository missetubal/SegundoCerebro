import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { card, eyebrow, primaryButton } from '@/shared/ui';
import { FinanceNav } from './finance-nav';

export function FinancePage({
  title,
  description,
  current,
  action,
  actions,
  children,
}: {
  title: string;
  description: string;
  current: string;
  action?: { href: string; label: string };
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className='mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 sm:p-6 md:gap-6 md:p-8'>
      <FinanceNav current={current} />
      <header className='flex flex-wrap items-end justify-between gap-3'>
        <div className='flex max-w-2xl flex-col gap-1.5'>
          <p className={eyebrow}>Financeiro</p>
          <h1 className='text-2xl font-semibold tracking-tight text-ink sm:text-3xl'>{title}</h1>
          <p className='text-sm leading-relaxed text-muted'>{description}</p>
        </div>
        {actions}
        {action && (
          <Link href={action.href} className={primaryButton}>
            {action.label}
          </Link>
        )}
      </header>
      {children}
    </main>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={`${card} flex flex-col gap-4 p-4 sm:p-5`}>
      <header className='flex flex-wrap items-start justify-between gap-3'>
        <div className='flex flex-col gap-1'>
          <h2 className='text-[15px] font-semibold text-ink'>{title}</h2>
          {description && <p className='text-sm leading-relaxed text-muted'>{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className='flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-8 text-center'>
      <p className='text-sm font-medium text-ink'>{title}</p>
      {hint && <p className='max-w-sm text-sm leading-relaxed text-muted'>{hint}</p>}
      {action && <div className='pt-1'>{action}</div>}
    </div>
  );
}

const PILL_TONES = {
  neutral: 'bg-bg-app text-muted',
  success: 'bg-pastel-mint text-emerald-700 dark:text-emerald-300',
  warning: 'bg-pastel-peach text-orange-700 dark:text-orange-300',
  info: 'bg-pastel-sky text-sky-700 dark:text-sky-300',
} as const;

export function StatusPill({
  tone = 'neutral',
  children,
}: {
  tone?: keyof typeof PILL_TONES;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${PILL_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function BackLink({ href, label = 'Voltar' }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className='inline-flex min-h-9 items-center gap-1.5 self-start rounded-lg px-2 text-sm font-medium text-muted transition-colors hover:bg-bg-app hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30'
    >
      <ArrowLeft className='size-4' aria-hidden />
      {label}
    </Link>
  );
}

export function FormShell({ children }: { children: ReactNode }) {
  return (
    <div className={`${card} p-4 sm:p-5`}>
      <div className='max-w-xl'>{children}</div>
    </div>
  );
}
