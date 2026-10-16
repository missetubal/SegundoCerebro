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
  Settings,
  Target,
} from 'lucide-react';
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
      className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium ${
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
    <aside className='flex h-dvh w-56 shrink-0 flex-col border-r border-border bg-bg-card'>
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
        </div>

        {areas.map((area) => (
          <div key={area.id} className='flex flex-col gap-0.5'>
            <div className='mb-1 flex items-center gap-2 px-2.5'>
              <span className='flex size-5 items-center justify-center rounded-md bg-bg-app text-[10px] font-bold text-muted'>
                {area.name.trim().charAt(0).toUpperCase() || '?'}
              </span>
              <span
                className={`${caption} truncate font-semibold uppercase tracking-wider`}
              >
                {area.name}
              </span>
            </div>
            <NavLink
              href={`/app/areas/${area.id}`}
              label='Visão'
              active={
                is(`/app/areas/${area.id}`) && !pathname.includes('/edit')
              }
              icon={<Layers className='size-3.5' aria-hidden />}
            />
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
          </div>
        ))}

        {areas.length === 0 && (
          <p className={`${caption} px-2.5`}>
            Crie áreas para montar a navegação.
          </p>
        )}

        <div className='flex flex-col gap-0.5'>
          <span className={`${caption} px-2.5 font-semibold uppercase`}>
            Atalhos
          </span>
          <NavLink
            href='/app/check-in'
            label='Check-in'
            active={is('/app/check-in')}
            icon={<HeartPulse className='size-3.5' aria-hidden />}
          />
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
  );
}
