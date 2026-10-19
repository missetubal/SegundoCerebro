'use client';

import { useActionState, useState } from 'react';
import { primaryButton, textInput } from '@/shared/ui';
import { type ActionState, IDLE_STATE } from '@/shared/lib';
import { NEXT_STEP_TITLE_MAX } from '../domain';

type Props = {
  goalId: string;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
};

export function NextStepForm({ goalId, action }: Props) {
  const [title, setTitle] = useState('');
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const next = await action(prev, formData);
      if (next.status === 'success') {
        setTitle('');
      }
      return next;
    },
    IDLE_STATE,
  );

  return (
    <form action={formAction} className='flex flex-col gap-3'>
      <input type='hidden' name='goalId' value={goalId} />
      <div className='flex flex-col gap-2 sm:flex-row sm:items-end'>
        <div className='flex flex-1 flex-col gap-2'>
          <label htmlFor='next-step-title' className='font-medium'>
            Novo próximo passo
          </label>
          <input
            id='next-step-title'
            name='title'
            required
            maxLength={NEXT_STEP_TITLE_MAX}
            placeholder='Ex.: Comprar tênis'
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={textInput}
          />
        </div>
        <button type='submit' disabled={pending} className={primaryButton}>
          {pending ? 'Adicionando…' : 'Adicionar'}
        </button>
      </div>
      {state.status === 'error' && (
        <p className='text-sm text-rose-700 dark:text-rose-300' role='alert'>
          {state.message}
        </p>
      )}
    </form>
  );
}
