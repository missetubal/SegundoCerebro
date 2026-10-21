import { Suspense } from 'react';
import { requireUserId } from '@/features/auth/server';
import { AccountForm } from '@/features/finance';
import { BackLink, FinancePage, FormShell } from '@/features/finance/presentation/finance-shell';
import { createAccountAction, listInstitutions } from '@/features/finance/server';

export default function NewAccountPage() {
  return (
    <FinancePage
      title='Nova conta'
      description='Cadastre uma conta para acompanhar saldo e lançamentos.'
      current='/app/finance/accounts'
    >
      <BackLink href='/app/finance/accounts' label='Voltar a contas e cartões' />
      <Suspense fallback={<p className='text-sm text-muted'>Carregando…</p>}>
        <FormShell>
          <Form />
        </FormShell>
      </Suspense>
    </FinancePage>
  );
}

async function Form() {
  const userId = await requireUserId();
  const institutions = await listInstitutions(userId);
  return (
    <AccountForm
      action={createAccountAction}
      institutions={institutions.map((item) => ({ id: item.id, name: item.name }))}
      submitLabel='Salvar conta'
      cancelHref='/app/finance/accounts'
    />
  );
}
