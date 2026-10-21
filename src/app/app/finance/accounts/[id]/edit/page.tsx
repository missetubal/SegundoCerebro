import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { requireUserId } from '@/features/auth/server';
import { AccountForm } from '@/features/finance';
import { BackLink, FinancePage, FormShell } from '@/features/finance/presentation/finance-shell';
import {
  getAccount,
  listInstitutions,
  updateAccountAction,
} from '@/features/finance/server';

export default function EditAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <FinancePage
      title='Editar conta'
      description='Atualize nome, instituição, tipo, moeda e saldo inicial.'
      current='/app/finance/accounts'
    >
      <BackLink href='/app/finance/accounts' label='Voltar a contas e cartões' />
      <Suspense fallback={<p className='text-sm text-muted'>Carregando…</p>}>
        <FormShell>
          <Form params={params} />
        </FormShell>
      </Suspense>
    </FinancePage>
  );
}

async function Form({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const [account, institutions] = await Promise.all([
    getAccount(userId, id),
    listInstitutions(userId),
  ]);
  if (!account) notFound();
  return (
    <AccountForm
      action={updateAccountAction}
      institutions={institutions.map((item) => ({ id: item.id, name: item.name }))}
      submitLabel='Salvar alterações'
      cancelHref='/app/finance/accounts'
      initial={{
        id: account.id,
        name: account.name,
        institutionId: account.institutionId,
        accountType: account.accountType as 'checking',
        currency: account.currency.trim() as 'BRL',
        openingBalance: (Number(account.openingBalanceMinor) / 100)
          .toFixed(2)
          .replace('.', ','),
      }}
    />
  );
}
