'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { List } from 'lucide-react';
import { type ActionState } from '@/shared/lib';
import { caption, card, primaryButton } from '@/shared/ui';
import { reconcileIncluded } from '../domain/aggregation';
import { MAX_INCLUDED_ROWS } from '../domain/parse';
import { formatMinor, parseAmountToMinor, type Currency } from '../domain/money';
import {
  defaultDirection,
  TRANSACTION_TYPES,
  type TransactionType,
} from '../domain/validation';
import { formatDay } from './format';
import { TYPE_LABELS } from './labels';
import { ImportStepper } from './import-steps';
import {
  useImportReview,
  type ColumnRole,
  type ReviewLine,
} from './use-import-review';

export type { ReviewLine } from './use-import-review';

type Option = { id: string; name: string };

type Props = {
  statementId: string;
  headers: string[];
  currency: string;
  instrument: 'account' | 'card';
  declaredTotalMinor: string | null;
  categories: Option[];
  startAction: (state: ActionState, formData: FormData) => Promise<ActionState>;
  confirmAction: (state: ActionState, formData: FormData) => Promise<ActionState>;
};

const ROLE_LABELS: Record<ColumnRole, string> = {
  date: 'Data',
  description: 'Descrição',
  amount: 'Valor',
  debit: 'Débito',
  credit: 'Crédito',
  ignore: 'Ignorar',
};

const ROLES = Object.keys(ROLE_LABELS) as ColumnRole[];

function minorToDecimal(amountMinor: string): string {
  const minor = BigInt(amountMinor);
  const abs = minor < 0n ? -minor : minor;
  const whole = abs / 100n;
  const cents = (abs % 100n).toString().padStart(2, '0');
  return `${whole},${cents}`;
}

export function ImportReview(props: Props) {
  const review = useImportReview(props);
  const { confirmed, visible, loaded, mappingOpen, phase } = review;

  return (
    <div className='flex flex-col gap-6'>
      <ImportStepper current={review.step} />
      {review.preview.status === 'error' && (
        <p className='text-sm text-rose-700 dark:text-rose-300'>{review.preview.message}</p>
      )}
      {review.confirmState.status === 'error' && (
        <p className='text-sm text-rose-700 dark:text-rose-300'>{review.confirmState.message}</p>
      )}

      {confirmed && <DoneCard count={review.included.length} />}

      {!confirmed && mappingOpen && (
        <ColumnMappingForm
          statementId={props.statementId}
          headers={props.headers}
          targets={review.targets}
          mapError={review.mapError}
          starting={review.starting}
          start={review.start}
          columnFor={review.columnFor}
          validateMapping={review.validateMapping}
          onTargetChange={review.setTarget}
        />
      )}

      {!confirmed && !visible && props.headers.length === 0 && (
        <OfxStartForm statementId={props.statementId} start={review.start} starting={review.starting} />
      )}

      {!confirmed && !mappingOpen && visible && loaded && phase === 'review' && (
        <ReviewTable
          statementId={props.statementId}
          hasHeaders={props.headers.length > 0}
          lines={visible}
          money={review.money}
          instrument={props.instrument}
          categories={props.categories}
          onChange={review.update}
          onBackToMapping={review.backToMapping}
          onCheck={review.goToCheck}
        />
      )}

      {!confirmed && !mappingOpen && visible && loaded && phase === 'check' && review.reconciliation && (
        <CheckPanel
          batchId={loaded.batchId}
          lines={visible}
          includedCount={review.included.length}
          reconciliation={review.reconciliation}
          money={review.money}
          declaredTotalMinor={props.declaredTotalMinor}
          confirming={review.confirming}
          confirm={review.confirm}
          onBack={review.backToReview}
        />
      )}
    </div>
  );
}

