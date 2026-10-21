import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { FileText } from 'lucide-react';
import { requireUserId } from '@/features/auth/server';
import { FinancePage } from '@/features/finance/presentation/finance-shell';
import { ImportReview } from '@/features/finance/presentation/import-review';
import { ImportStepper } from '@/features/finance/presentation/import-steps';
import {
  confirmImportAction,
  getStatement,
  importSource,
  listCategories,
  startPreviewAction,
} from '@/features/finance/server';
import { card, secondaryButton } from '@/shared/ui';

export default function ImportPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className='p-6 text-sm text-muted'>Carregando…</p>}>
      <ImportBody params={params} />
    </Suspense>
  );
}

async function ImportBody({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const statement = await getStatement(userId, id);
  if (!statement) notFound();
  const [source, categories] = await Promise.all([
    importSource(userId, id),
    listCategories(userId),
  ]);
  return (
    <FinancePage
      title='Importar fatura'
      description='Importe um arquivo de fatura e revise os lançamentos.'
      current='/app/finance'
    >
      {!source || source.kind === 'other' ? (
        <StoredFile statementId={id} />
      ) : source.kind === 'csv' && source.headers.length === 0 ? (
        <p className='text-sm text-muted'>Não foi possível ler as colunas desse CSV.</p>
      ) : (
        <ImportReview
          statementId={id}
          headers={source.headers}
          currency={statement.currency}
          instrument={statement.creditCardId ? 'card' : 'account'}
          declaredTotalMinor={
            statement.declaredTotalMinor === null ? null : statement.declaredTotalMinor.toString()
          }
          categories={categories.active.map((category) => ({
            id: category.id,
            name: category.name,
          }))}
          startAction={startPreviewAction}
          confirmAction={confirmImportAction}
        />
      )}
    </FinancePage>
  );
}

function StoredFile({ statementId }: { statementId: string }) {
  return (
    <div className='flex flex-col gap-6'>
      <ImportStepper current='done' complete={['upload']} />
      <section className={`${card} flex flex-col items-center gap-3 px-6 py-16 text-center`}>
        <span className='inline-flex size-12 items-center justify-center rounded-full bg-bg-app text-muted'>
          <FileText className='size-5' aria-hidden />
        </span>
        <h2 className='text-xl font-semibold text-ink'>Arquivo guardado</h2>
        <p className='max-w-md text-sm text-muted'>
          O arquivo continua guardado. Esta versão não lê PDF nem imagem.
        </p>
        <Link href={`/app/finance/statements/${statementId}`} className={secondaryButton}>
          Ver fatura
        </Link>
      </section>
    </div>
  );
}
