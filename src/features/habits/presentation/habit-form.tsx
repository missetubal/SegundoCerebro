'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { primaryButton, secondaryButton, textInput } from '@/shared/ui';
import { type ActionState, IDLE_STATE } from '@/shared/lib';
import {
  FREQUENCY_KINDS,
  HABIT_NAME_MAX,
  HABIT_UNIT_MAX,
  ISO_WEEKDAYS,
  TRACKING_TYPES,
  type FrequencyKind,
  type TrackingType,
} from '../domain';

export type HabitFormAreaOption = { id: string; name: string };

type HabitValues = {
  id?: string;
  name: string;
  trackingType: TrackingType;
  frequencyKind: FrequencyKind;
  weekdays: number[] | null;
  targetValue: number | null;
  unit: string | null;
  areaIds: string[];
};

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  areas: HabitFormAreaOption[];
  initial?: HabitValues;
  submitLabel: string;
  cancelHref: string;
};

const EMPTY: HabitValues = {
  name: '',
  trackingType: 'completion',
  frequencyKind: 'daily',
  weekdays: null,
  targetValue: null,
  unit: null,
  areaIds: [],
};

const WEEKDAY_LABELS: Record<number, string> = {
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
  7: 'Dom',
};

export function HabitForm({
  action,
  areas,
  initial = EMPTY,
  submitLabel,
  cancelHref,
}: Props) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const [trackingType, setTrackingType] = useState<TrackingType>(
    initial.trackingType,
  );
  const [frequencyKind, setFrequencyKind] = useState<FrequencyKind>(
    initial.frequencyKind,
  );

  return (
    <form action={formAction} className='flex flex-col gap-6'>
      {initial.id && <input type='hidden' name='id' value={initial.id} />}

      <div className='flex flex-col gap-2'>
        <label htmlFor='name' className='font-medium'>
          Nome
        </label>
        <input
          id='name'
          name='name'
          required
          maxLength={HABIT_NAME_MAX}
          defaultValue={initial.name}
          placeholder='Ex.: Meditar, Água…'
          className={textInput}
        />
      </div>

      <fieldset className='flex flex-col gap-2'>
        <legend className='font-medium'>Tipo de acompanhamento</legend>
        <div className='flex flex-wrap gap-3'>
          {TRACKING_TYPES.map((type) => (
            <label key={type} className='inline-flex items-center gap-2 text-sm'>
              <input
                type='radio'
                name='trackingType'
                value={type}
                checked={trackingType === type}
                onChange={() => setTrackingType(type)}
              />
              {type === 'completion' ? 'Conclusão' : 'Quantidade'}
            </label>
          ))}
        </div>
      </fieldset>

      {trackingType === 'quantity' && (
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='flex flex-col gap-2'>
            <label htmlFor='targetValue' className='font-medium'>
              Meta
            </label>
            <input
              id='targetValue'
              name='targetValue'
              type='number'
              min={1}
              step={1}
              defaultValue={initial.targetValue ?? ''}
              className={textInput}
            />
          </div>
          <div className='flex flex-col gap-2'>
            <label htmlFor='unit' className='font-medium'>
              Unidade
            </label>
            <input
              id='unit'
              name='unit'
              maxLength={HABIT_UNIT_MAX}
              defaultValue={initial.unit ?? ''}
              placeholder='ml'
              className={textInput}
            />
          </div>
        </div>
      )}

      <fieldset className='flex flex-col gap-2'>
        <legend className='font-medium'>Frequência</legend>
        <div className='flex flex-wrap gap-3'>
          {FREQUENCY_KINDS.map((kind) => (
            <label key={kind} className='inline-flex items-center gap-2 text-sm'>
              <input
                type='radio'
                name='frequencyKind'
                value={kind}
                checked={frequencyKind === kind}
                onChange={() => setFrequencyKind(kind)}
              />
              {kind === 'daily' ? 'Diário' : 'Dias da semana'}
            </label>
          ))}
        </div>
        {frequencyKind === 'weekdays' && (
          <div className='mt-2 flex flex-wrap gap-3'>
            {ISO_WEEKDAYS.map((day) => (
              <label
                key={day}
                className='inline-flex items-center gap-2 text-sm'
              >
                <input
                  type='checkbox'
                  name='weekdays'
                  value={day}
                  defaultChecked={(initial.weekdays ?? []).includes(day)}
                />
                {WEEKDAY_LABELS[day]}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset className='flex flex-col gap-2'>
        <legend className='font-medium'>Áreas</legend>
        <div className='flex flex-col gap-2'>
          {areas.length === 0 ? (
            <p className='text-sm text-muted'>
              Crie ao menos uma área ativa antes de cadastrar hábitos.
            </p>
          ) : (
            areas.map((area) => (
              <label
                key={area.id}
                className='inline-flex items-center gap-2 text-sm'
              >
                <input
                  type='checkbox'
                  name='areaIds'
                  value={area.id}
                  defaultChecked={initial.areaIds.includes(area.id)}
                />
                {area.name}
              </label>
            ))
          )}
        </div>
      </fieldset>

      {state.status === 'error' && (
        <p className='text-sm text-rose-700 dark:text-rose-300' role='alert'>
          {state.message}
        </p>
      )}

      <div className='flex flex-wrap gap-3'>
        <button
          type='submit'
          disabled={pending || areas.length === 0}
          className={primaryButton}
        >
          {pending ? 'Salvando…' : submitLabel}
        </button>
        <Link href={cancelHref} className={secondaryButton}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
