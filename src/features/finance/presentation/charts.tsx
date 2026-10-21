import { formatMinor, type Currency } from '../domain/money';

const COLORS = ['#0f766e', '#64748b', '#d97706', '#16a34a', '#7c3aed', '#0284c7', '#db2777'];

export type ChartRow = {
  name: string;
  amountMinor: bigint;
};

export function colorAt(index: number): string {
  return COLORS[index % COLORS.length];
}

export function CategoryBars({ currency, rows }: { currency: Currency; rows: ChartRow[] }) {
  const visible = rows.filter((row) => row.amountMinor > 0n);
  const max = visible.reduce((peak, row) => (row.amountMinor > peak ? row.amountMinor : peak), 0n);
  const ticks = [max, max / 2n, 0n];
  const plotHeight = 180;
  const slot = visible.length === 0 ? 1 : 560 / visible.length;
  return (
    <svg role='img' aria-label={`Gastos em ${currency}`} viewBox='0 0 640 250' className='h-64 w-full text-muted'>
      {ticks.map((tick, index) => {
        const y = 16 + index * (plotHeight / 2);
        return (
          <g key={tick.toString()}>
            <line x1='72' x2='620' y1={y} y2={y} stroke='currentColor' strokeOpacity='0.12' />
            <text x='68' y={y + 4} textAnchor='end' className='fill-current text-[11px]' opacity='0.55'>
              {formatMinor(tick, currency)}
            </text>
          </g>
        );
      })}
      {visible.map((row, index) => {
        const height = max === 0n ? 0 : Number((row.amountMinor * BigInt(plotHeight)) / max);
        const width = Math.min(48, Math.max(slot * 0.42, 18));
        const x = 88 + index * slot + (slot - width) / 2;
        const y = 16 + plotHeight - height;
        return (
          <g key={row.name}>
            <rect x={x} y={y} width={width} height={height} rx='6' fill={colorAt(index)} />
            <text
              x={x + width / 2}
              y='220'
              textAnchor='middle'
              className='fill-current text-[11px]'
            >
              {row.name.length > 14 ? `${row.name.slice(0, 13)}…` : row.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function MonthBars({
  currency,
  rows,
}: {
  currency: Currency;
  rows: ChartRow[];
}) {
  const max = rows.reduce((peak, row) => (row.amountMinor > peak ? row.amountMinor : peak), 0n);
  const plotHeight = 160;
  const slot = rows.length === 0 ? 1 : 560 / rows.length;
  return (
    <svg role='img' aria-label={`Gastos por mês em ${currency}`} viewBox='0 0 640 230' className='h-56 w-full text-muted'>
      <line x1='72' x2='620' y1={16 + plotHeight} y2={16 + plotHeight} stroke='currentColor' strokeOpacity='0.12' />
      {rows.map((row, index) => {
        const height =
          max === 0n || row.amountMinor <= 0n
            ? 0
            : Number((row.amountMinor * BigInt(plotHeight)) / max);
        const x = 88 + index * slot + slot * 0.28;
        const width = Math.max(slot * 0.28, 12);
        const y = 16 + plotHeight - height;
        return (
          <g key={row.name}>
            <rect x={x} y={y} width={width} height={Math.max(height, 2)} rx='4' fill='#0f766e' />
            <text x={x + width / 2} y='206' textAnchor='middle' className='fill-current text-[11px]'>
              {row.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function SpendingTable({ currency, rows }: { currency: Currency; rows: ChartRow[] }) {
  return (
    <table className='w-full text-left text-sm'>
      <caption className='mb-2 text-left text-xs text-muted'>Mesmos valores do gráfico, em {currency}</caption>
      <thead>
        <tr className='border-b border-border text-xs uppercase tracking-wide text-muted'>
          <th className='py-2 font-medium'>Categoria</th>
          <th className='py-2 text-right font-medium'>Valor</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={row.name} className='border-b border-border/70'>
            <td className='py-2'>
              <span className='mr-2 inline-block size-2 rounded-full' style={{ backgroundColor: colorAt(index) }} />
              {row.name}
            </td>
            <td className='py-2 text-right font-medium'>{formatMinor(row.amountMinor, currency)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ClassDonut({
  slices,
}: {
  slices: Array<{ label: string; amountLabel: string; share: number; color: string }>;
}) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const arcs = slices.map((slice, index) => {
    const offset =
      slices.slice(0, index).reduce((sum, item) => sum + item.share, 0) * circumference;
    return { ...slice, length: slice.share * circumference, offset };
  });
  return (
    <div className='flex flex-wrap items-center gap-6'>
      <svg role='img' aria-label='Distribuição por classe' viewBox='0 0 120 120' className='size-36'>
        <circle cx='60' cy='60' r={radius} fill='none' stroke='currentColor' strokeOpacity='0.08' strokeWidth='14' />
        {arcs.map((slice) => (
          <circle
            key={slice.label}
            cx='60'
            cy='60'
            r={radius}
            fill='none'
            stroke={slice.color}
            strokeWidth='14'
            strokeDasharray={`${slice.length} ${circumference - slice.length}`}
            strokeDashoffset={-slice.offset}
            transform='rotate(-90 60 60)'
          />
        ))}
      </svg>
      <ul className='flex flex-col gap-2 text-sm'>
        {slices.map((slice) => (
          <li key={slice.label} className='flex items-center gap-2'>
            <span className='size-2 rounded-full' style={{ backgroundColor: slice.color }} />
            <span>{slice.label}</span>
            <span className='text-muted'>{slice.amountLabel}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