function ColumnMappingForm({
  statementId,
  headers,
  targets,
  mapError,
  starting,
  start,
  columnFor,
  validateMapping,
  onTargetChange,
}: {
  statementId: string;
  headers: string[];
  targets: Record<string, ColumnRole>;
  mapError: string | null;
  starting: boolean;
  start: (payload: FormData) => void;
  columnFor: (role: ColumnRole) => string;
  validateMapping: (event: FormEvent<HTMLFormElement>) => void;
  onTargetChange: (header: string, role: ColumnRole) => void;
}) {
  return (
    <form action={start} onSubmit={validateMapping} className={`${card} flex flex-col gap-4 p-5 sm:p-6`}>
      <input type='hidden' name='statementId' value={statementId} />
      <input type='hidden' name='dateColumn' value={columnFor('date')} />
      <input type='hidden' name='descriptionColumn' value={columnFor('description')} />
      <input type='hidden' name='amountColumn' value={columnFor('amount')} />
      <input type='hidden' name='debitColumn' value={columnFor('debit')} />
      <input type='hidden' name='creditColumn' value={columnFor('credit')} />
      <header className='flex flex-col gap-1'>
        <h2 className='text-base font-semibold text-ink'>Mapeamento de colunas</h2>
        <p className='text-sm text-muted'>Confirme qual coluna do arquivo corresponde a cada campo.</p>
      </header>
      {mapError && <p className='text-sm text-rose-700 dark:text-rose-300'>{mapError}</p>}
      <ul className='flex flex-col gap-3'>
        {headers.map((header) => (
          <li
            key={header}
            className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3'
          >
            <span className='text-sm text-ink'>{header}</span>
            <select
              aria-label={`Campo para ${header}`}
              value={targets[header]}
              onChange={(event) => onTargetChange(header, event.target.value as ColumnRole)}
              className='w-40 rounded-full border border-border bg-bg-card px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20'
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
      <div className='flex items-center justify-between gap-3'>
        <Link href={`/app/finance/statements/${statementId}`} className='text-sm font-medium text-ink'>
          Voltar
        </Link>
        <button className={primaryButton} disabled={starting}>
          Revisar lançamentos
        </button>
      </div>
    </form>
  );
}

function OfxStartForm({
  statementId,
  start,
  starting,
}: {
  statementId: string;
  start: (payload: FormData) => void;
  starting: boolean;
}) {
  return (
    <form action={start} className={`${card} flex flex-col items-center gap-4 px-6 py-16 text-center`}>
      <input type='hidden' name='statementId' value={statementId} />
      <h2 className='text-base font-semibold text-ink'>Arquivo OFX</h2>
      <p className='max-w-md text-sm text-muted'>
        Este arquivo já traz data, descrição e valor. A revisão abre direto.
      </p>
      <button className={primaryButton} disabled={starting}>
        Revisar lançamentos
      </button>
    </form>
  );
}

function ReviewTable({
  statementId,
  hasHeaders,
  lines,
  money,
  instrument,
  categories,
  onChange,
  onBackToMapping,
  onCheck,
}: {
  statementId: string;
  hasHeaders: boolean;
  lines: ReviewLine[];
  money: Currency | null;
  instrument: 'account' | 'card';
  categories: Option[];
  onChange: (index: number, patch: Partial<ReviewLine>) => void;
  onBackToMapping: () => void;
  onCheck: () => void;
}) {
  return (
    <section className={`${card} flex flex-col gap-4 p-5 sm:p-6`}>
      <header className='flex flex-col gap-1'>
        <h2 className='text-base font-semibold text-ink'>Revisão dos lançamentos</h2>
        <p className='text-sm text-muted'>
          Ajuste a categoria, ignore linhas que não pertencem à fatura e verifique avisos de possível duplicado.
        </p>
      </header>
      <div className='overflow-x-auto'>
        <table className='w-full min-w-[720px] border-separate border-spacing-0 text-sm'>
          <thead>
            <tr className='text-left text-xs uppercase tracking-wide text-muted'>
              <th className='rounded-l-lg bg-bg-app px-3 py-2 font-medium'>Data</th>
              <th className='bg-bg-app px-3 py-2 font-medium'>Descrição</th>
              <th className='bg-bg-app px-3 py-2 font-medium'>Tipo</th>
              <th className='bg-bg-app px-3 py-2 font-medium'>Categoria</th>
              <th className='bg-bg-app px-3 py-2 text-right font-medium'>Valor</th>
              <th className='rounded-r-lg bg-bg-app px-3 py-2 text-right font-medium'>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <ReviewRow
                key={`${line.externalId ?? line.description}-${index}`}
                line={line}
                money={money}
                instrument={instrument}
                categories={categories}
                onChange={(patch) => onChange(index, patch)}
              />
            ))}
          </tbody>
        </table>
        {lines.length === 0 && (
          <p className='px-3 py-6 text-sm text-muted'>Nenhum lançamento nesse arquivo.</p>
        )}
      </div>
      <div className='flex items-center justify-between gap-3'>
        {hasHeaders ? (
          <button type='button' className='text-sm font-medium text-ink' onClick={onBackToMapping}>
            Voltar
          </button>
        ) : (
          <Link href={`/app/finance/statements/${statementId}`} className='text-sm font-medium text-ink'>
            Voltar
          </Link>
        )}
        <button type='button' className={primaryButton} onClick={onCheck}>
          Conferir total
        </button>
      </div>
    </section>
  );
}

