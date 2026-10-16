'use client';

import { useActionState, useState, useSyncExternalStore } from 'react';
import { primaryButton, textInput } from '@/shared/ui';
import { IDLE_STATE } from '@/shared/lib';
import { updateTimezoneAction } from '../application/actions';

type Props = {
  timezone: string;
  journalTemplate: string;
  timeZones: string[];
};

function subscribe() {
  return () => {};
}

function useBrowserTimeZone(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => null,
  );
}

function formatTimeZone(timeZone: string) {
  return timeZone.replaceAll('_', ' ');
}

export function PreferencesForm({ timezone, journalTemplate, timeZones }: Props) {
  const [state, formAction, pending] = useActionState(
    updateTimezoneAction,
    IDLE_STATE,
  );
  const [selected, setSelected] = useState(timezone);
  const browserTimeZone = useBrowserTimeZone();
  const showSuggestion =
    browserTimeZone !== null &&
    timeZones.includes(browserTimeZone) &&
    browserTimeZone !== timezone &&
    browserTimeZone !== selected;

  return (
    <form action={formAction} className='flex flex-col gap-6'>
      <div className='flex flex-col gap-2'>
        <label htmlFor='timezone' className='font-medium'>
          Fuso horário
        </label>
        <select
          id='timezone'
          name='timezone'
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          className={textInput}
        >
          {timeZones.map((timeZone) => (
            <option key={timeZone} value={timeZone}>
              {formatTimeZone(timeZone)}
            </option>
          ))}
        </select>
        {showSuggestion && (
          <button
            type='button'
            onClick={() => setSelected(browserTimeZone)}
            className='self-start text-sm underline'
          >
            Usar o fuso deste dispositivo: {formatTimeZone(browserTimeZone)}
          </button>
        )}
      </div>

      <div className='flex flex-col gap-1'>
        <span className='font-medium'>Template do check-in</span>
        <span>{journalTemplate === 'minimal' ? 'Minimalista' : journalTemplate}</span>
        <span className='text-sm text-muted'>
          O template detalhado chega numa próxima versão.
        </span>
      </div>

      <button type='submit' disabled={pending} className={`${primaryButton} self-start`}>
        {pending ? 'Salvando…' : 'Salvar'}
      </button>

      <p aria-live='polite' className='text-sm'>
        {state.status === 'success' && 'Fuso horário salvo.'}
        {state.status === 'error' && state.message}
      </p>
    </form>
  );
}
