import Link from 'next/link';
import { Suspense } from 'react';
import { CreditCard, Landmark } from 'lucide-react';
import { requireUserId } from '@/features/auth/server';
import { formatMinor, isCurrency } from '@/features/finance/domain/money';
import { CreateInstrumentDialogs } from '@/features/finance/presentation/create-dialogs';
import { EmptyState, FinancePage } from '@/features/finance/presentation/finance-shell';
import {
  archiveAccountAction,
  archiveCardAction,
  createAccountAction,
  createCardAction,
  deleteAccountAction,
  listAccountBalances,
  listAccounts,
  listCards,
  listInstitutions,
} from '@/features/finance/server';
import { ItemActionButton, card, secondaryButton } from '@/shared/ui';

export default function AccountsPage() {
  return (
    <Suspense fallback={<p className='p-6 text-sm text-muted'>Carregando…</p>}>
      <AccountsAndCards />
    </Suspense>
  );
}

async function AccountsAndCards() {
  const userId = await requireUserId();
  const [balances, accounts, cards, institutions] = await Promise.all([
    listAccountBalances(userId),
    listAccounts(userId),
    listCards(userId),
    listInstitutions(userId),
  ]);
  const names = new Map(institutions.map((item) => [item.id, item.name]));
  const accountById = new Map(accounts.active.map((account) => [account.id, account]));
  const activeBalances = balances.filter((account) => account.archivedAt === null);

  return (
    <FinancePage
      title='Contas e cartões'
      description='Suas contas e cartões cadastrados. O cartão mostra apenas os 4 últimos dígitos.'
      current='/app/finance/accounts'
      actions={
        <CreateInstrumentDialogs
          institutions={institutions.map((item) => ({ id: item.id, name: item.name }))}
          accountAction={createAccountAction}
          cardAction={createCardAction}
        />
      }
    >
      <section id='contas' className='flex flex-col gap-3'>
        <h2 className='text-[15px] font-semibold text-ink'>
          Contas{' '}
          <span className='text-sm font-normal text-muted'>({activeBalances.length})</span>
        </h2>
        {activeBalances.length === 0 ? (
          <EmptyState title='Nenhuma conta ainda' hint='Use Nova conta, no topo da página, para cadastrar a primeira.' />
        ) : (
          <ul className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
            {activeBalances.map((account) => {
              const source = accountById.get(account.id);
              const institution = source ? names.get(source.institutionId) : null;
              return (
                <li key={account.id} className={`${card} flex flex-col gap-3 p-4 transition-colors hover:border-ink/25`}>
                  <div className='flex items-center justify-between gap-2 text-xs text-muted'>
                    <Landmark className='size-4' aria-hidden />
                    <span>{institution ?? 'Instituição'}</span>
                  </div>
                  <div>
                    <Link href={`/app/finance/accounts/${account.id}/edit`} className='font-medium text-ink'>
                      {account.name}
                    </Link>
                    <p className='text-lg font-semibold text-ink tabular-nums'>
                      {isCurrency(account.currency)
                        ? formatMinor(account.balanceMinor, account.currency)
                        : account.currency}
                    </p>
                  </div>
                  <div className='flex flex-wrap gap-1'>
                    <ItemActionButton
                      action={archiveAccountAction}
                      id={account.id}
                      label='Arquivar'
                      className='inline-flex min-h-9 items-center rounded-lg px-2 text-sm font-medium text-muted transition-colors hover:bg-bg-app hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30'
                    >
                      Arquivar
                    </ItemActionButton>
                    <ItemActionButton
                      action={deleteAccountAction}
                      id={account.id}
                      label='Excluir'
                      className='inline-flex min-h-9 items-center rounded-lg px-2 text-sm font-medium text-muted transition-colors hover:bg-bg-app hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30'
                    >
                      Excluir
                    </ItemActionButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section id='cartoes' className='flex flex-col gap-3'>
        <div className='flex items-center justify-between gap-3'>
          <h2 className='text-[15px] font-semibold text-ink'>
            Cartões{' '}
            <span className='text-sm font-normal text-muted'>({cards.active.length})</span>
          </h2>
          <Link href='/app/finance/statements' className={secondaryButton}>
            Faturas e extratos
          </Link>
        </div>
        {cards.active.length === 0 ? (
          <EmptyState title='Nenhum cartão ainda' hint='Use Novo cartão, no topo da página, para cadastrar o primeiro.' />
        ) : (
          <ul className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
            {cards.active.map((item) => {
              const currency = item.currency.trim();
              const limit =
                item.creditLimitMinor !== null && isCurrency(currency)
                  ? formatMinor(item.creditLimitMinor, currency)
                  : null;
              return (
                <li key={item.id} className={`${card} flex flex-col gap-3 p-4 transition-colors hover:border-ink/25`}>
                  <div className='flex items-center justify-between gap-2 text-xs text-muted'>
                    <CreditCard className='size-4' aria-hidden />
                    <span>{item.brand || names.get(item.institutionId) || 'Cartão'}</span>
                  </div>
                  <div>
                    <Link href={`/app/finance/cards/${item.id}`} className='font-medium text-ink'>
                      {item.nickname}
                    </Link>
                    <p className='text-lg font-semibold tracking-widest text-ink tabular-nums'>
                      {item.last4 ? `•••• ${item.last4}` : 'Sem final'}
                    </p>
                    <p className='inline-flex min-h-9 items-center rounded-lg px-2 text-sm font-medium text-muted transition-colors hover:bg-bg-app hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30'>
                      {[
                        limit ? `Limite ${limit}` : null,
                        `Fecha dia ${item.closingDay}`,
                        `Vence dia ${item.dueDay}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <ItemActionButton
                    action={archiveCardAction}
                    id={item.id}
                    label='Arquivar'
                    className='self-start inline-flex min-h-9 items-center rounded-lg px-2 text-sm font-medium text-muted transition-colors hover:bg-bg-app hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30'
                  >
                    Arquivar
                  </ItemActionButton>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </FinancePage>
  );
}
