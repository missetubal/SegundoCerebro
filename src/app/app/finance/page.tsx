import {
  totalsByCategory,
  summarizePeriod,
  type LedgerRow,
  nextDueDate,
  todayInTimeZone,
  formatMinor,
  isCurrency,
  type Currency,
  CategoryBars,
  SpendingTable,
  EmptyState,
  FinancePage,
  Panel,
  formatDay,
  formatMonth,
  monthBounds,
  ViewToggle,
} from '@/features/finance';
import {
  listAccountBalances,
  listAccounts,
  listCards,
  listCategories,
  listInstitutions,
  listTransactions,
  portfolio,
} from '@/features/finance/server';
import Link from 'next/link';
import { Suspense } from 'react';
import { requireUserId } from '@/features/auth/server';
import { getPreferences } from '@/features/preferences/server';
import { KpiTile, card, caption } from '@/shared/ui';

export default function FinanceHomePage() {
  return (
    <FinancePage
      title='Visão geral'
      description='Resumo do mês atual. Sem julgamento de gastos e sem recomendações.'
      current='/app/finance'
      action={{ href: '/app/finance/statements/new', label: 'Importar lançamentos' }}
    >
      <Suspense fallback={<p className='text-sm text-muted'>Carregando…</p>}>
        <Overview />
      </Suspense>
    </FinancePage>
  );
}

