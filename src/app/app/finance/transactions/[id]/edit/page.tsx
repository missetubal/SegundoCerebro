import {
  BackLink,
  FinancePage,
  FormShell,
  TransactionForm,
  type TransactionType,
} from '@/features/finance';
import {
  deleteTransactionAndRedirectAction,
  getTransaction,
  listAccounts,
  listCards,
  listCategories,
  updateTransactionAction,
} from '@/features/finance/server';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { requireUserId } from '@/features/auth/server';
import { ItemActionButton } from '@/shared/ui';

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <FinancePage
      title='Editar lançamento'
      description='Altere os dados do lançamento ou exclua o registro.'
      current='/app/finance/transactions'
    >
      <BackLink href='/app/finance/transactions' label='Voltar aos lançamentos' />
      <Suspense fallback={<p className='text-sm text-muted'>Carregando…</p>}>
        <FormShell>
          <EditTransaction id={id} />
        </FormShell>
      </Suspense>
    </FinancePage>
  );
}

async function EditTransaction({ id }: { id: string }) {
  const userId = await requireUserId();
  const transaction = await getTransaction(userId, id);
  if (!transaction) notFound();
  const [accounts, cards, categories] = await Promise.all([
    listAccounts(userId),
    listCards(userId),
    listCategories(userId),
  ]);
  return (
    <div className='flex flex-col gap-6'>
      <TransactionForm
        action={updateTransactionAction}
        accounts={accounts.active.map((account) => ({ id: account.id, name: account.name }))}
        cards={cards.active.map((card) => ({ id: card.id, name: card.nickname }))}
        categories={categories.active.map((category) => ({
          id: category.id,
          name: category.name,
        }))}
        submitLabel='Salvar alterações'
        cancelHref='/app/finance/transactions'
        initial={{
          id: transaction.id,
          description: transaction.description,
          transactionDate: transaction.transactionDate,
          amount: (Number(transaction.amountMinor) / 100).toFixed(2).replace('.', ','),
          type: transaction.type as TransactionType,
          direction: transaction.direction as 'outflow' | 'inflow',
          accountId: transaction.accountId ?? '',
          creditCardId: transaction.creditCardId ?? '',
          categoryId: transaction.categoryId ?? '',
        }}
      />
      <div className='flex flex-col gap-2 border-t border-border pt-4'>
        <p className='text-sm font-medium text-ink'>Excluir lançamento</p>
        <p className='text-sm text-muted'>Esta ação não pode ser desfeita.</p>
        <ItemActionButton
          action={deleteTransactionAndRedirectAction}
          id={transaction.id}
          label='Excluir'
          className='inline-flex min-h-10 items-center justify-center self-start rounded-lg border border-rose-200 bg-rose-50 px-3.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300'
        >
          Excluir lançamento
        </ItemActionButton>
      </div>
    </div>
  );
}
