'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { primaryButton, secondaryButton, textInput } from '@/shared/ui';
import { type ActionState, IDLE_STATE } from '@/shared/lib';
import { GOAL_STATUSES, GOAL_TITLE_MAX, type GoalStatus } from '../domain';

export type GoalFormOption = { id: string; name: string };

type GoalValues = {
  id?: string;
  title: string;
  primaryAreaId: string;
  horizonId: string;
  status: GoalStatus;
  startDate: string | null;
  targetDate: string | null;
};

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  areas: GoalFormOption[];
  horizons: GoalFormOption[];
  initial?: GoalValues;
  submitLabel: string;
  cancelHref: string;
};

const EMPTY: GoalValues = {
  title: '',
  primaryAreaId: '',
  horizonId: '',
  status: 'active',
  startDate: null,
  targetDate: null,
};

const STATUS_LABELS: Record<GoalStatus, string> = {
  active: 'Ativa',
  completed: 'Concluída',
  archived: 'Arquivada',
};

export function GoalForm({
  action,
  areas,
  horizons,
  initial = EMPTY,
  submitLabel,
  cancelHref,
}: Props) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);

  return (
    <form action={formAction} className='flex flex-col gap-6'>
      {initial.id && <input type='hidden' name='id' value={initial.id} />}

      <div className='flex flex-col gap-2'>
        <label htmlFor='title' className='font-medium'>
          Título
        </label>
        <input
          id='title'
          name='title'
          required
          maxLength={GOAL_TITLE_MAX}
          defaultValue={initial.title}
          className={textInput}
        />
      </div>

      <div className='flex flex-col gap-2'>
        <label htmlFor='primaryAreaId' className='font-medium'>
          Área principal
        </label>
        <select
          id='primaryAreaId'
          name='primaryAreaId'
          required
          defaultValue={initial.primaryAreaId}
          className={textInput}
        >
          <option value='' disabled>
            Escolha uma área
          </option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </div>

      <div className='flex flex-col gap-2'>
        <label htmlFor='horizonId' className='font-medium'>
          Horizonte
        </label>
        <select
          id='horizonId'
          name='horizonId'
          required
          defaultValue={initial.horizonId}
          className={textInput}
        >
          <option value='' disabled>
            Escolha um horizonte
          </option>
          {horizons.map((horizon) => (
            <option key={horizon.id} value={horizon.id}>
              {horizon.name}
            </option>
          ))}
        </select>
      </div>

      <div className='flex flex-col gap-2'>
        <label htmlFor='status' className='font-medium'>
          Status
        </label>
        <select
          id='status'
          name='status'
          defaultValue={initial.status}
          className={textInput}
        >
          {GOAL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='flex flex-col gap-2'>
          <label htmlFor='startDate' className='font-medium'>
            Data de início{' '}
            <span className='text-sm font-normal text-muted'>(opcional)</span>
          </label>
          <input
            id='startDate'
            name='startDate'
            type='date'
            defaultValue={initial.startDate ?? ''}
            className={textInput}
          />
        </div>
        <div className='flex flex-col gap-2'>
          <label htmlFor='targetDate' className='font-medium'>
            Data-alvo{' '}
            <span className='text-sm font-normal text-muted'>(opcional)</span>
          </label>
          <input
            id='targetDate'
            name='targetDate'
            type='date'
            defaultValue={initial.targetDate ?? ''}
            className={textInput}
          />
        </div>
      </div>

      {state.status === 'error' && (
        <p className='text-sm text-rose-700 dark:text-rose-300' role='alert'>
          {state.message}
        </p>
      )}

      <div className='flex flex-wrap gap-3'>
        <button type='submit' disabled={pending} className={primaryButton}>
          {pending ? 'Salvando…' : submitLabel}
        </button>
        <Link href={cancelHref} className={secondaryButton}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