function CheckPanel({
  batchId,
  lines,
  includedCount,
  reconciliation,
  money,
  declaredTotalMinor,
  confirming,
  confirm,
  onBack,
}: {
  batchId: string;
  lines: ReviewLine[];
  includedCount: number;
  reconciliation: ReturnType<typeof reconcileIncluded>;
  money: Currency | null;
  declaredTotalMinor: string | null;
  confirming: boolean;
  confirm: (payload: FormData) => void;
  onBack: () => void;
}) {
  const tooMany = includedCount > MAX_INCLUDED_ROWS;
  return (
    <form action={confirm} className={`${card} flex flex-col items-center gap-4 px-6 py-12 text-center`}>
      <input type='hidden' name='batchId' value={batchId} />
      <input type='hidden' name='lines' value={JSON.stringify(lines)} />
      <span className='inline-flex size-12 items-center justify-center rounded-full bg-bg-app text-muted'>
        <List className='size-5' aria-hidden />
      </span>
      <div className='flex flex-col gap-1'>
        <h2 className='text-xl font-semibold text-ink'>Conferência final</h2>
        <p className='text-sm text-muted'>{importCount(includedCount)}</p>
      </div>
      <div className='grid w-full max-w-lg gap-3 sm:grid-cols-2'>
        <TotalCard
          label='Total importado'
          value={money ? formatMinor(reconciliation.checkedMinor, money) : '—'}
        />
        <TotalCard
          label='Total informado'
          value={
            declaredTotalMinor === null || !money
              ? '—'
              : formatMinor(BigInt(declaredTotalMinor), money)
          }
        />
      </div>
      <p className='max-w-md text-sm text-muted'>
        {reconciliation.differenceMinor === null || !money
          ? 'Nenhum total informado — a conferência fica só com o total importado.'
          : `Diferença de ${formatMinor(reconciliation.differenceMinor, money)}.`}
      </p>
      <SideTotals reconciliation={reconciliation} money={money} />
      {tooMany && (
        <p className='text-sm text-rose-700 dark:text-rose-300'>
          Mais de 2000 linhas. Separe o arquivo antes de confirmar.
        </p>
      )}
      <div className='flex items-center gap-4'>
        <button type='button' className='text-sm font-medium text-ink' onClick={onBack}>
          Voltar
        </button>
        <button className={primaryButton} disabled={confirming || tooMany}>
          Confirmar importação
        </button>
      </div>
    </form>
  );
}

