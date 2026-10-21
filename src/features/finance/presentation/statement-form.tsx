'use client';

import { FileUp } from 'lucide-react';
import { useRef, useState } from 'react';
import { useActionState } from 'react';
import { type ActionState, IDLE_STATE } from '@/shared/lib';
import { caption, card, primaryButton, textInput } from '@/shared/ui';
import { monthBounds } from './format';
import { ImportStepper } from './import-steps';

type Option = { id: string; name: string };

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  accounts: Option[];
  cards: Option[];
  defaultMonth: string;
};

const FILE_PATTERN = /\.(pdf|csv|ofx|qfx|png|jpe?g|webp)$/i;
const MAX_BYTES = 10 * 1024 * 1024;

export function StatementForm({ action, accounts, cards, defaultMonth }: Props) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const [instrument, setInstrument] = useState('');
  const [month, setMonth] = useState(defaultMonth);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bounds = /^\d{4}-\d{2}$/.test(month) ? monthBounds(month) : { from: '', to: '' };
  const accountId = instrument.startsWith('account:') ? instrument.slice('account:'.length) : '';
  const creditCardId = instrument.startsWith('card:') ? instrument.slice('card:'.length) : '';

  function takeFile(file: File | undefined) {
    const input = inputRef.current;
    if (!file || !input) return;
    if (!FILE_PATTERN.test(file.name) || file.size === 0 || file.size > MAX_BYTES) {
      setFileError('Use PDF, CSV, OFX ou imagem de até 10 MB.');
      setFileName(null);
      input.value = '';
      return;
    }
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    setFileName(file.name);
    setFileError(null);
  }

  return (
    <div className='flex flex-col gap-6'>
      <ImportStepper current='upload' />
      <form action={formAction} className={`${card} flex flex-col gap-6 p-5 sm:p-6`}>
        {state.status === 'error' && <p className='text-sm text-rose-700 dark:text-rose-300'>{state.message}</p>}
        <input type='hidden' name='accountId' value={accountId} />
        <input type='hidden' name='creditCardId' value={creditCardId} />
        <input type='hidden' name='referenceMonth' value={month} />
        <input type='hidden' name='periodStart' value={bounds.from} />
        <input type='hidden' name='periodEnd' value={bounds.to} />

        <div className='grid gap-4 sm:grid-cols-2'>
          <label className='flex flex-col gap-1 text-sm text-ink'>
            Conta ou cartão
            <select
              required
              value={instrument}
              onChange={(event) => setInstrument(event.target.value)}
              className={textInput}
            >
              <option value=''>Escolha</option>
              {accounts.length > 0 && (
                <optgroup label='Contas'>
                  {accounts.map((account) => (
                    <option key={account.id} value={`account:${account.id}`}>
                      {account.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {cards.length > 0 && (
                <optgroup label='Cartões'>
                  {cards.map((cardOption) => (
                    <option key={cardOption.id} value={`card:${cardOption.id}`}>
                      {cardOption.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
          <label className='flex flex-col gap-1 text-sm text-ink'>
            Mês de referência
            <input
              type='month'
              required
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className={textInput}
            />
          </label>
        </div>

        <div
          className={`flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center ${
            dragging ? 'border-ink bg-bg-app' : 'border-border'
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            takeFile(event.dataTransfer.files?.[0]);
          }}
        >
          <FileUp className='size-6 text-muted' aria-hidden />
          <div className='flex flex-col gap-1'>
            <p className='text-sm font-medium text-ink'>Selecione um arquivo de fatura</p>
            <p className={caption}>PDF, CSV ou OFX. Imagem fica só como anexo.</p>
          </div>
          <button
            type='button'
            className={primaryButton}
            onClick={() => inputRef.current?.click()}
          >
            <FileUp className='size-4' aria-hidden />
            Escolher arquivo
          </button>
          <input
            ref={inputRef}
            name='file'
            type='file'
            required
            accept='.pdf,.csv,.ofx,.qfx,.png,.jpg,.jpeg,.webp'
            className='sr-only'
            onChange={(event) => takeFile(event.target.files?.[0])}
          />
          {fileName && (
            <p className='text-sm text-muted'>
              Arquivo: <span className='font-medium text-ink'>{fileName}</span>
            </p>
          )}
          {fileError && <p className='text-sm text-rose-700 dark:text-rose-300'>{fileError}</p>}
        </div>

        <label className='flex max-w-xs flex-col gap-1 text-sm text-ink'>
          Total informado na fatura (opcional)
          <input name='declaredTotal' inputMode='decimal' placeholder='0,00' className={textInput} />
          <span className={caption}>Usado depois para conferir com a soma dos lançamentos.</span>
        </label>

        <label className='flex max-w-xs flex-col gap-1 text-sm text-ink'>
          Vencimento (opcional)
          <input name='dueDate' type='date' className={textInput} />
        </label>

        <div className='flex justify-end'>
          <button className={primaryButton} disabled={pending || Boolean(fileError)}>
            Continuar
          </button>
        </div>
      </form>
    </div>
  );
}
