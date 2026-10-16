'use client';

import { Plus } from 'lucide-react';
import { useActionState, useState } from 'react';
import { primaryButton, secondaryButton, textInput } from '@/shared/ui';
import { type ActionState, IDLE_STATE } from '@/shared/lib';
import { createHorizonAction, renameHorizonAction } from '../application/actions';
import { HORIZON_NAME_MAX } from '../domain';

function ErrorMessage({ state }: { state: ActionState }) {
  return (
    <p aria-live='polite' className='text-sm text-rose-700 dark:text-rose-300'>
      {state.status === 'error' && state.message}
    </p>
  );
}

export function RenameHorizonForm({ id, name }: { id: string; name: string }) {
  const [state, formAction, pending] = useActionState(
    renameHorizonAction,
    IDLE_STATE,
  );
  const [value, setValue] = useState(name);
  const changed = value.trim() !== name;

  return (
    <form action={formAction} className='flex min-w-0 flex-1 flex-col gap-1'>
      <input type='hidden' name='id' value={id} />
      <div className='flex gap-2'>
        <label htmlFor={`horizon-${id}`} className='sr-only'>
          Nome do horizonte
        </label>
        <input
          id={`horizon-${id}`}
          name='name'
          required
          maxLength={HORIZON_NAME_MAX}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className={textInput}
        />
        {changed && (
          <button type='submit' disabled={pending} className={secondaryButton}>
            {pending ? 'Salvando…' : 'Salvar'}
          </button>
        )}
      </div>
      <ErrorMessage state={state} />
    </form>
  );
}

export function CreateHorizonForm() {
  const [name, setName] = useState('');
  const [state, formAction, pending] = useActionState(
    async (previous: ActionState, formData: FormData) => {
      const next = await createHorizonAction(previous, formData);
      if (next.status === 'success') setName('');
      return next;
    },
    IDLE_STATE,
  );

  return (
    <form action={formAction} className='flex flex-col gap-2'>
      <label htmlFor='new-horizon' className='font-medium'>
        Novo horizonte
      </label>
      <div className='flex gap-2'>
        <input
          id='new-horizon'
          name='name'
          required
          maxLength={HORIZON_NAME_MAX}
          placeholder='Ex.: Este trimestre'
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={textInput}
        />
        <button type='submit' disabled={pending} className={primaryButton}>
          <Plus className='size-4' aria-hidden />
          Adicionar
        </button>
      </div>
      <ErrorMessage state={state} />
    </form>
  );
}
