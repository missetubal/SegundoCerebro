import {
  monthInTimeZone,
  FinancePage,
  formatMonth,
  StatementForm,
} from '@/features/finance';
import {
  createStatementAction,
  listAccounts,
  listCards,
  listStatements,
} from '@/features/finance/server';
import Link from 'next/link';
import { List } from 'lucide-react';
import { Suspense } from 'react';
import { requireUserId } from '@/features/auth/server';
import { getPreferences } from '@/features/preferences/server';
import { card, caption } from '@/shared/ui';

const STATUS_LABELS: Record<string, string> = {
  attached: 'Anexada',
  imported: 'Importada',
  reviewed: 'Revisada',
};

export default function NewStatementPage() {
  return (
    <FinancePage
      title='Importar fatura'
      description='Importe um arquivo de fatura e revise os lançamentos.'
      current='/app/finance'
    >
      <Suspense fallback={<p className='text-sm text-muted'>Carregando…</p>}>
        <NewStatement />
      </Suspense>
    </FinancePage>
  );
}

async function NewStatement() {
  const userId = await requireUserId();
  const [accounts, cards, statements, preferences] = await Promise.all([
    listAccounts(userId),
    listCards(userId),
    listStatements(userId),
    getPreferences(userId),
  ]);
  const accountNames = new Map(accounts.active.map((account) => [account.id, account.name]));
  const cardNames = new Map(cards.active.map((item) => [item.id, item.nickname]));
  return (
    <div className='flex flex-col gap-6'>
      <StatementForm
        action={createStatementAction}
        defaultMonth={monthInTimeZone(preferences.timezone)}
        accounts={accounts.active.map((account) => ({ id: account.id, name: account.name }))}
        cards={cards.active.map((item) => ({ id: item.id, name: item.nickname }))}
      />
      <section className={`${card} flex flex-col gap-4 p-5`}>
        <h2 className='text-base font-semibold text-ink'>Importações recentes</h2>
        {statements.length === 0 ? (
          <div className='flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-border text-muted'>
            <List className='size-5' aria-hidden />
          </div>
        ) : (
          <ul className='flex flex-col'>
            {statements.slice(0, 8).map((statement) => {
              const importable = /\.(csv|ofx|qfx)$/i.test(statement.fileName ?? '');
              const href =
                importable && statement.status === 'attached'
                  ? `/app/finance/statements/${statement.id}/import`
                  : `/app/finance/statements/${statement.id}`;
              const owner = statement.accountId
                ? accountNames.get(statement.accountId)
                : statement.creditCardId
                  ? cardNames.get(statement.creditCardId)
                  : null;
              return (
                <li key={statement.id} className='border-b border-border last:border-b-0'>
                  <Link href={href} className='flex items-center justify-between gap-3 py-3'>
                    <span className='flex flex-col'>
                      <span className='text-sm font-medium text-ink'>
                        {owner ?? 'Fatura'} · {formatMonth(statement.referenceMonth)}
                      </span>
                      <span className={caption}>{statement.fileName ?? 'Sem arquivo'}</span>
                    </span>
                    <span className='text-sm text-muted'>
                      {STATUS_LABELS[statement.status] ?? statement.status}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
