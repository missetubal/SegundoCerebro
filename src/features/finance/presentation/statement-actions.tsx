'use client';

import { useActionState } from 'react';
import { type ActionState, IDLE_STATE } from '@/shared/lib';
import { dangerButton, secondaryButton } from '@/shared/ui';

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

const errorClass = 'text-sm text-rose-700 dark:text-rose-300';

export function StatementDeleteForms({
  statementId,
  deleteFile,
  deleteImported,
}: {
  statementId: string;
  deleteFile: Action;
  deleteImported: Action;
}) {
  const [fileState, fileAction, filePending] = useActionState(deleteFile, IDLE_STATE);
  const [importedState, importedAction, importedPending] = useActionState(deleteImported, IDLE_STATE);
  return (
    <div className='flex flex-col gap-4 border-t border-border pt-4'>
      <div className='flex flex-col gap-2'>
        {fileState.status === 'error' && <p className={errorClass}>{fileState.message}</p>}
        <form action={fileAction}>
          <input type='hidden' name='id' value={statementId} />
          <button className={secondaryButton} disabled={filePending}>
            Excluir só o anexo
          </button>
        </form>
        <p className='text-[11px] leading-relaxed text-muted'>
          A fatura e os lançamentos importados continuam.
        </p>
      </div>
      <div className='flex flex-col gap-2'>
        {importedState.status === 'error' && <p className={errorClass}>{importedState.message}</p>}
        <form action={importedAction} className='flex flex-col items-start gap-2'>
          <input type='hidden' name='id' value={statementId} />
          <label className='flex min-h-9 items-center gap-2 text-sm text-ink'>
            <input type='checkbox' name='confirm' value='yes' className='size-4 shrink-0' />
            Confirmo apagar o arquivo e os lançamentos importados
          </label>
          <button className={dangerButton} disabled={importedPending}>
            Excluir anexo e lançamentos importados
          </button>
        </form>
      </div>
    </div>
  );
}

export function ReplaceFileForm({
  statementId,
  action,
}: {
  statementId: string;
  action: Action;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  return (
    <form action={formAction} className='flex flex-col items-start gap-2'>
      {state.status === 'error' && <p className={errorClass}>{state.message}</p>}
      <input type='hidden' name='id' value={statementId} />
      <label className='flex w-full flex-col gap-1 text-sm text-ink'>
        Substituir arquivo
        <input
          name='file'
          type='file'
          required
          accept='.pdf,.csv,.ofx,.qfx,.png,.jpg,.jpeg,.webp'
          className='min-h-10 w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-bg-app file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25'
        />
      </label>
      <button className={secondaryButton} disabled={pending}>
        Substituir arquivo
      </button>
    </form>
  );
}

export function UndoBatchButton({ batchId, action }: { batchId: string; action: Action }) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  return (
    <form action={formAction} className='flex items-center gap-2'>
      {state.status === 'error' && <span className={errorClass}>{state.message}</span>}
      <input type='hidden' name='batchId' value={batchId} />
      <button
        className='inline-flex min-h-9 items-center rounded-lg px-2 text-sm font-medium text-muted transition-colors hover:bg-bg-app hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 disabled:opacity-50'
        disabled={pending}
      >
        Desfazer lote
      </button>
    </form>
  );
}
