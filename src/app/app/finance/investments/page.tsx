import {
  todayInTimeZone,
  formatMinor,
  isCurrency,
  ClassDonut,
  colorAt,
  EmptyState,
  FinancePage,
  Panel,
  formatDay,
  formatQuantity,
  CLASS_LABELS,
} from '@/features/finance';
import {
  listInstitutions,
  portfolio,
} from '@/features/finance/server';
import Link from 'next/link';
import { Suspense } from 'react';
import { requireUserId } from '@/features/auth/server';
import { secondaryButton } from '@/shared/ui';
import { getPreferences } from '@/features/preferences/server';

export default function InvestmentsPage() {
  return (
    <FinancePage
      title='Investimentos'
      description='Carteira por classe, instituição e ativo. Sem recomendações.'
      current='/app/finance/investments'
      action={{ href: '/app/finance/investments/new', label: 'Novo ativo' }}
    >
      <Suspense fallback={<p className='text-sm text-muted'>Carregando…</p>}>
        <Portfolio />
      </Suspense>
    </FinancePage>
  );
}

async function Portfolio() {
  const userId = await requireUserId();
  const preferences = await getPreferences(userId);
  const today = todayInTimeZone(preferences.timezone);
  const [positions, institutions] = await Promise.all([
    portfolio(userId, today),
    listInstitutions(userId),
  ]);
  const names = new Map(institutions.map((institution) => [institution.id, institution.name]));
  const active = positions.assets.filter((asset) => asset.archivedAt === null);
  const archived = positions.assets.filter((asset) => asset.archivedAt !== null);
  const currencies = [...new Set(active.map((asset) => asset.currency))].filter(isCurrency);

  return (
    <>
      {active.length === 0 && (
        <Panel title='Carteira'>
          <EmptyState
            title='Nenhum ativo ainda'
            hint='Cadastre o primeiro ativo para acompanhar a carteira aqui.'
            action={
              <Link href='/app/finance/investments/new' className={secondaryButton}>
                Novo ativo
              </Link>
            }
          />
        </Panel>
      )}
      {currencies.map((currency) => {
        const group = active.filter((asset) => asset.currency === currency);
        const valued = group.filter((asset) => asset.currentValueMinor !== null);
        const total = valued.reduce((sum, asset) => sum + (asset.currentValueMinor ?? 0n), 0n);
        const omitted = group.length - valued.length;
        const classes = [...new Set(valued.map((asset) => asset.assetClass))];
        const slices = classes.map((assetClass, index) => {
          const amount = valued
            .filter((asset) => asset.assetClass === assetClass)
            .reduce((sum, asset) => sum + (asset.currentValueMinor ?? 0n), 0n);
          return {
            label: CLASS_LABELS[assetClass as keyof typeof CLASS_LABELS] ?? assetClass,
            amountLabel: formatMinor(amount, currency),
            share: total === 0n ? 0 : Number((amount * 10000n) / total) / 10000,
            color: colorAt(index),
          };
        });
        const brokers = [...new Set(group.map((asset) => asset.institutionId))];
        return (
          <Panel key={currency} title='Patrimônio investido'>
            <div className='flex flex-col gap-4'>
              <p className='text-2xl font-semibold tracking-tight text-ink tabular-nums'>
                {valued.length === 0 ? 'não informado' : formatMinor(total, currency)}
              </p>
              {omitted > 0 && (
                <p className='text-xs text-muted'>
                  {omitted} {omitted === 1 ? 'ativo ficou' : 'ativos ficaram'} de fora por falta de valor.
                </p>
              )}
              {slices.length > 0 && <ClassDonut slices={slices} />}
              <ul className='flex flex-wrap gap-2'>
                {brokers.map((institutionId) => {
                  const amount = valued
                    .filter((asset) => asset.institutionId === institutionId)
                    .reduce((sum, asset) => sum + (asset.currentValueMinor ?? 0n), 0n);
                  const brokerValued = valued.some((asset) => asset.institutionId === institutionId);
                  return (
                    <li key={institutionId} className='rounded-full bg-bg-app px-3 py-1 text-xs'>
                      {names.get(institutionId) ?? 'Instituição'}
                      {' · '}
                      {brokerValued ? formatMinor(amount, currency) : 'não informado'}
                    </li>
                  );
                })}
              </ul>
            </div>
            <AssetTable assets={group} names={names} />
          </Panel>
        );
      })}
      {archived.length > 0 && (
        <Panel title='Histórico'>
          <AssetTable assets={archived} names={names} />
        </Panel>
      )}
    </>
  );
}

function AssetTable({
  assets,
  names,
}: {
  assets: Array<{
    id: string;
    name: string;
    ticker: string | null;
    assetClass: string;
    institutionId: string;
    currency: string;
    quantity: string;
    averageCostMinor: bigint | null;
    currentValueMinor: bigint | null;
    valuationDate: string | null;
  }>;
  names: Map<string, string>;
}) {
  return (
    <div className='overflow-x-auto'>
      <table className='w-full min-w-[720px] text-left text-sm'>
        <thead>
          <tr className='border-b border-border text-[11px] uppercase tracking-wide text-muted'>
            <th className='py-2 font-medium'>Ativo</th>
            <th className='py-2 font-medium'>Classe</th>
            <th className='py-2 font-medium'>Qtd</th>
            <th className='py-2 font-medium'>Preço médio</th>
            <th className='py-2 font-medium'>Valor atual</th>
            <th className='py-2 font-medium'>Atualizado</th>
            <th className='py-2 font-medium' />
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => {
            const money = isCurrency(asset.currency) ? asset.currency : null;
            return (
              <tr key={asset.id} className='border-b border-border/70 transition-colors last:border-b-0 hover:bg-bg-app/60'>
                <td className='py-3'>
                  <span className='block font-medium text-ink'>{asset.name}</span>
                  <span className='text-xs text-muted'>
                    {[asset.ticker, names.get(asset.institutionId)].filter(Boolean).join(' · ')}
                  </span>
                </td>
                <td className='py-3'>{CLASS_LABELS[asset.assetClass as keyof typeof CLASS_LABELS] ?? asset.assetClass}</td>
                <td className='py-3'>{formatQuantity(asset.quantity)}</td>
                <td className='py-3'>
                  {asset.averageCostMinor !== null && money ? formatMinor(asset.averageCostMinor, money) : '—'}
                </td>
                <td className='py-3 font-medium tabular-nums'>
                  {asset.currentValueMinor !== null && money ? formatMinor(asset.currentValueMinor, money) : 'não informado'}
                </td>
                <td className='py-3 text-muted'>{asset.valuationDate ? formatDay(asset.valuationDate) : '—'}</td>
                <td className='py-3 text-right'>
                  <Link
                    href={`/app/finance/investments/${asset.id}`}
                    className='inline-flex min-h-9 items-center rounded-lg px-2 text-sm font-medium text-muted transition-colors hover:bg-bg-app hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30'
                  >
                    Abrir
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
