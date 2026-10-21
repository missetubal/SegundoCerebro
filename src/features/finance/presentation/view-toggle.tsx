'use client';

import { useState, type ReactNode } from 'react';

export function ViewToggle({ chart, table }: { chart: ReactNode; table: ReactNode }) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex justify-end gap-1'>
        <ToggleButton pressed={view === 'chart'} onClick={() => setView('chart')}>
          Gráfico
        </ToggleButton>
        <ToggleButton pressed={view === 'table'} onClick={() => setView('table')}>
          Tabela
        </ToggleButton>
      </div>
      {view === 'chart' ? chart : table}
    </div>
  );
}

function ToggleButton({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type='button'
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 ${
        pressed
          ? 'bg-ink text-bg-card'
          : 'border border-border bg-bg-card text-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}
