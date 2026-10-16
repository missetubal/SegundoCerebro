'use client';

import { type ReactNode, useActionState, useRef } from 'react';
import { type ActionState, IDLE_STATE } from '@/shared/lib';
import { dangerButton, secondaryButton } from '@/shared/ui';

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  id: string;
  title: string;
  description: string;
  triggerLabel: string;
  triggerClassName: string;
  trigger: ReactNode;
};

export function ConfirmDeleteDialog({
  action,
  id,
  title,
  description,
  triggerLabel,
  triggerClassName,
  trigger,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);

  return (
    <>
      <button
        type='button'
        aria-label={triggerLabel}
        title={triggerLabel}
        onClick={() => dialogRef.current?.showModal()}
        className={triggerClassName}
      >
        {trigger}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`delete-title-${id}`}
        className='m-auto w-[min(28rem,calc(100%-2rem))] rounded-2xl border border-border bg-bg-card p-6 text-left text-ink backdrop:bg-black/40'
      >
        <h2 id={`delete-title-${id}`} className='text-lg font-semibold'>
          {title}
        </h2>
        <p className='mt-2 text-sm text-muted'>
          {description}
        </p>
        <form action={formAction} className='mt-6 flex justify-end gap-2'>
          <input type='hidden' name='id' value={id} />
          <button
            type='button'
            onClick={() => dialogRef.current?.close()}
            className={secondaryButton}
          >
            Cancelar
          </button>
          <button type='submit' disabled={pending} className={dangerButton}>
            {pending ? 'Excluindo…' : 'Excluir'}
          </button>
        </form>
        {state.status === 'error' && (
          <p role='alert' className='mt-3 text-sm text-rose-700 dark:text-rose-300'>
            {state.message}
          </p>
        )}
      </dialog>
    </>
  );
}
