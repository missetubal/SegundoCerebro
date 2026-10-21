import {
  formatMinor,
  isCurrency,
  EmptyState,
  FinancePage,
  Panel,
  StatusPill,
  formatMonth,
} from '@/features/finance';
import {
  listAccounts,
  listCards,
  listStatements,
} from '@/features/finance/server';
import Link from 'next/link';
import { Suspense } from 'react';
import { FileText } from 'lucide-react';
import { requireUserId } from '@/features/auth/server';
import { caption } from '@/shared/ui';

const STATUS: Record<string, { label: string; tone: 'neutral' | 'success' | 'info' }> = {
  attached: { label: 'Anexada', tone: 'neutral' },
  imported: { label: 'Importada', tone: 'info' },
  reviewed: { label: 'Revisada', tone: 'success' },
};

export default function StatementsPage() {
  return (
    <FinancePage
      title='Faturas e extratos'
      description='Arquivos anexados às suas contas e cartões, com o estado de cada importação.'
      current='/app/finance/accounts'
      action={{ href: '/app/finance/statements/new', label: 'Importar fatura' }}
    >
      <Suspense fallback={<p className='text-sm text-muted'>Carregando…</p>}>
        <StatementList />
      </Suspense>
    </FinancePage>
  );
}

async function StatementList() {
  const userId = await requireUserId();
  const [rows, accounts, cards] = await Promise.all([
    listStatements(userId),
    listAccounts(userId),
    listCards(userId),
  ]);
  const accountNames = new Map(accounts.active.map((account) => [account.id, account.name]));
  const archivedAccounts = new Map(accounts.archived.map((account) => [account.id, account.name]));
  const cardNames = new Map(cards.active.map((card) => [card.id, card.nickname]));
  const archivedCards = new Map(cards.archived.map((card) => [card.id, card.nickname]));
  return (
    <Panel title='Arquivos'>
      {rows.length === 0 ? (
        <EmptyState
          title='Nenhuma fatura ainda'
          hint='Importe um extrato ou fatura para revisar os lançamentos aqui.'
          action={
            <Link href='/app/finance/statements/new' className='text-sm font-medium text-ink underline'>
              Importar fatura
            </Link>
          }
        />
      ) : (
        <ul className='flex flex-col'>
          {rows.map((statement) => {
            const status = STATUS[statement.status] ?? { label: statement.status, tone: 'neutral' as const };
            const owner = statement.accountId
              ? (accountNames.get(statement.accountId) ?? archivedAccounts.get(statement.accountId))
              : statement.creditCardId
                ? (cardNames.get(statement.creditCardId) ?? archivedCards.get(statement.creditCardId))
                : null;
            return (
              <li key={statement.id} className='border-b border-border last:border-b-0'>
                <Link
                  href={`/app/finance/statements/${statement.id}`}
                  className='flex min-h-11 flex-wrap items-center justify-between gap-3 rounded-lg py-3 transition-colors hover:bg-bg-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30'
                >
                  <span className='flex min-w-0 items-start gap-3'>
                    <FileText className='mt-0.5 size-4 shrink-0 text-muted' aria-hidden />
                    <span className='flex min-w-0 flex-col'>
                      <span className='text-sm font-medium text-ink'>
                        {owner ?? 'Fatura'} · {formatMonth(statement.referenceMonth)}
                      </span>
                      <span className={`${caption} truncate`}>
                        {statement.fileName ?? 'Sem arquivo'} · Total informado:{' '}
                        {statement.declaredTotalMinor === null
                          ? 'não informado'
                          : isCurrency(statement.currency)
                            ? formatMinor(statement.declaredTotalMinor, statement.currency)
                            : statement.declaredTotalMinor.toString()}
                      </span>
                    </span>
                  </span>
                  <StatusPill tone={status.tone}>{status.label}</StatusPill>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
