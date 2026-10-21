import {
  filterByOrigin,
  spendingByMonth,
  totalsByCategory,
  totalsByInstrument,
  type LedgerRow,
  monthInTimeZone,
  formatMinor,
  isCurrency,
  type Currency,
  CategoryBars,
  MonthBars,
  SpendingTable,
  FinancePage,
  Panel,
  formatMonth,
  monthBounds,
  shiftMonth,
  shortMonth,
  ViewToggle,
} from '@/features/finance';
import {
  listAccounts,
  listCards,
  listCategories,
  listTransactions,
} from '@/features/finance/server';
import { Suspense } from 'react';
import { requireUserId } from '@/features/auth/server';
import { getPreferences } from '@/features/preferences/server';
import { card, secondaryButton, textInput } from '@/shared/ui';

type Search = { month?: string; currency?: string; origin?: string };

export default function SpendingPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  return (
    <FinancePage
      title='Gastos'
      description='Gastos por categoria e por mês, com alternativa em tabela.'
      current='/app/finance/spending'
    >
      <Suspense fallback={<p className='text-sm text-muted'>Carregando…</p>}>
        <Spending searchParams={searchParams} />
      </Suspense>
    </FinancePage>
  );
}

async function Spending({ searchParams }: { searchParams: Promise<Search> }) {
  const userId = await requireUserId();
  const params = await searchParams;
  const preferences = await getPreferences(userId);
  const month = params.month ?? monthInTimeZone(preferences.timezone);
  const windowStart = shiftMonth(month, -5);
  const bounds = monthBounds(month);
  const origin = params.origin === 'account' || params.origin === 'card' ? params.origin : 'all';
  const [rows, categories, accounts, cards] = await Promise.all([
    listTransactions(userId, { from: monthBounds(windowStart).from, to: bounds.to }),
    listCategories(userId),
    listAccounts(userId),
    listCards(userId),
  ]);
  const categoryNames = new Map(categories.active.map((category) => [category.id, category.name]));
  const accountNames = new Map(accounts.active.map((account) => [account.id, account.name]));
  const cardNames = new Map(cards.active.map((card) => [card.id, card.nickname]));
  const dated = rows.flatMap((row) => {
    const ledger = toLedger(row, categoryNames);
    return ledger ? [{ ...ledger, month: row.transactionDate.slice(0, 7) }] : [];
  });
  const selected = filterByOrigin(
    dated.filter((row) => row.month === month),
    origin,
  );
  const currencies = [...new Set(selected.map((row) => row.currency))].filter(
    (currency) => !params.currency || currency === params.currency,
  );
  const seriesCurrencies = [...new Set(dated.map((row) => row.currency))].filter(
    (currency) => !params.currency || currency === params.currency,
  );
  const months = Array.from({ length: 6 }, (_, index) => shiftMonth(windowStart, index));
  const originLabel = origin === 'all' ? 'contas e cartões' : origin === 'account' ? 'contas' : 'cartões';

  return (
    <>
      <form method='get' className={`${card} flex flex-wrap items-end gap-3 p-4`}>
        <label className='flex flex-col gap-1 text-xs font-medium text-muted'>
          Período
          <input name='month' type='month' defaultValue={month} className={textInput} />
        </label>
        <label className='flex flex-col gap-1 text-xs font-medium text-muted'>
          Moeda
          <select name='currency' defaultValue={params.currency ?? ''} className={textInput}>
            <option value=''>Todas</option>
            <option value='BRL'>BRL</option>
            <option value='USD'>USD</option>
            <option value='EUR'>EUR</option>
          </select>
        </label>
        <label className='flex flex-col gap-1 text-xs font-medium text-muted'>
          Origem
          <select name='origin' defaultValue={origin} className={textInput}>
            <option value='all'>Contas e cartões</option>
            <option value='account'>Contas</option>
            <option value='card'>Cartões</option>
          </select>
        </label>
        <button className={secondaryButton} type='submit'>
          Atualizar
        </button>
      </form>

      <Panel
        title='Gastos por categoria'
        description='Onde o dinheiro foi parar no período selecionado. Sem julgamento de gastos.'
      >
        <p className='text-xs text-muted'>
          Período: {formatMonth(month)}. Moeda: {params.currency || 'todas'}. Origem: {originLabel}.
        </p>
        {currencies.length === 0 && <p className='text-sm text-muted'>Nenhum gasto neste mês.</p>}
        {currencies.map((currency) => (
          <CurrencySpending
            key={currency}
            currency={currency}
            rows={selected.filter((row) => row.currency === currency)}
            origin={origin}
            accountNames={accountNames}
            cardNames={cardNames}
          />
        ))}
      </Panel>

      <Panel title='Gastos por mês' description='Evolução dos últimos seis meses.'>
        {seriesCurrencies.length === 0 && <p className='text-sm text-muted'>Nenhum gasto neste mês.</p>}
        {seriesCurrencies.map((currency) => {
          const series = spendingByMonth(dated, months, currency, origin).map((item) => ({
            name: shortMonth(item.month),
            amountMinor: item.amountMinor,
          }));
          return (
            <ViewToggle
              key={currency}
              chart={<MonthBars currency={currency} rows={series} />}
              table={<SpendingTable currency={currency} rows={series} />}
            />
          );
        })}
      </Panel>
    </>
  );
}

