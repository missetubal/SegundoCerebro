'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { type ActionState, IDLE_STATE } from '@/shared/lib';
import { primaryButton, secondaryButton, textInput } from '@/shared/ui';
import { TRANSACTION_TYPES, type TransactionType } from '../domain/validation';

const TYPE_LABELS: Record<TransactionType, string> = {
  expense: 'Despesa',
  income: 'Receita',
  refund: 'Estorno',
  invoice_payment: 'Pagamento de fatura',
  transfer: 'Transferência',
};

type Option = { id: string; name: string };

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  accounts: Option[];
  cards: Option[];
  categories: Option[];
  submitLabel: string;
  cancelHref: string;
  initial?: {
    id?: string;
    description: string;
    transactionDate: string;
    amount: string;
    type: TransactionType;
    direction: 'outflow' | 'inflow';
    accountId: string;
    creditCardId: string;
    categoryId: string;
  };
};

export function TransactionForm({
  action,
  accounts,
  cards,
  categories,
  submitLabel,
  cancelHref,
  initial,
}: Props) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  return (
    <form action={formAction} className='flex flex-col gap-4'>
      {initial?.id && <input type='hidden' name='id' value={initial.id} />}
      <input type='hidden' name='postedDate' value='' />
      <input type='hidden' name='installmentNumber' value='' />
      <input type='hidden' name='installmentTotal' value='' />
      <input type='hidden' name='notes' value='' />
      <input type='hidden' name='statementId' value='' />
      {state.status === 'error' && (
        <p className='text-sm text-rose-700 dark:text-rose-300'>{state.message}</p>
      )}
      <label className='flex flex-col gap-1 text-sm'>
        Descrição
        <input name='description' required defaultValue={initial?.description} className={textInput} />
      </label>
      <label className='flex flex-col gap-1 text-sm'>
        Data da compra
        <input name='transactionDate' type='date' required defaultValue={initial?.transactionDate} className={textInput} />
      </label>
      <label className='flex flex-col gap-1 text-sm'>
        Valor
        <input name='amount' required inputMode='decimal' defaultValue={initial?.amount} className={textInput} />
      </label>
      <label className='flex flex-col gap-1 text-sm'>
        Tipo
        <select name='type' defaultValue={initial?.type ?? 'expense'} className={textInput}>
          {TRANSACTION_TYPES.map((type) => (
            <option key={type} value={type}>
              {TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>
      <label className='flex flex-col gap-1 text-sm'>
        Direção
        <select name='direction' defaultValue={initial?.direction ?? 'outflow'} className={textInput}>
          <option value='outflow'>Saída</option>
          <option value='inflow'>Entrada</option>
        </select>
      </label>
      <label className='flex flex-col gap-1 text-sm'>
        Conta
        <select name='accountId' defaultValue={initial?.accountId ?? ''} className={textInput}>
          <option value=''>Nenhuma</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </label>
      <label className='flex flex-col gap-1 text-sm'>
        Cartão
        <select name='creditCardId' defaultValue={initial?.creditCardId ?? ''} className={textInput}>
          <option value=''>Nenhum</option>
          {cards.map((card) => (
            <option key={card.id} value={card.id}>
              {card.name}
            </option>
          ))}
        </select>
      </label>
      <label className='flex flex-col gap-1 text-sm'>
        Categoria
        <select name='categoryId' defaultValue={initial?.categoryId ?? ''} className={textInput}>
          <option value=''>Sem categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
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
