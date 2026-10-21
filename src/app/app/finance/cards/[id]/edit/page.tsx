import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { requireUserId } from '@/features/auth/server';
import { CardForm } from '@/features/finance';
import { BackLink, FinancePage, FormShell } from '@/features/finance/presentation/finance-shell';
import { getCard, listInstitutions, updateCardAction } from '@/features/finance/server';

export default function EditCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className='p-6 text-sm text-muted'>Carregando…</p>}>
      <EditCard params={params} />
    </Suspense>
  );
}

async function EditCard({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const card = await getCard(userId, id);
  if (!card) notFound();
  return (
    <FinancePage
      title='Editar cartão'
      description='Atualize apelido, limite, fechamento e vencimento.'
      current='/app/finance/accounts'
    >
      <BackLink href={`/app/finance/cards/${card.id}`} label='Voltar ao cartão' />
      <FormShell>
        <Form params={params} />
      </FormShell>
    </FinancePage>
  );
}

async function Form({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const [card, institutions] = await Promise.all([
    getCard(userId, id),
    listInstitutions(userId),
  ]);
  if (!card) notFound();
  return (
    <CardForm
      action={updateCardAction}
      institutions={institutions.map((item) => ({ id: item.id, name: item.name }))}
      submitLabel='Salvar alterações'
      cancelHref={`/app/finance/cards/${card.id}`}
      initial={{
        id: card.id,
        nickname: card.nickname,
        institutionId: card.institutionId,
        brand: card.brand ?? '',
        last4: card.last4 ?? '',
        creditLimit:
          card.creditLimitMinor === null
            ? ''
            : (Number(card.creditLimitMinor) / 100).toFixed(2).replace('.', ','),
        closingDay: String(card.closingDay),
        dueDay: String(card.dueDay),
        currency: card.currency.trim() as 'BRL',
      }}
    />
  );
}
