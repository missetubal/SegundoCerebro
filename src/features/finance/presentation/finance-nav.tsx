'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeftRight,
  BarChart3,
  CreditCard,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { caption } from '@/shared/ui';

const LINKS: Array<{ href: string; label: string; icon: ReactNode; match: (pathname: string) => boolean }> = [
  {
    href: '/app/finance',
    label: 'Visão geral',
    icon: <Wallet className='size-3.5' aria-hidden />,
    match: (pathname) => pathname === '/app/finance',
  },
  {
    href: '/app/finance/accounts',
    label: 'Contas e cartões',
    icon: <CreditCard className='size-3.5' aria-hidden />,
    match: (pathname) =>
      pathname.startsWith('/app/finance/accounts') || pathname.startsWith('/app/finance/cards'),
  },
  {
    href: '/app/finance/transactions',
    label: 'Lançamentos',
    icon: <ArrowLeftRight className='size-3.5' aria-hidden />,
    match: (pathname) => pathname.startsWith('/app/finance/transactions'),
  },
  {
    href: '/app/finance/spending',
    label: 'Gastos',
    icon: <BarChart3 className='size-3.5' aria-hidden />,
    match: (pathname) => pathname.startsWith('/app/finance/spending'),
  },
  {
    href: '/app/finance/investments',
    label: 'Investimentos',
    icon: <TrendingUp className='size-3.5' aria-hidden />,
    match: (pathname) => pathname.startsWith('/app/finance/investments'),
  },
];

export function FinanceNav({
  current: _current,
  placement = 'page',
}: {
  current?: string;
  placement?: 'page' | 'sidebar';
}) {
  const pathname = usePathname();
  if (placement === 'page') {
    return (
      <nav aria-label='Financeiro' className='-mx-4 overflow-x-auto px-4 md:hidden'>
        <ul className='flex min-w-max gap-1.5'>
          {LINKS.map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 ${
                    active
                      ? 'bg-ink text-bg-card'
                      : 'border border-border bg-bg-card text-muted hover:text-ink'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }
  return (
    <nav aria-label='Financeiro' className='flex flex-col gap-0.5'>
      <span className={`${caption} px-2.5 font-semibold uppercase tracking-widest`}>Financeiro</span>
      {LINKS.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-9 items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 ${
              active ? 'bg-bg-app text-ink' : 'text-muted hover:bg-bg-app hover:text-ink'
            }`}
          >
            <span className='flex size-3.5 shrink-0 items-center justify-center'>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
