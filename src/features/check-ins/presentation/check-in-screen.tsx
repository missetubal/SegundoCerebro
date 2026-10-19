'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { ConfirmDeleteDialog } from '@/shared/ui';
import { type ActionState, IDLE_STATE } from '@/shared/lib';
import {
  bodyText,
  caption,
  card,
  eyebrow,
  primaryButton,
  secondaryButton,
  textInput,
} from '@/shared/ui';

export type CheckInHabitField = {
  id: string;
  name: string;
  trackingType: 'completion' | 'quantity';
  unit: string | null;
  targetValue: number | null;
  completionStatus: 'done' | 'not_done' | null;
  value: number | null;
};

export type CheckInOrphanField = {
  habitId: string;
  habitName: string;
  summary: string;
};

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  deleteAction: (state: ActionState, formData: FormData) => Promise<ActionState>;
  entryDate: string;
  today: string;
  formattedDate: string;
  isPast: boolean;
  generalNote: string | null;
  mood: number | null;
  habits: CheckInHabitField[];
  orphans: CheckInOrphanField[];
  hasSavedData: boolean;
};

const COMPLETION = [
  { value: 'done', label: 'Feito' },
  { value: 'not_done', label: 'Não realizado' },
  { value: 'unset', label: 'Sem registro' },
] as const;

type CompletionValue = (typeof COMPLETION)[number]['value'];

export function CheckInScreen(props: Props) {
  return (
    <>
      <header className='flex flex-col gap-3'>
        <div className='flex flex-col gap-1'>
          <span className={eyebrow}>Check-in</span>
          <h1 className='text-3xl font-semibold'>Como foi este dia?</h1>
          <p className={caption}>
            Um registro por dia. Em branco permanece neutro.
          </p>
        </div>
        <CheckInDateField entryDate={props.entryDate} today={props.today} />
        {props.isPast && (
          <p className={`${card} bg-pastel-sky p-3 text-sm`}>
            Editando {props.formattedDate}, um dia passado. O registro continua
            nessa data.
          </p>
        )}
      </header>
      <CheckInForm {...props} />
    </>
  );
}

export function CheckInDateField({
  entryDate,
  today,
}: {
  entryDate: string;
  today: string;
}) {
  const router = useRouter();

  function openCommittedDate(value: string) {
    if (!value || value === entryDate) return;
    router.push(value === today ? '/app/check-in' : `/app/check-in?date=${value}`);
  }

  return (
    <label className='flex flex-col gap-1 text-sm'>
      Data
      <input
        type='date'
        max={today}
        defaultValue={entryDate}
        onBlur={(event) => openCommittedDate(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return;
          event.preventDefault();
          openCommittedDate(event.currentTarget.value);
        }}
        className={`${textInput} min-w-0 max-w-full`}
      />
    </label>
  );
}

