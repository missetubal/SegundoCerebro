'use client';

import { type ReactNode, useActionState } from 'react';
import { type ActionState, IDLE_STATE } from '@/shared/lib';

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  id: string;
  label: string;
  fields?: Record<string, string>;
  disabled?: boolean;
  className: string;
  children: ReactNode;
};

export function ItemActionButton({
  action,
  id,
  label,
  fields = {},
  disabled = false,
  className,
  children,
}: Props) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);

  return (
    <form action={formAction} className='relative inline-flex'>
      <input type='hidden' name='id' value={id} />
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type='hidden' name={name} value={value} />
      ))}
      <button
        type='submit'
        aria-label={label}
        title={label}
        disabled={disabled || pending}
        className={className}
      >
        {children}
      </button>
      {state.status === 'error' && (
        <span
          role='alert'
          className='absolute top-full right-0 z-10 mt-1 w-max max-w-56 rounded-md bg-rose-50 px-2 py-1 text-xs text-rose-700 dark:bg-rose-950 dark:text-rose-300'
        >
          {state.message}
        </span>
      )}
    </form>
  );
}