function ReviewRow({
  line,
  money,
  instrument,
  categories,
  onChange,
}: {
  line: ReviewLine;
  money: Currency | null;
  instrument: 'account' | 'card';
  categories: Option[];
  onChange: (patch: Partial<ReviewLine>) => void;
}) {
  const [editingAmount, setEditingAmount] = useState(false);
  const [draft, setDraft] = useState('');
  const blocked = line.incompatibleCurrency;
  const faded = !line.included || blocked;
  const signed = line.direction === 'outflow';
  const label =
    money === null ? line.amountMinor : `${signed ? '-' : ''}${formatMinor(BigInt(line.amountMinor), money)}`;

  return (
    <tr className={faded ? 'opacity-40' : undefined}>
      <td className='border-b border-border px-3 py-3 align-middle'>
        <label className='relative inline-flex cursor-pointer'>
          <span className='text-sm text-ink'>
            {/^\d{4}-\d{2}-\d{2}$/.test(line.transactionDate)
              ? formatDay(line.transactionDate)
              : line.transactionDate}
          </span>
          <input
            type='date'
            aria-label='Data'
            value={line.transactionDate}
            onChange={(event) => onChange({ transactionDate: event.target.value })}
            className='absolute inset-0 cursor-pointer opacity-0'
          />
        </label>
      </td>
      <td className='border-b border-border px-3 py-3 align-middle'>
        <input
          aria-label='Descrição'
          value={line.description}
          onChange={(event) => onChange({ description: event.target.value })}
          className='w-full bg-transparent text-sm font-medium uppercase tracking-wide text-ink outline-none'
        />
        {line.duplicate && <p className='text-xs text-rose-700 dark:text-rose-300'>Possível duplicata</p>}
        {blocked && (
          <p className='text-xs text-muted'>Moeda incompatível. Esta linha não será salva.</p>
        )}
      </td>
      <td className='border-b border-border px-3 py-3 align-middle'>
        <select
          aria-label='Tipo'
          value={line.type}
          disabled={blocked}
          onChange={(event) => {
            const type = event.target.value as TransactionType;
            onChange({ type, direction: defaultDirection(type, instrument) });
          }}
          className='rounded-full border border-border bg-bg-card px-3 py-1 text-sm text-ink'
        >
          {TRANSACTION_TYPES.map((type) => (
            <option key={type} value={type}>
              {TYPE_LABELS[type] ?? type}
            </option>
          ))}
        </select>
      </td>
      <td className='border-b border-border px-3 py-3 align-middle'>
        <select
          aria-label='Categoria'
          value={line.categoryId ?? ''}
          disabled={blocked}
          onChange={(event) => onChange({ categoryId: event.target.value || null })}
          className='rounded-full border border-border bg-bg-card px-3 py-1 text-sm text-ink'
        >
          <option value=''>Sem categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </td>
      <td className='border-b border-border px-3 py-3 text-right align-middle'>
        {editingAmount ? (
          <input
            autoFocus
            aria-label='Valor'
            inputMode='decimal'
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => {
              const parsed = parseAmountToMinor(draft);
              if (parsed !== null && parsed !== 0n) {
                const abs = parsed < 0n ? -parsed : parsed;
                onChange({ amountMinor: abs.toString() });
              }
              setEditingAmount(false);
            }}
            className='w-28 rounded-lg border border-border bg-bg-card px-2 py-1 text-right text-sm text-ink'
          />
        ) : (
          <button
            type='button'
            onClick={() => {
              setDraft(minorToDecimal(line.amountMinor));
              setEditingAmount(true);
            }}
            className={`tabular-nums text-sm font-medium ${
              signed ? 'text-rose-700 dark:text-rose-300' : 'text-ink'
            }`}
          >
            {label}
          </button>
        )}
      </td>
      <td className='border-b border-border px-3 py-3 text-right align-middle'>
        <button
          type='button'
          disabled={blocked}
          onClick={() => onChange({ included: !line.included })}
          className='text-sm text-muted hover:text-ink disabled:hover:text-muted'
        >
          {line.included ? 'Ignorar' : 'Incluir'}
        </button>
      </td>
    </tr>
  );
}

function TotalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-2xl border border-border px-4 py-5'>
      <p className={`${caption} uppercase tracking-widest`}>{label}</p>
      <p className='mt-1 text-2xl font-semibold text-ink'>{value}</p>
    </div>
  );
}

function SideTotals({
  reconciliation,
  money,
}: {
  reconciliation: ReturnType<typeof reconcileIncluded>;
  money: Currency | null;
}) {
  if (!money) return null;
  const parts = [
    reconciliation.incomeMinor > 0n ? `Receitas ${formatMinor(reconciliation.incomeMinor, money)}` : null,
    reconciliation.paymentMinor > 0n
      ? `Pagamentos ${formatMinor(reconciliation.paymentMinor, money)}`
      : null,
    reconciliation.transferMinor > 0n
      ? `Transferências ${formatMinor(reconciliation.transferMinor, money)}`
      : null,
  ].filter((part) => part !== null);
  if (parts.length === 0) return null;
  return (
    <p className='max-w-md text-sm text-muted'>
      Fora do total importado: {parts.join(' · ')}.
    </p>
  );
}

function DoneCard({ count }: { count: number }) {
  return (
    <section className={`${card} flex flex-col items-center gap-3 px-6 py-16 text-center`}>
      <h2 className='text-xl font-semibold text-ink'>Importação concluída</h2>
      <p className='text-sm text-muted'>
        {count === 1 ? '1 lançamento foi importado.' : `${count} lançamentos foram importados.`}
      </p>
      <Link href='/app/finance/transactions' className={primaryButton}>
        Ver lançamentos
      </Link>
    </section>
  );
}

function importCount(count: number): string {
  if (count === 1) return '1 lançamento será importado.';
  return `${count} lançamentos serão importados.`;
}