function CheckInForm({
  action,
  deleteAction,
  entryDate,
  generalNote,
  mood,
  habits,
  orphans,
  hasSavedData,
}: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const [selectedMood, setSelectedMood] = useState<number | null>(mood);
  const [completion, setCompletion] = useState<Record<string, CompletionValue>>(
    () =>
      Object.fromEntries(
        habits
          .filter((habit) => habit.trackingType === 'completion')
          .map((habit) => [habit.id, habit.completionStatus ?? 'unset']),
      ),
  );

  useEffect(() => {
    if (state.status === 'success') router.refresh();
  }, [router, state]);

  return (
    <>
      <form action={formAction} className='flex flex-col gap-3'>
        <input type='hidden' name='entryDate' value={entryDate} />
        <input type='hidden' name='mood' value={selectedMood ?? ''} />

        {habits.length === 0 ? (
          <div className={`${card} p-5`}>
            <p className={bodyText}>Nenhum hábito para este dia.</p>
            <Link href='/app/habits/new' className='mt-2 inline-block text-sm underline'>
              Criar hábito
            </Link>
          </div>
        ) : (
          habits.map((habit) => (
            <article key={habit.id} className={`${card} flex flex-col gap-3 p-4`}>
              <h2 className='text-base font-semibold'>{habit.name}</h2>
              {habit.trackingType === 'completion' ? (
                <div className='flex flex-wrap gap-2'>
                  {COMPLETION.map((option) => {
                    const selected = completion[habit.id] === option.value;
                    return (
                      <button
                        key={option.value}
                        type='button'
                        aria-pressed={selected}
                        className={selected ? primaryButton : secondaryButton}
                        onClick={() =>
                          setCompletion((current) => ({
                            ...current,
                            [habit.id]: option.value,
                          }))
                        }
                      >
                        {option.label}
                      </button>
                    );
                  })}
                  <input
                    type='hidden'
                    name={`completion:${habit.id}`}
                    value={completion[habit.id] ?? 'unset'}
                  />
                </div>
              ) : (
                <div className='flex flex-col gap-1'>
                  <label className='text-sm' htmlFor={`value-${habit.id}`}>
                    Quantidade{habit.unit ? ` (${habit.unit})` : ''}
                    <span className='text-muted'> · opcional</span>
                  </label>
                  <input
                    id={`value-${habit.id}`}
                    name={`value:${habit.id}`}
                    type='number'
                    min={0}
                    step={1}
                    inputMode='numeric'
                    defaultValue={habit.value ?? ''}
                    placeholder='Sem registro'
                    className={textInput}
                  />
                  {habit.targetValue != null && (
                    <span className={caption}>
                      Meta {habit.targetValue}
                      {habit.unit ? ` ${habit.unit}` : ''}
                    </span>
                  )}
                </div>
              )}
            </article>
          ))
        )}

        {orphans.map((orphan) => (
          <article key={orphan.habitId} className={`${card} flex flex-col gap-2 p-4`}>
            <h2 className='text-base font-semibold'>{orphan.habitName}</h2>
            <p className={caption}>Registro já salvo · {orphan.summary}</p>
            <label className='flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                name={`clear:${orphan.habitId}`}
                value='true'
              />
              Limpar registro
            </label>
          </article>
        ))}

        <article className={`${card} flex flex-col gap-2 p-4`}>
          <label htmlFor='generalNote' className='text-base font-semibold'>
            Nota do dia <span className='text-sm font-normal text-muted'>(opcional)</span>
          </label>
          <textarea
            id='generalNote'
            name='generalNote'
            rows={3}
            maxLength={2000}
            defaultValue={generalNote ?? ''}
            placeholder='Como foi o dia…'
            className={textInput}
          />
        </article>

        <article className={`${card} flex flex-col gap-2 p-4`}>
          <h2 className='text-base font-semibold'>
            Humor <span className='text-sm font-normal text-muted'>(opcional) · 1 a 5</span>
          </h2>
          <div className='flex flex-wrap gap-2'>
            {[1, 2, 3, 4, 5].map((score) => {
              const selected = selectedMood === score;
              return (
                <button
                  key={score}
                  type='button'
                  aria-pressed={selected}
                  className={`flex size-9 items-center justify-center rounded-full border text-sm ${
                    selected
                      ? 'border-ink bg-ink text-white'
                      : 'border-border text-ink'
                  }`}
                  onClick={() =>
                    setSelectedMood((current) => (current === score ? null : score))
                  }
                >
                  {score}
                </button>
              );
            })}
          </div>
        </article>

        {state.status === 'error' && (
          <p role='alert' className='text-sm text-rose-700 dark:text-rose-300'>
            {state.message}
          </p>
        )}

        <footer className='flex flex-wrap items-center justify-between gap-3'>
          <p className={caption}>Em branco permanece neutro</p>
          <button type='submit' disabled={pending} className={primaryButton}>
            {pending ? 'Salvando…' : 'Salvar'}
          </button>
        </footer>
      </form>

      {hasSavedData && (
        <div className='flex justify-end'>
          <ConfirmDeleteDialog
            action={deleteAction}
            id={entryDate}
            title='Apagar este dia?'
            description='A nota, o humor e os registros deste dia saem. O dia fica em branco.'
            triggerLabel='Apagar este dia'
            triggerClassName='text-sm text-muted underline'
            trigger='Apagar este dia'
          />
        </div>
      )}
    </>
  );
}
