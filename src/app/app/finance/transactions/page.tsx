import {
  formatMinor,
  isCurrency,
  BulkCategoryForm,
  FinancePage,
  Panel,
  formatDay,
  TYPE_LABELS,
} from '@/features/finance';
import {
  assignCategoryAction,
  listAccounts,
  listCards,
  listCategories,
  listTransactions,
} from '@/features/finance/server';
import Link from 'next/link';
import { Suspense } from 'react';
import { Search } from 'lucide-react';
import { requireUserId } from '@/features/auth/server';
import { secondaryButton, textInput } from '@/shared/ui';

type SearchParams = {
  q?: string;
  from?: string;
  to?: string;
  category?: string;
  type?: string;
  account?: string;
  card?: string;
};

const labelClass = 'flex flex-col gap-1 text-xs font-medium text-muted';

export default function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <FinancePage
      title='Lançamentos'
      description='Todos os lançamentos, com busca e filtros.'
      current='/app/finance/transactions'
      action={{ href: '/app/finance/transactions/new', label: 'Novo lançamento' }}
    >
      <Suspense fallback={<p className='text-sm text-muted'>Carregando…</p>}>
        <TransactionList searchParams={searchParams} />
      </Suspense>
    </FinancePage>
  );
}

async function TransactionList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const userId = await requireUserId();
  const params = await searchParams;
  const [rows, categories, accounts, cards] = await Promise.all([
    listTransactions(userId, {
      query: params.q,
      from: params.from,
      to: params.to,
      categoryId: params.category,
      accountId: params.account,
      creditCardId: params.card,
      type: params.type,
    }),
    listCategories(userId),
    listAccounts(userId),
    listCards(userId),
  ]);
  const names = new Map(categories.active.map((category) => [category.id, category.name]));
  const hasFilters = Boolean(
    params.q || params.from || params.to || params.category || params.type || params.account || params.card,
  );
  return (
    <Panel
      title='Movimentos'
      description={`${rows.length} ${rows.length === 1 ? 'lançamento' : 'lançamentos'}`}
    >
      <form method='get' className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        <label className={labelClass}>
          Buscar
          <span className='relative'>
            <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted' aria-hidden />
            <input
              name='q'
              defaultValue={params.q}
              placeholder='Buscar descrição'
              className={`${textInput} pl-9`}
            />
          </span>
        </label>
        <label className={labelClass}>
          De
          <input name='from' type='date' defaultValue={params.from} className={textInput} />
        </label>
        <label className={labelClass}>
          Até
          <input name='to' type='date' defaultValue={params.to} className={textInput} />
        </label>
        <label className={labelClass}>
          Categoria
          <select name='category' defaultValue={params.category ?? ''} className={textInput}>
            <option value=''>Todas as categorias</option>
            <option value='none'>Sem categoria</option>
            {categories.active.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Conta
          <select name='account' defaultValue={params.account ?? ''} className={textInput}>
            <option value=''>Todas as contas</option>
            {accounts.active.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Cartão
          <select name='card' defaultValue={params.card ?? ''} className={textInput}>
            <option value=''>Todos os cartões</option>
            {cards.active.map((card) => (
              <option key={card.id} value={card.id}>
                {card.nickname}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Tipo
          <select name='type' defaultValue={params.type ?? ''} className={textInput}>
            <option value=''>Todos os tipos</option>
            <option value='expense'>Despesa</option>
            <option value='income'>Receita</option>
            <option value='refund'>Estorno</option>
            <option value='invoice_payment'>Pagamento de fatura</option>
            <option value='transfer'>Transferência</option>
          </select>
        </label>
        <div className='flex items-end gap-2'>
          <button className={secondaryButton} type='submit'>
            Filtrar
          </button>
          {hasFilters && (
            <Link href='/app/finance/transactions' className={secondaryButton}>
              Limpar
            </Link>
          )}
        </div>
      </form>
      <BulkCategoryForm
        action={assignCategoryAction}
        categories={categories.active.map((category) => ({
          id: category.id,
          name: category.name,
        }))}
        rows={rows.map((row) => {
          const currency = row.currency.trim();
          const origin = row.accountId
            ? accounts.active.find((account) => account.id === row.accountId)?.name
            : cards.active.find((card) => card.id === row.creditCardId)?.nickname;
          const tone =
            row.type === 'income' || row.type === 'refund'
              ? 'in'
              : row.type === 'expense'
                ? 'out'
                : 'neutral';
          const formatted = isCurrency(currency)
            ? formatMinor(row.amountMinor, currency)
            : row.amountMinor.toString();
          return {
            id: row.id,
            editHref: `/app/finance/transactions/${row.id}/edit`,
            date: formatDay(row.transactionDate),
            description: row.description,
            category: row.categoryId ? (names.get(row.categoryId) ?? 'Sem categoria') : 'Sem categoria',
            origin: origin ?? '—',
            type: TYPE_LABELS[row.type] ?? row.type,
            amount: tone === 'out' ? `-${formatted}` : formatted,
            tone,
          };
        })}
      />
    </Panel>
  );
}
