import {
  formatMinor,
  isCurrency,
  BackLink,
  FinancePage,
  Panel,
} from '@/features/finance';
import {
  getCard,
  listInstitutions,
  listStatements,
} from '@/features/finance/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CreditCard } from 'lucide-react';
import { requireUserId } from '@/features/auth/server';
import { secondaryButton } from '@/shared/ui';

export default function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className='p-6 text-sm text-muted'>Carregando…</p>}>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const [card, institutions, statements] = await Promise.all([
    getCard(userId, id),
    listInstitutions(userId),
    listStatements(userId, { creditCardId: id }),
  ]);
  if (!card) notFound();
  const currency = card.currency.trim();
  const institution = institutions.find((item) => item.id === card.institutionId)?.name;
  const facts = [
    { label: 'Final', value: card.last4 ? `•••• ${card.last4}` : 'Não informado' },
    { label: 'Bandeira', value: card.brand || 'Não informada' },
    { label: 'Instituição', value: institution ?? 'Não informada' },
    {
      label: 'Limite',
      value:
        card.creditLimitMinor !== null && isCurrency(currency)
          ? formatMinor(card.creditLimitMinor, currency)
          : 'Não informado',
    },
    { label: 'Fechamento', value: `Dia ${card.closingDay}` },
    { label: 'Vencimento', value: `Dia ${card.dueDay}` },
  ];
  return (
    <FinancePage
      title={card.nickname}
      description='Detalhes do cartão. Só os 4 últimos dígitos ficam guardados.'
      current='/app/finance/accounts'
      action={{ href: `/app/finance/cards/${card.id}/edit`, label: 'Editar cartão' }}
    >
      <BackLink href='/app/finance/accounts' label='Voltar a contas e cartões' />
      <Panel title='Cartão'>
        <div className='flex items-center gap-2 text-sm text-muted'>
          <CreditCard className='size-4' aria-hidden />
          <span>{institution ?? card.brand ?? 'Cartão'}</span>
        </div>
        <dl className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {facts.map((fact) => (
            <div key={fact.label} className='rounded-xl bg-bg-app px-3 py-2.5'>
              <dt className='text-[11px] font-medium uppercase tracking-wider text-muted'>{fact.label}</dt>
              <dd className='mt-0.5 text-sm font-medium text-ink'>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </Panel>
      <Panel
        title='Faturas deste cartão'
        action={
          <Link href='/app/finance/statements/new' className={secondaryButton}>
            Importar fatura
          </Link>
        }
      >
        {statements.length === 0 ? (
          <p className='text-sm text-muted'>Nenhuma fatura ainda.</p>
        ) : (
          <ul className='flex flex-col'>
            {statements.map((statement) => (
              <li key={statement.id} className='border-b border-border last:border-b-0'>
                <Link
                  href={`/app/finance/statements/${statement.id}`}
                  className='flex min-h-11 items-center justify-between gap-3 py-2 text-sm hover:text-ink'
                >
                  <span className='font-medium text-ink'>{statement.referenceMonth}</span>
                  <span className='text-muted'>{statement.fileName ?? 'Sem arquivo'}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </FinancePage>
  );
}
