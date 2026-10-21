'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { type ActionState, IDLE_STATE } from '@/shared/lib';
import { primaryButton, secondaryButton, textInput } from '@/shared/ui';
import { CURRENCIES, type Currency } from '../domain/money';
import {
  INSTITUTION_SUGGESTIONS,
  type InstitutionOption,
} from './account-form';

type Values = {
  id?: string;
  nickname: string;
  institutionId: string;
  brand: string;
  last4: string;
  creditLimit: string;
  closingDay: string;
  dueDay: string;
  currency: Currency;
};

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  institutions: InstitutionOption[];
  initial?: Values;
  submitLabel: string;
  cancelHref?: string;
  onCancel?: () => void;
};

const EMPTY: Values = {
  nickname: '',
  institutionId: '',
  brand: '',
  last4: '',
  creditLimit: '',
  closingDay: '1',
  dueDay: '10',
  currency: 'BRL',
};

export function CardForm({
  action,
  institutions,
  initial = EMPTY,
  submitLabel,
  cancelHref,
  onCancel,
}: Props) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const [newInstitutionName, setNewInstitutionName] = useState('');

  return (
    <form action={formAction} className='flex flex-col gap-4'>
      {initial.id && <input type='hidden' name='id' value={initial.id} />}
      <label className='flex flex-col gap-1 text-sm'>
        Apelido do cartão
        <input name='nickname' required defaultValue={initial.nickname} className={textInput} />
      </label>
      {institutions.length > 0 && (
        <label className='flex flex-col gap-1 text-sm'>
          Instituição já cadastrada
          <select name='institutionId' defaultValue={initial.institutionId} className={textInput}>
            <option value=''>Nenhuma</option>
            {institutions.map((institution) => (
              <option key={institution.id} value={institution.id}>
                {institution.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {institutions.length === 0 && <input type='hidden' name='institutionId' value='' />}
      <label className='flex flex-col gap-1 text-sm'>
        Instituição
        <input
          name='newInstitutionName'
          value={newInstitutionName}
          onChange={(event) => setNewInstitutionName(event.target.value)}
          className={textInput}
        />
      </label>
      <div className='flex flex-wrap gap-2'>
        {INSTITUTION_SUGGESTIONS.map((name) => (
          <button
            key={name}
            type='button'
            className={secondaryButton}
            onClick={() => setNewInstitutionName(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <p className='text-sm text-muted'>A sugestão só é gravada quando você salva.</p>
      <div className='grid gap-3 sm:grid-cols-2'>
        <label className='flex flex-col gap-1 text-sm'>
          Bandeira
          <input name='brand' defaultValue={initial.brand} className={textInput} />
        </label>
        <label className='flex flex-col gap-1 text-sm'>
          Últimos 4 dígitos
          <input
            name='last4'
            inputMode='numeric'
            maxLength={4}
            defaultValue={initial.last4}
            className={textInput}
          />
        </label>
      </div>
      <label className='flex flex-col gap-1 text-sm'>
        Limite
        <input name='creditLimit' inputMode='decimal' defaultValue={initial.creditLimit} className={textInput} />
      </label>
      <div className='grid gap-3 sm:grid-cols-2'>
        <label className='flex flex-col gap-1 text-sm'>
          Dia de fechamento
          <input name='closingDay' type='number' min={1} max={31} required defaultValue={initial.closingDay} className={textInput} />
        </label>
        <label className='flex flex-col gap-1 text-sm'>
          Dia de vencimento
          <input name='dueDay' type='number' min={1} max={31} required defaultValue={initial.dueDay} className={textInput} />
        </label>
      </div>
      <label className='flex flex-col gap-1 text-sm'>
        Moeda
        <select name='currency' defaultValue={initial.currency} className={textInput}>
          {CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
      </label>
      {state.status === 'error' && <p className='text-sm text-rose-700 dark:text-rose-300'>{state.message}</p>}
      <div className='flex justify-end gap-2'>
        {onCancel ? (
          <button type='button' className={secondaryButton} onClick={onCancel}>
            Cancelar
          </button>
        ) : (
          cancelHref && (
            <Link href={cancelHref} className={secondaryButton}>
              Cancelar
            </Link>
          )
        )}
        <button className={primaryButton} disabled={pending}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
