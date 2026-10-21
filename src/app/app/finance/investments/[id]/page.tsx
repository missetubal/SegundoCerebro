import {
  todayInTimeZone,
  formatMinor,
  isCurrency,
  OperationForm,
  ValuationForm,
  formatDay,
  formatQuantity,
  BackLink,
  EmptyState,
  FinancePage,
  Panel,
  CLASS_LABELS,
  OPERATION_LABELS,
} from '@/features/finance';
import {
  addOperationAction,
  addValuationAction,
  archiveAssetAction,
  deleteAssetAction,
  getAsset,
  listAssetActivity,
  listInstitutions,
  portfolio,
} from '@/features/finance/server';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { requireUserId } from '@/features/auth/server';
import { getPreferences } from '@/features/preferences/server';
import { ItemActionButton } from '@/shared/ui';

const ACTION_CLASS =
  'inline-flex min-h-9 items-center rounded-lg px-2 text-sm font-medium text-muted transition-colors hover:bg-bg-app hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 disabled:opacity-50';

export default function AssetPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className='p-6 text-sm text-muted'>Carregando…</p>}>
      <AssetDetail params={params} />
    </Suspense>
  );
}

async function AssetDetail({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const asset = await getAsset(userId, id);
  if (!asset) notFound();
  const preferences = await getPreferences(userId);
  const today = todayInTimeZone(preferences.timezone);
  const [activity, positions, institutions] = await Promise.all([
    listAssetActivity(userId, id),
    portfolio(userId, today),
    listInstitutions(userId),
  ]);
  const position = positions.assets.find((item) => item.id === id);
  const currency = asset.currency.trim();
  const money = isCurrency(currency) ? currency : null;
  const institution = institutions.find((item) => item.id === asset.institutionId)?.name;
  const facts = [
    {
      label: 'Classe',
      value: CLASS_LABELS[asset.assetClass as keyof typeof CLASS_LABELS] ?? asset.assetClass,
    },
    { label: 'Instituição', value: institution ?? 'Não informada' },
    { label: 'Quantidade', value: formatQuantity(position?.quantity ?? '0') },
    {
      label: 'Preço médio',
      value:
        position?.averageCostMinor != null && money
          ? formatMinor(position.averageCostMinor, money)
          : '—',
    },
    {
      label: 'Valor atual',
      value:
        position?.currentValueMinor != null && money
          ? formatMinor(position.currentValueMinor, money)
          : 'Não informado',
    },
    {
      label: 'Atualizado em',
      value: position?.valuationDate ? formatDay(position.valuationDate) : '—',
    },
  ];
  const operations = activity?.operations ?? [];
  return (
    <FinancePage
      title={asset.name}
      description={asset.ticker ? `Código ${asset.ticker}` : 'Ativo da carteira.'}
      current='/app/finance/investments'
    >
      <BackLink href='/app/finance/investments' label='Voltar à carteira' />
      <Panel title='Posição'>
        <dl className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {facts.map((fact) => (
            <div key={fact.label} className='rounded-xl bg-bg-app px-3 py-2.5'>
              <dt className='text-[11px] font-medium uppercase tracking-wider text-muted'>{fact.label}</dt>
              <dd className='mt-0.5 text-sm font-medium text-ink tabular-nums'>{fact.value}</dd>
            </div>
          ))}
        </dl>
        <div className='flex flex-wrap gap-1'>
          <ItemActionButton
            action={archiveAssetAction}
            id={asset.id}
            label={asset.archivedAt ? 'Reativar' : 'Arquivar'}
            fields={asset.archivedAt ? { archived: 'false' } : undefined}
            className={ACTION_CLASS}
          >
            {asset.archivedAt ? 'Reativar' : 'Arquivar'}
          </ItemActionButton>
          <ItemActionButton
            action={deleteAssetAction}
            id={asset.id}
            label='Excluir'
            className={ACTION_CLASS}
          >
            Excluir
          </ItemActionButton>
        </div>
      </Panel>

      <Panel title='Operações' description='Compras, vendas, proventos e ajustes deste ativo.'>
        {operations.length === 0 ? (
          <EmptyState title='Nenhuma operação ainda' hint='Registre a primeira operação no formulário abaixo.' />
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[560px] text-left text-sm'>
              <thead>
                <tr className='border-b border-border text-[11px] uppercase tracking-wide text-muted'>
                  <th className='py-2 font-medium'>Data</th>
                  <th className='py-2 font-medium'>Operação</th>
                  <th className='py-2 text-right font-medium'>Quantidade</th>
                  <th className='py-2 text-right font-medium'>Preço unitário</th>
                </tr>
              </thead>
              <tbody>
                {operations.map((operation) => (
                  <tr key={operation.id} className='border-b border-border/70 last:border-b-0'>
                    <td className='py-2.5 text-muted'>{formatDay(operation.operationDate)}</td>
                    <td className='py-2.5 font-medium text-ink'>
                      {OPERATION_LABELS[operation.operationType] ?? operation.operationType}
                    </td>
                    <td className='py-2.5 text-right tabular-nums'>{formatQuantity(operation.quantity)}</td>
                    <td className='py-2.5 text-right tabular-nums'>
                      {money ? formatMinor(operation.unitPriceMinor, money) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {asset.archivedAt === null && (
        <div className='grid items-start gap-5 lg:grid-cols-2'>
          <Panel title='Registrar operação'>
            <OperationForm assetId={asset.id} action={addOperationAction} />
          </Panel>
          <Panel title='Informar valor atual'>
            <ValuationForm assetId={asset.id} action={addValuationAction} />
          </Panel>
        </div>
      )}
    </FinancePage>
  );
}
