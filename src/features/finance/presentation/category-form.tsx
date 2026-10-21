'use client';

import { useActionState } from 'react';
import { type ActionState, IDLE_STATE } from '@/shared/lib';
import Link from 'next/link';
import { primaryButton, secondaryButton, textInput } from '@/shared/ui';

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initial?: { id: string; name: string };
  submitLabel?: string;
  cancelHref?: string;
};

export function CategoryForm({
  action,
  initial,
  submitLabel = 'Criar categoria',
  cancelHref,
}: Props) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  return (
    <form action={formAction} className='flex flex-col gap-3'>
      {state.status === 'error' && (
        <p className='text-sm text-rose-700 dark:text-rose-300'>{state.message}</p>
      )}
      {initial && <input type='hidden' name='id' value={initial.id} />}
      <input type='hidden' name='color' value='' />
      <input type='hidden' name='icon' value='' />
      <input type='hidden' name='parentId' value='' />
      <label className='flex flex-col gap-1 text-sm'>
        Nome
        <input name='name' required defaultValue={initial?.name ?? ''} className={textInput} />
      </label>
      <div className='flex flex-wrap items-center gap-2'>
        <button className={primaryButton} disabled={pending}>
          {submitLabel}
        </button>
        {cancelHref && (
          <Link className={secondaryButton} href={cancelHref}>
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