async function Overview() {
  const userId = await requireUserId();
  const preferences = await getPreferences(userId);
  const today = todayInTimeZone(preferences.timezone);
  const month = today.slice(0, 7);
  const bounds = monthBounds(month);
  const [balances, accounts, institutions, cards, categories, rows, positions] = await Promise.all([
    listAccountBalances(userId),
    listAccounts(userId),
    listInstitutions(userId),
    listCards(userId),
    listCategories(userId),
    listTransactions(userId, bounds),
    portfolio(userId, today),
  ]);
  const institutionNames = new Map(institutions.map((item) => [item.id, item.name]));
  const categoryNames = new Map(categories.active.map((item) => [item.id, item.name]));
  const activeBalances = balances.filter((account) => account.archivedAt === null);
  const accountById = new Map(accounts.active.map((account) => [account.id, account]));
  const ledger = toLedger(rows, categoryNames);
  const spendCurrencies = [...new Set(ledger.map((row) => row.currency))];
  const balanceCurrencies = [...new Set(activeBalances.map((account) => account.currency.trim()))].filter(isCurrency);
  const due = cards.active
    .map((item) => ({
      name: item.nickname,
      last4: item.last4,
      date: nextDueDate(item.dueDay, today),
    }))
    .sort((left, right) => left.date.localeCompare(right.date))[0];
  const valuedAssets = positions.assets.filter(
    (asset) => asset.archivedAt === null && asset.currentValueMinor !== null,
  );

  return (
    <>
      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        <KpiTile
          pastel='rose'
          label='Gasto do mês'
          value={<MoneyLines totals={spendCurrencies.map((currency) => summarizePeriod(ledger, currency))} />}
          hint={formatMonth(month)}
        />
        <KpiTile
          pastel='peach'
          label='Próximo vencimento'
          value={due ? formatDay(due.date) : '—'}
          hint={due ? `${due.name}${due.last4 ? ` · final ${due.last4}` : ''}` : 'Nenhum vencimento.'}
        />
        <KpiTile
          pastel='lilac'
          label='Patrimônio investido'
          value={valuedAssets.length === 0 ? '—' : <PortfolioLines totals={positions.totals} />}
          hint={
            valuedAssets.length === 0
              ? 'Nenhum valor informado.'
              : `${valuedAssets.length} ${valuedAssets.length === 1 ? 'ativo' : 'ativos'}`
          }
        />
        <KpiTile
          pastel='sky'
          label='Saldo em contas'
          value={<BalanceLines balances={activeBalances} />}
          hint={
            activeBalances.length === 0
              ? 'Nenhuma conta ainda.'
              : `${activeBalances.length} ${activeBalances.length === 1 ? 'conta' : 'contas'}`
          }
        />
      </div>

      <Panel title='Saldo por conta'>
        {activeBalances.length === 0 ? (
          <EmptyState
            title='Nenhuma conta ainda'
            hint='Cadastre uma conta para acompanhar o saldo aqui.'
            action={
              <Link href='/app/finance/accounts' className='text-sm font-medium text-ink underline'>
                Ir para contas e cartões
              </Link>
            }
          />
        ) : (
          <ul className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {activeBalances.map((account) => {
              const source = accountById.get(account.id);
              const institution = source ? institutionNames.get(source.institutionId) : null;
              return (
                <li key={account.id} className={`${card} flex flex-col gap-1 p-4 transition-colors hover:border-ink/25`}>
                  <span className='text-sm font-medium text-ink'>{account.name}</span>
                  <span className={caption}>{institution ?? 'Instituição'}</span>
                  <span className='text-lg font-semibold text-ink tabular-nums'>
                    {isCurrency(account.currency) ? formatMinor(account.balanceMinor, account.currency) : account.currency}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel
        title='Gastos por categoria'
        description={`Distribuição dos gastos em ${formatMonth(month)}.`}
        action={
          <Link
            href='/app/finance/spending'
            className='inline-flex min-h-9 items-center rounded-lg px-2 text-sm font-medium text-muted transition-colors hover:bg-bg-app hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30'
          >
            Ver gastos
          </Link>
        }
      >
        {spendCurrencies.length === 0 ? (
          <EmptyState title='Nenhum gasto neste mês' hint='Lançamentos de despesa aparecem aqui por categoria.' />
        ) : (
          spendCurrencies.map((currency) => {
            const categories = totalsByCategory(ledger, currency).filter((row) => row.amountMinor !== 0n);
            return (
              <ViewToggle
                key={currency}
                chart={<CategoryBars currency={currency} rows={categories} />}
                table={<SpendingTable currency={currency} rows={categories} />}
              />
            );
          })
        )}
        {balanceCurrencies.length > 1 && (
          <p className='text-xs text-muted'>Moedas separadas. Sem conversão.</p>
        )}
      </Panel>
    </>
  );
}

function MoneyLines({
  totals,
}: {
  totals: Array<{ currency: Currency; expenseMinor: bigint }>;
}) {
  if (totals.length === 0) return 'R$ 0,00';
  return (
    <span className='flex flex-col'>
      {totals.map((total) => (
        <span key={total.currency}>{formatMinor(total.expenseMinor, total.currency)}</span>
      ))}
    </span>
  );
}

function PortfolioLines({
  totals,
}: {
  totals: Array<{ currency: string; valueMinor: bigint; omitted: number }>;
}) {
  const valued = totals.filter((total) => isCurrency(total.currency));
  if (valued.every((total) => total.valueMinor === 0n)) return '—';
  return (
    <span className='flex flex-col'>
      {valued.map((total) =>
        isCurrency(total.currency) ? (
          <span key={total.currency}>{formatMinor(total.valueMinor, total.currency)}</span>
        ) : null,
      )}
    </span>
  );
}

function BalanceLines({
  balances,
}: {
  balances: Array<{ currency: string; balanceMinor: bigint }>;
}) {
  const currencies = [...new Set(balances.map((account) => account.currency.trim()))].filter(isCurrency);
  if (currencies.length === 0) return '—';
  return (
    <span className='flex flex-col'>
      {currencies.map((currency) => {
        const sum = balances
          .filter((account) => account.currency.trim() === currency)
          .reduce((total, account) => total + account.balanceMinor, 0n);
        return <span key={currency}>{formatMinor(sum, currency)}</span>;
      })}
    </span>
  );
}

function toLedger(
  rows: Array<{
    amountMinor: bigint;
    currency: string;
    type: string;
    direction: string;
    categoryId: string | null;
    accountId: string | null;
    creditCardId: string | null;
  }>,
  categoryNames: Map<string, string>,
): LedgerRow[] {
  return rows.flatMap((row) => {
    const currency = row.currency.trim();
    if (!isCurrency(currency)) return [];
    return [
      {
        amountMinor: row.amountMinor,
        currency,
        type: row.type as LedgerRow['type'],
        direction: row.direction as LedgerRow['direction'],
        categoryName: row.categoryId ? (categoryNames.get(row.categoryId) ?? null) : null,
        accountId: row.accountId,
        creditCardId: row.creditCardId,
      },
    ];
  });
}
