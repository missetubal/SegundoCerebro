import { Suspense } from 'react';
import { requireUserId } from '@/features/auth/server';
import { BackLink, FinancePage, FormShell } from '@/features/finance/presentation/finance-shell';
import { TransactionForm } from '@/features/finance/presentation/transaction-form';
import {
  createTransactionAction,
  listAccounts,
  listCards,
  listCategories,
} from '@/features/finance/server';

export default function NewTransactionPage() {
  return (
    <FinancePage
      title='Novo lançamento'
      description='Registre uma despesa, receita, estorno, pagamento ou transferência.'
      current='/app/finance/transactions'
    >
      <BackLink href='/app/finance/transactions' label='Voltar aos lançamentos' />
      <Suspense fallback={<p className='text-sm text-muted'>Carregando…</p>}>
        <FormShell>
          <NewTransaction />
        </FormShell>
      </Suspense>
    </FinancePage>
  );
}

async function NewTransaction() {
  const userId = await requireUserId();
  const [accounts, cards, categories] = await Promise.all([
    listAccounts(userId),
    listCards(userId),
    listCategories(userId),
  ]);
  return (
    <TransactionForm
      action={createTransactionAction}
      accounts={accounts.active.map((account) => ({ id: account.id, name: account.name }))}
      cards={cards.active.map((card) => ({ id: card.id, name: card.nickname }))}
      categories={categories.active.map((category) => ({
        id: category.id,
        name: category.name,
      }))}
      submitLabel='Salvar lançamento'
      cancelHref='/app/finance/transactions'
    />
  );
}