function CurrencySpending({
  currency,
  rows,
  origin,
  accountNames,
  cardNames,
}: {
  currency: Currency;
  rows: LedgerRow[];
  origin: 'all' | 'account' | 'card';
  accountNames: Map<string, string>;
  cardNames: Map<string, string>;
}) {
  const categories = totalsByCategory(rows, currency).filter((row) => row.amountMinor !== 0n);
  const accounts = origin === 'card' ? [] : totalsByInstrument(rows, currency, 'account');
  const cards = origin === 'account' ? [] : totalsByInstrument(rows, currency, 'card');
  if (categories.length === 0 && accounts.length === 0 && cards.length === 0) {
    return <p className='text-sm text-muted'>Nenhum gasto em {currency} neste mês.</p>;
  }
  return (
    <div className='flex flex-col gap-4'>
      {categories.length > 0 && (
        <ViewToggle
          chart={<CategoryBars currency={currency} rows={categories} />}
          table={<SpendingTable currency={currency} rows={categories} />}
        />
      )}
      {accounts.length > 0 && (
        <>
        <h3 className='text-sm font-semibold text-ink'>Por conta</h3>
        <ul className='grid gap-2 sm:grid-cols-2'>
          {accounts.map((row) => (
            <li key={row.id ?? row.name} className='flex items-center justify-between rounded-xl bg-bg-app px-3 py-2 text-sm'>
              <span>{row.id ? (accountNames.get(row.id) ?? row.name) : row.name}</span>
              <span className='font-medium tabular-nums'>{formatMinor(row.amountMinor, currency)}</span>
            </li>
          ))}
        </ul>
        </>
      )}
      {cards.length > 0 && (
        <>
        <h3 className='text-sm font-semibold text-ink'>Por cartão</h3>
        <ul className='grid gap-2 sm:grid-cols-2'>
          {cards.map((row) => (
            <li key={row.id ?? row.name} className='flex items-center justify-between rounded-xl bg-bg-app px-3 py-2 text-sm'>
              <span>{row.id ? (cardNames.get(row.id) ?? row.name) : row.name}</span>
              <span className='font-medium tabular-nums'>{formatMinor(row.amountMinor, currency)}</span>
            </li>
          ))}
        </ul>
        </>
      )}
    </div>
  );
}

function toLedger(
  row: {
    amountMinor: bigint;
    currency: string;
    type: string;
    direction: string;
    categoryId: string | null;
    accountId: string | null;
    creditCardId: string | null;
  },
  categoryNames: Map<string, string>,
): LedgerRow | null {
  const currency = row.currency.trim();
  if (!isCurrency(currency)) return null;
  return {
    amountMinor: row.amountMinor,
    currency,
    type: row.type as LedgerRow['type'],
    direction: row.direction as LedgerRow['direction'],
    categoryName: row.categoryId ? (categoryNames.get(row.categoryId) ?? null) : null,
    accountId: row.accountId,
    creditCardId: row.creditCardId,
  };
}
