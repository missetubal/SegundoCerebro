'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  BookOpen,
  HeartPulse,
  History,
  Home,
  Layers,
  Pill,
  Settings,
  Target,
  Wallet,
} from 'lucide-react';
import { FinanceNav } from '@/features/finance/presentation/finance-nav';
import { caption } from '@/shared/ui';

export type SidebarArea = {
  id: string;
  name: string;
};

type Props = {
  areas: SidebarArea[];
  userName: string | null | undefined;
};

function NavLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium whitespace-nowrap md:py-1.5 ${
        active
          ? 'bg-bg-app text-ink'
          : 'text-muted hover:bg-bg-app hover:text-ink'
      }`}
    >
      <span className='flex size-3.5 shrink-0 items-center justify-center'>
        {icon}
      </span>
      {label}
    </Link>
  );
}

export function AppSidebar({ areas, userName }: Props) {
  const pathname = usePathname();
  const is = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);

  return (
    <>
      <nav
        aria-label='Principal'
        className='flex gap-1 overflow-x-auto border-b border-border bg-bg-card px-3 py-2 md:hidden'
      >
        <NavLink
          href='/app'
          label='Início'
          active={pathname === '/app'}
          icon={<Home className='size-3.5' aria-hidden />}
        />
        <NavLink
          href='/app/check-in'
          label='Check-in'
          active={is('/app/check-in')}
          icon={<HeartPulse className='size-3.5' aria-hidden />}
        />
        <NavLink
          href='/app/habits'
          label='Hábitos'
          active={is('/app/habits')}
          icon={<HeartPulse className='size-3.5' aria-hidden />}
        />
        <NavLink
          href='/app/medications'
          label='Medicamentos'
          active={is('/app/medications')}
          icon={<Pill className='size-3.5' aria-hidden />}
        />
        <NavLink
          href='/app/goals'
          label='Metas'
          active={is('/app/goals')}
          icon={<Target className='size-3.5' aria-hidden />}
        />
        <NavLink
          href='/app/finance'
          label='Finanças'
          active={is('/app/finance')}
          icon={<Wallet className='size-3.5' aria-hidden />}
        />
      </nav>
      <aside className='hidden h-dvh w-56 shrink-0 flex-col border-r border-border bg-bg-card md:flex'>
      <div className='flex flex-col gap-0.5 border-b border-border px-4 py-4'>
        <span className='text-sm font-semibold text-ink'>Segundo Cérebro</span>
        <span className={caption}>Protótipo</span>
      </div>

      <nav className='flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4'>
        <div className='flex flex-col gap-0.5'>
          <NavLink
            href='/app'
            label='Início'
            active={pathname === '/app'}
            icon={<Home className='size-3.5' aria-hidden />}
          />
          <span
            className='flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-muted/60'
            title='Em breve'
          >
            <History className='size-3.5' aria-hidden />
            Histórico
          </span>
          <NavLink
            href='/app/goals'
            label='Metas'
            active={is('/app/goals')}
            icon={<Target className='size-3.5' aria-hidden />}
          />
          <NavLink
            href='/app/habits'
            label='Hábitos'
            active={is('/app/habits')}
            icon={<HeartPulse className='size-3.5' aria-hidden />}
          />
          <NavLink
            href='/app/check-in'
            label='Check-in'
            active={is('/app/check-in')}
            icon={<HeartPulse className='size-3.5' aria-hidden />}
          />
          <NavLink
            href='/app/medications'
            label='Medicamentos'
            active={is('/app/medications')}
            icon={<Pill className='size-3.5' aria-hidden />}
          />
          {!is('/app/finance') && (
            <NavLink
              href='/app/finance'
              label='Finanças'
              icon={<Wallet className='size-3.5' aria-hidden />}
            />
          )}
        </div>

        {areas.length > 0 && (
          <div className='flex flex-col gap-0.5'>
            <span className={`${caption} px-2.5 font-semibold uppercase`}>
              Áreas
            </span>
            {areas.map((area) => (
              <NavLink
                key={area.id}
                href={`/app/areas/${area.id}`}
                label={area.name}
                active={
                  is(`/app/areas/${area.id}`) && !pathname.includes('/edit')
                }
                icon={
                  <span className='flex size-3.5 items-center justify-center text-[9px] font-bold'>
                    {area.name.trim().charAt(0).toUpperCase() || '?'}
                  </span>
                }
              />
            ))}
          </div>
        )}

        {areas.length === 0 && (
          <p className={`${caption} px-2.5`}>
            Crie áreas para montar a navegação.
          </p>
        )}

        {is('/app/finance') && <FinanceNav placement='sidebar' />}

        <div className='flex flex-col gap-0.5'>
          <span className={`${caption} px-2.5 font-semibold uppercase`}>
            Atalhos
          </span>
          <NavLink
            href='/app/horizons'
            label='Horizontes'
            active={is('/app/horizons')}
            icon={<BookOpen className='size-3.5' aria-hidden />}
          />
          <NavLink
            href='/app/areas'
            label='Todas as áreas'
            active={pathname === '/app/areas' || pathname === '/app/areas/new'}
            icon={<Layers className='size-3.5' aria-hidden />}
          />
        </div>
      </nav>

      <div className='flex flex-col gap-2 border-t border-border p-3'>
        <NavLink
          href='/app/preferences'
          label='Configurações'
          active={is('/app/preferences')}
          icon={<Settings className='size-3.5' aria-hidden />}
        />
        <div className='flex items-center gap-2 rounded-xl bg-bg-app px-2.5 py-2'>
          <div className='flex size-8 items-center justify-center rounded-full bg-pastel-lilac text-xs font-semibold text-violet-700'>
            {(userName ?? '?').charAt(0).toUpperCase()}
          </div>
          <div className='min-w-0 flex-1'>
            <p className='truncate text-[13px] font-medium text-ink'>
              {userName ?? 'Você'}
            </p>
            <p className={caption}>
              {areas.length}{' '}
              {areas.length === 1 ? 'área ativa' : 'áreas ativas'}
            </p>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
