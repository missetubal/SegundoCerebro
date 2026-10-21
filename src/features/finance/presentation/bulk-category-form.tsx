'use client';

import { useActionState } from 'react';
import { type ActionState, IDLE_STATE } from '@/shared/lib';
import { secondaryButton, textInput } from '@/shared/ui';

type Row = {
  id: string;
  date: string;
  description: string;
  category: string;
  origin: string;
  type: string;
  amount: string;
  tone: 'in' | 'out' | 'neutral';
};

type Category = { id: string; name: string };

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  categories: Category[];
  rows: Row[];
};

export function BulkCategoryForm({ action, categories, rows }: Props) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  return (
    <form action={formAction} className='flex flex-col gap-4'>
      {state.status === 'error' && <p className='text-sm text-rose-700 dark:text-rose-300'>{state.message}</p>}
      {categories.length > 0 && rows.length > 0 && (
        <div className='flex flex-wrap items-end gap-2'>
          <label className='flex min-w-48 flex-col gap-1 text-xs text-muted'>
            Categoria dos selecionados
            <select name='categoryId' className={textInput}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <button className={secondaryButton} disabled={pending}>
            Aplicar categoria
          </button>
        </div>
      )}
      {rows.length === 0 ? (
        <div className='rounded-xl border border-dashed border-border px-4 py-8 text-center'>
          <p className='text-sm font-medium text-ink'>Nenhum lançamento neste filtro</p>
          <p className='pt-1 text-sm text-muted'>Ajuste a busca ou limpe os filtros.</p>
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full min-w-[720px] text-left text-sm'>
            <thead>
              <tr className='border-b border-border text-[11px] uppercase tracking-wide text-muted'>
                <th className='w-8 py-2' />
                <th className='py-2 font-medium'>Data</th>
                <th className='py-2 font-medium'>Descrição</th>
                <th className='py-2 font-medium'>Categoria</th>
                <th className='py-2 font-medium'>Origem</th>
                <th className='py-2 font-medium'>Tipo</th>
                <th className='py-2 text-right font-medium'>Valor</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className='border-b border-border/70 transition-colors last:border-b-0 hover:bg-bg-app/60'>
                  <td className='py-3'>
                    <input type='checkbox' name='id' value={row.id} aria-label={row.description} className='size-4' />
                  </td>
                  <td className='py-3 text-muted'>{row.date}</td>
                  <td className='py-3 font-medium text-ink'>{row.description}</td>
                  <td className='py-3'>
                    <span className='rounded-full bg-bg-app px-2 py-0.5 text-xs text-ink'>{row.category}</span>
                  </td>
                  <td className='py-3 text-muted'>{row.origin}</td>
                  <td className='py-3 text-muted'>{row.type}</td>
                  <td
                    className={`py-3 text-right font-medium tabular-nums ${
                      row.tone === 'in'
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : row.tone === 'neutral'
                          ? 'text-muted'
                          : 'text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {row.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </form>
  );
}
