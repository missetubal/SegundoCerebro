import {
  BackLink,
  FinancePage,
  FormShell,
} from '@/features/finance';
import {
  createCardAction,
  listInstitutions,
} from '@/features/finance/server';
import { Suspense } from 'react';
import { requireUserId } from '@/features/auth/server';
import { CardForm } from '@/features/finance';

export default function NewCardPage() {
  return (
    <FinancePage
      title='Novo cartão'
      description='Guarde só apelido, bandeira e os 4 últimos dígitos.'
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
    <CardForm
      action={createCardAction}
      institutions={institutions.map((item) => ({ id: item.id, name: item.name }))}
      submitLabel='Salvar cartão'
      cancelHref='/app/finance/accounts'
    />
  );
}
