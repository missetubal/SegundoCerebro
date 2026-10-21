'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { type ActionState, IDLE_STATE } from '@/shared/lib';
import { primaryButton, secondaryButton, textInput } from '@/shared/ui';
import { ASSET_CLASSES, type AssetClass } from '../domain/validation';
import { CURRENCIES, type Currency } from '../domain/money';
import { INSTITUTION_SUGGESTIONS, type InstitutionOption } from './account-form';
import { CLASS_LABELS } from './labels';

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  institutions: InstitutionOption[];
  submitLabel: string;
  cancelHref: string;
  initial?: {
    id?: string;
    name: string;
    ticker: string;
    assetClass: AssetClass;
    institutionId: string;
    currency: Currency;
  };
};

export function AssetForm({
  action,
  institutions,
  submitLabel,
  cancelHref,
  initial,
}: Props) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const [newInstitutionName, setNewInstitutionName] = useState('');
  return (
    <form action={formAction} className='flex flex-col gap-4'>
      {initial?.id && <input type='hidden' name='id' value={initial.id} />}
      {state.status === 'error' && (
        <p className='text-sm text-rose-700 dark:text-rose-300'>{state.message}</p>
      )}
      <label className='flex flex-col gap-1 text-sm'>
        Nome
        <input name='name' required defaultValue={initial?.name} className={textInput} />
      </label>
      <label className='flex flex-col gap-1 text-sm'>
        Ticker
        <input name='ticker' defaultValue={initial?.ticker} className={textInput} />
      </label>
      <label className='flex flex-col gap-1 text-sm'>
        Classe
        <select name='assetClass' defaultValue={initial?.assetClass ?? 'fixed_income'} className={textInput}>
          {ASSET_CLASSES.map((assetClass) => (
            <option key={assetClass} value={assetClass}>
              {CLASS_LABELS[assetClass]}
            </option>
          ))}
        </select>
      </label>
      <label className='flex flex-col gap-1 text-sm'>
        Instituição já cadastrada
        <select name='institutionId' defaultValue={initial?.institutionId ?? ''} className={textInput}>
          <option value=''>Nenhuma</option>
          {institutions.map((institution) => (
            <option key={institution.id} value={institution.id}>
              {institution.name}
            </option>
          ))}
        </select>
      </label>
      <input type='hidden' name='newInstitutionName' value={newInstitutionName} />
      <div className='flex flex-wrap gap-2'>
        {INSTITUTION_SUGGESTIONS.map((name) => (
          <button key={name} type='button' className='inline-flex min-h-8 items-center rounded-full border border-border bg-bg-card px-3 text-xs font-medium text-ink transition-colors hover:bg-bg-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30' onClick={() => setNewInstitutionName(name)}>
            {name}
          </button>
        ))}
      </div>
      {newInstitutionName && <p>Nova instituição: {newInstitutionName}</p>}
      <label className='flex flex-col gap-1 text-sm'>
        Moeda
        <select name='currency' defaultValue={initial?.currency ?? 'BRL'} className={textInput}>
          {CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
      </label>
      <div className='flex gap-3'>
        <button className={primaryButton} disabled={pending}>
          {submitLabel}
        </button>
        <Link href={cancelHref} className={secondaryButton}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}

export { CLASS_LABELS };
