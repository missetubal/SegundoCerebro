'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { type ActionState, IDLE_STATE } from '@/shared/lib';
import { primaryButton, secondaryButton, textInput } from '@/shared/ui';
import { ACCOUNT_TYPES, type AccountType } from '../domain/validation';
import { CURRENCIES, type Currency } from '../domain/money';

export const INSTITUTION_SUGGESTIONS = [
  'Nubank',
  'Itaú',
  'Bradesco',
  'Inter',
  'C6',
  'XP',
  'Rico',
  'BTG',
] as const;

export type InstitutionOption = { id: string; name: string };

type Values = {
  id?: string;
  name: string;
  institutionId: string;
  accountType: AccountType;
  currency: Currency;
  openingBalance: string;
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
  name: '',
  institutionId: '',
  accountType: 'checking',
  currency: 'BRL',
  openingBalance: '',
};

const TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Conta corrente',
  savings: 'Poupança',
  wallet: 'Carteira',
  payment: 'Pagamento',
  other: 'Outro',
};

export function AccountForm({
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
        Nome da conta
        <input name='name' required defaultValue={initial.name} className={textInput} />
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
        Banco
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
      <label className='flex flex-col gap-1 text-sm'>
        Tipo
        <select name='accountType' defaultValue={initial.accountType} className={textInput}>
          {ACCOUNT_TYPES.map((type) => (
            <option key={type} value={type}>
              {TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>
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
      <label className='flex flex-col gap-1 text-sm'>
        Saldo inicial
        <input
          name='openingBalance'
          inputMode='decimal'
          defaultValue={initial.openingBalance}
          className={textInput}
        />
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
