'use client';

import { useActionState } from 'react';
import { type ActionState, IDLE_STATE } from '@/shared/lib';
import { primaryButton, textInput } from '@/shared/ui';

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

const labelClass = 'flex flex-col gap-1 text-sm text-ink';
const errorClass = 'text-sm text-rose-700 dark:text-rose-300';

export function OperationForm({ assetId, action }: { assetId: string; action: Action }) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  return (
    <form action={formAction} className='flex flex-col gap-3'>
      {state.status === 'error' && <p className={errorClass}>{state.message}</p>}
      <input type='hidden' name='assetId' value={assetId} />
      <input type='hidden' name='notes' value='' />
      <label className={labelClass}>
        Operação
        <select name='operationType' className={textInput}>
          <option value='buy'>Compra</option>
          <option value='sell'>Venda</option>
          <option value='income'>Provento</option>
          <option value='adjustment'>Ajuste</option>
        </select>
      </label>
      <label className={labelClass}>
        Data
        <input name='operationDate' type='date' required className={textInput} />
      </label>
      <label className={labelClass}>
        Quantidade
        <input name='quantity' required inputMode='decimal' className={textInput} />
      </label>
      <label className={labelClass}>
        Preço unitário
        <input name='unitPrice' required inputMode='decimal' className={textInput} />
      </label>
      <label className={labelClass}>
        Taxas (opcional)
        <input name='fees' inputMode='decimal' className={textInput} />
      </label>
      <div>
        <button className={primaryButton} disabled={pending}>
          Registrar operação
        </button>
      </div>
    </form>
  );
}

export function ValuationForm({ assetId, action }: { assetId: string; action: Action }) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  return (
    <form action={formAction} className='flex flex-col gap-3'>
      {state.status === 'error' && <p className={errorClass}>{state.message}</p>}
      <input type='hidden' name='assetId' value={assetId} />
      <label className={labelClass}>
        Data da avaliação
        <input name='valuationDate' type='date' required className={textInput} />
      </label>
      <label className={labelClass}>
        Valor unitário
        <input name='unitValue' inputMode='decimal' className={textInput} />
      </label>
      <label className={labelClass}>
        Valor total
        <input name='totalValue' inputMode='decimal' className={textInput} />
      </label>
      <p className='text-[11px] leading-relaxed text-muted'>Informe o valor unitário ou o valor total.</p>
      <div>
        <button className={primaryButton} disabled={pending}>
          Informar valor
        </button>
      </div>
    </form>
  );
}
