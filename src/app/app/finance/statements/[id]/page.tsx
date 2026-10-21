import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Download, FileText } from 'lucide-react';
import { requireUserId } from '@/features/auth/server';
import { formatMinor, isCurrency } from '@/features/finance/domain/money';
import {
  BackLink,
  EmptyState,
  FinancePage,
  Panel,
  StatusPill,
} from '@/features/finance/presentation/finance-shell';
import { formatDay, formatMonth } from '@/features/finance/presentation/format';
import {
  StatementDeleteForms,
  ReplaceFileForm,
  UndoBatchButton,
} from '@/features/finance/presentation/statement-actions';
import {
  deleteAttachmentAction,
  deleteImportedAction,
  getStatement,
  listAccounts,
  listBatches,
  listCards,
  replaceAttachmentAction,
  undoImportAction,
} from '@/features/finance/server';
import { primaryButton, secondaryButton } from '@/shared/ui';

const STATUS: Record<string, { label: string; tone: 'neutral' | 'success' | 'info' }> = {
  attached: { label: 'Anexada', tone: 'neutral' },
  imported: { label: 'Importada', tone: 'info' },
  reviewed: { label: 'Revisada', tone: 'success' },
};

const BATCH_STATUS: Record<string, string> = {
  preview: 'Prévia aberta',
  confirmed: 'Confirmado',
  undone: 'Desfeito',
};

export default function StatementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className='p-6 text-sm text-muted'>Carregando…</p>}>
      <StatementDetail params={params} />
    </Suspense>
  );
}

async function StatementDetail({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const statement = await getStatement(userId, id);
  if (!statement) notFound();
  const [batches, accounts, cards] = await Promise.all([
    listBatches(userId, id),
    listAccounts(userId),
    listCards(userId),
  ]);
  const owner = statement.accountId
    ? [...accounts.active, ...accounts.archived].find((item) => item.id === statement.accountId)?.name
    : [...cards.active, ...cards.archived].find((item) => item.id === statement.creditCardId)?.nickname;
  const importable = /\.(csv|ofx|qfx)$/i.test(statement.fileName ?? '');
  const status = STATUS[statement.status] ?? { label: statement.status, tone: 'neutral' as const };
  const facts = [
    { label: 'Conta ou cartão', value: owner ?? 'Não informado' },
    { label: 'Período', value: `${formatDay(statement.periodStart)} a ${formatDay(statement.periodEnd)}` },
    {
      label: 'Vencimento',
      value: statement.dueDate ? formatDay(statement.dueDate) : 'Não informado',
    },
    {
      label: 'Total informado',
      value:
        statement.declaredTotalMinor === null
          ? 'Não informado'
          : isCurrency(statement.currency)
            ? formatMinor(statement.declaredTotalMinor, statement.currency)
            : statement.declaredTotalMinor.toString(),
    },
  ];
  return (
    <FinancePage
      title={`Fatura de ${formatMonth(statement.referenceMonth)}`}
      description='Arquivo, conferência e importações desta fatura.'
      current='/app/finance/accounts'
    >
      <BackLink href='/app/finance/statements' label='Voltar às faturas' />
      <Panel
        title='Resumo'
        action={<StatusPill tone={status.tone}>{status.label}</StatusPill>}
      >
        <dl className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          {facts.map((fact) => (
            <div key={fact.label} className='rounded-xl bg-bg-app px-3 py-2.5'>
              <dt className='text-[11px] font-medium uppercase tracking-wider text-muted'>{fact.label}</dt>
              <dd className='mt-0.5 text-sm font-medium text-ink'>{fact.value}</dd>
            </div>
          ))}
        </dl>
        {statement.fileName ? (
          <div className='flex flex-wrap items-center gap-3'>
            <span className='inline-flex min-w-0 items-center gap-2 text-sm text-muted'>
              <FileText className='size-4 shrink-0' aria-hidden />
              <span className='truncate'>{statement.fileName}</span>
            </span>
            <Link href={`/app/finance/statements/${statement.id}/file`} className={secondaryButton}>
              <Download className='size-4' aria-hidden />
              Baixar arquivo
            </Link>
            {importable && (
              <Link href={`/app/finance/statements/${statement.id}/import`} className={primaryButton}>
                Importar lançamentos
              </Link>
            )}
          </div>
        ) : (
          <p className='text-sm text-muted'>Arquivo excluído. A fatura e os lançamentos continuam.</p>
        )}
        {!importable && statement.fileName && (
          <p className='text-sm text-muted'>
            PDF e imagem ficam só como anexo. Esta versão não lê esses formatos.
          </p>
        )}
      </Panel>

      <Panel title='Importações'>
        {batches.length === 0 ? (
          <EmptyState
            title='Nenhuma importação ainda'
            hint={
              importable
                ? 'Abra a revisão para conferir os lançamentos antes de salvar.'
                : 'Este arquivo não gera lançamentos nesta versão.'
            }
          />
        ) : (
          <ul className='flex flex-col'>
            {batches.map((batch) => (
              <li
                key={batch.id}
                className='flex min-h-11 flex-wrap items-center justify-between gap-3 border-b border-border py-2 last:border-b-0'
              >
                <span className='text-sm text-ink'>
                  <span className='font-medium uppercase'>{batch.sourceFormat}</span>
                  <span className='text-muted'>
                    {' · '}
                    {BATCH_STATUS[batch.status] ?? batch.status} · {batch.rowCount}{' '}
                    {batch.rowCount === 1 ? 'linha' : 'linhas'}
                  </span>
                </span>
                {batch.status === 'confirmed' && (
                  <UndoBatchButton batchId={batch.id} action={undoImportAction} />
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title='Arquivo' description='Troque o anexo ou apague o arquivo sem perder a fatura.'>
        <div className='flex max-w-xl flex-col gap-5'>
          <ReplaceFileForm statementId={statement.id} action={replaceAttachmentAction} />
          <StatementDeleteForms
            statementId={statement.id}
            deleteFile={deleteAttachmentAction}
            deleteImported={deleteImportedAction}
          />
        </div>
      </Panel>
    </FinancePage>
  );
}
