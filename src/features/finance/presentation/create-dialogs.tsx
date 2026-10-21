'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { type ActionState } from '@/shared/lib';
import { iconButton, primaryButton, secondaryButton } from '@/shared/ui';
import { AccountForm, type InstitutionOption } from './account-form';
import { CardForm } from './card-form';

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function CreateInstrumentDialogs({
  institutions,
  accountAction,
  cardAction,
}: {
  institutions: InstitutionOption[];
  accountAction: Action;
  cardAction: Action;
}) {
  const [open, setOpen] = useState<'account' | 'card' | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <div className='flex flex-wrap gap-2'>
        <button type='button' className={secondaryButton} onClick={() => setOpen('account')}>
          Nova conta
        </button>
        <button type='button' className={primaryButton} onClick={() => setOpen('card')}>
          Novo cartão
        </button>
      </div>
      {open && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4'
          onClick={() => setOpen(null)}
        >
          <div
            role='dialog'
            aria-modal='true'
            aria-labelledby='instrument-dialog-title'
            className='max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-bg-card p-5 shadow-lg'
            onClick={(event) => event.stopPropagation()}
          >
            <header className='mb-4 flex items-center justify-between gap-3'>
              <h2 id='instrument-dialog-title' className='text-lg font-semibold text-ink'>
                {open === 'account' ? 'Nova conta' : 'Novo cartão'}
              </h2>
              <button type='button' aria-label='Fechar' className={iconButton} onClick={() => setOpen(null)}>
                <X className='size-4' aria-hidden />
              </button>
            </header>
            {open === 'account' ? (
              <AccountForm
                action={accountAction}
                institutions={institutions}
                submitLabel='Adicionar conta'
                onCancel={() => setOpen(null)}
              />
            ) : (
              <CardForm
                action={cardAction}
                institutions={institutions}
                submitLabel='Adicionar cartão'
                onCancel={() => setOpen(null)}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
