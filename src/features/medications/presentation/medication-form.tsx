'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { type ActionState, IDLE_STATE } from '@/shared/lib';
import { primaryButton, secondaryButton, textInput } from '@/shared/ui';
import {
  FREQUENCY_KINDS,
  INSTRUCTIONS_MAX,
  ISO_WEEKDAYS,
  MEDICATION_NAME_MAX,
  TIMES_MAX,
  type FrequencyKind,
} from '../domain';

export type MedicationFormValues = {
  id?: string;
  name: string;
  instructions: string | null;
  frequencyKind: FrequencyKind;
  weekdays: number[] | null;
  times: string[];
  startsOn: string;
};

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initial: MedicationFormValues;
  submitLabel: string;
  cancelHref: string;
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

export function MedicationForm({
  action,
  initial,
  submitLabel,
  cancelHref,
}: Props) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const [frequencyKind, setFrequencyKind] = useState<FrequencyKind>(
    initial.frequencyKind,
  );
  const [times, setTimes] = useState<string[]>(
    initial.times.length > 0 ? initial.times : [''],
  );

  return (
    <form action={formAction} className='flex flex-col gap-6'>
      {initial.id && <input type='hidden' name='id' value={initial.id} />}
      <p className='text-sm text-muted'>
        Organização sua. O app guarda o texto e não interpreta dose, tratamento
        ou horário médico.
      </p>

      <div className='flex flex-col gap-2'>
        <label htmlFor='name' className='font-medium'>
          Nome
        </label>
        <input
          id='name'
          name='name'
          required
          maxLength={MEDICATION_NAME_MAX}
          defaultValue={initial.name}
          placeholder='Ex.: Losartana'
          className={textInput}
        />
      </div>

      <div className='flex flex-col gap-2'>
        <label htmlFor='instructions' className='font-medium'>
          Anotações para você organizar
        </label>
        <textarea
          id='instructions'
          name='instructions'
          rows={3}
          maxLength={INSTRUCTIONS_MAX}
          defaultValue={initial.instructions ?? ''}
          placeholder='O que você quiser lembrar. O app não interpreta este texto.'
          className={textInput}
        />
      </div>

      <fieldset className='flex flex-col gap-2'>
        <legend className='font-medium'>Quando</legend>
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
              {kind === 'daily' ? 'Todo dia' : 'Dias da semana'}
            </label>
          ))}
        </div>
        {frequencyKind === 'weekdays' && (
          <div className='flex flex-wrap gap-3'>
            {ISO_WEEKDAYS.map((day) => (
              <label key={day} className='inline-flex items-center gap-2 text-sm'>
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
        <legend className='font-medium'>Horários de referência</legend>
        {times.map((time, index) => (
          <div key={index} className='flex items-center gap-2'>
            <label className='sr-only' htmlFor={`time-${index}`}>
              Horário {index + 1}
            </label>
            <input
              id={`time-${index}`}
              name='times'
              type='time'
              required
              value={time}
              onChange={(event) =>
                setTimes((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? event.target.value : item,
                  ),
                )
              }
              className={textInput}
            />
            {times.length > 1 && (
              <button
                type='button'
                className={secondaryButton}
                onClick={() =>
                  setTimes((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              >
                Remover
              </button>
            )}
          </div>
        ))}
        {times.length < TIMES_MAX && (
          <button
            type='button'
            className={secondaryButton}
            onClick={() => setTimes((current) => [...current, ''])}
          >
            Adicionar horário
          </button>
        )}
      </fieldset>

      <div className='flex flex-col gap-2'>
        <label htmlFor='startsOn' className='font-medium'>
          A partir de
        </label>
        <input
          id='startsOn'
          name='startsOn'
          type='date'
          required
          defaultValue={initial.startsOn}
          className={textInput}
        />
      </div>

      {state.status === 'error' && (
        <p role='alert' className='text-sm text-rose-700 dark:text-rose-300'>
          {state.message}
        </p>
      )}

      <div className='flex flex-wrap gap-2'>
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
