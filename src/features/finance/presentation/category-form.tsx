'use client';

import { useActionState } from 'react';
import { type ActionState, IDLE_STATE } from '@/shared/lib';
import { primaryButton, textInput } from '@/shared/ui';

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
};

export function CategoryForm({ action }: Props) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  return (
    <form action={formAction} className='flex flex-col gap-3'>
      {state.status === 'error' && (
        <p className='text-sm text-rose-700 dark:text-rose-300'>{state.message}</p>
      )}
      <input type='hidden' name='color' value='' />
      <input type='hidden' name='icon' value='' />
      <input type='hidden' name='parentId' value='' />
      <label className='flex flex-col gap-1 text-sm'>
        Nome
        <input name='name' required className={textInput} />
      </label>
      <button className={primaryButton} disabled={pending}>
        Criar categoria
      </button>
    </form>
  );
}
