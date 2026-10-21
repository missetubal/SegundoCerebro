'use client';

import { useActionState, useState, type FormEvent } from 'react';
import { type ActionState, IDLE_STATE } from '@/shared/lib';
import { reconcileIncluded } from '../domain/aggregation';
import { isCurrency } from '../domain/money';
import type { Direction, TransactionType } from '../domain/validation';
import type { ImportStepId } from './import-steps';

export type ReviewLine = {
  transactionDate: string;
  postedDate: string | null;
  description: string;
  amountMinor: string;
  type: TransactionType;
  direction: Direction;
  externalId: string | null;
  incompatibleCurrency: boolean;
  duplicate: boolean;
  included: boolean;
  categoryId: string | null;
};

export type ColumnRole = 'date' | 'description' | 'amount' | 'debit' | 'credit' | 'ignore';

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

type Input = {
  headers: string[];
  currency: string;
  declaredTotalMinor: string | null;
  startAction: Action;
  confirmAction: Action;
};

function readPreview(state: ActionState): { batchId: string; lines: ReviewLine[] } | null {
  if (state.status !== 'success') return null;
  const extra = state as ActionState & { batchId?: string; lines?: ReviewLine[] };
  if (!extra.batchId || !extra.lines) return null;
  return { batchId: extra.batchId, lines: extra.lines };
}

export function guessRole(header: string): ColumnRole {
  const name = header
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
  if (/(data|date)/.test(name)) return 'date';
  if (/(histor|desc|memo|detalhe|lancamento)/.test(name)) return 'description';
  if (/(debito|debit)/.test(name)) return 'debit';
  if (/(credito|credit)/.test(name)) return 'credit';
  if (/(valor|amount|value)/.test(name)) return 'amount';
  return 'ignore';
}

export function useImportReview({ headers, currency, declaredTotalMinor, startAction, confirmAction }: Input) {
  const [preview, start, starting] = useActionState(startAction, IDLE_STATE);
  const [confirmState, confirm, confirming] = useActionState(confirmAction, IDLE_STATE);
  const [lines, setLines] = useState<ReviewLine[] | null>(null);
  const [phase, setPhase] = useState<'review' | 'check'>('review');
  const [targets, setTargets] = useState<Record<string, ColumnRole>>(() =>
    Object.fromEntries(headers.map((header) => [header, guessRole(header)])),
  );
  const [mapError, setMapError] = useState<string | null>(null);
  const [hiddenMapBatch, setHiddenMapBatch] = useState<string | null>(null);

  const loaded = readPreview(preview);
  const visible = lines ?? loaded?.lines ?? null;
  const money = isCurrency(currency) ? currency : null;
  const confirmed = confirmState.status === 'success';

  const included = (visible ?? []).filter((line) => line.included && !line.incompatibleCurrency);
  const reconciliation = visible
    ? reconcileIncluded(
        included.map((line) => ({ type: line.type, amountMinor: BigInt(line.amountMinor) })),
        declaredTotalMinor === null ? null : BigInt(declaredTotalMinor),
      )
    : null;

  const mappingOpen = headers.length > 0 && (!loaded || hiddenMapBatch === loaded.batchId);
  const step: ImportStepId = confirmed
    ? 'done'
    : mappingOpen
      ? 'mapping'
      : !visible
        ? 'review'
        : phase === 'check'
          ? 'check'
          : 'review';

  function update(index: number, patch: Partial<ReviewLine>) {
    setLines((current) => {
      const source = current ?? loaded?.lines ?? [];
      return source.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line,
      );
    });
  }

  function columnFor(role: ColumnRole): string {
    return headers.find((header) => targets[header] === role) ?? '';
  }

  function validateMapping(event: FormEvent<HTMLFormElement>) {
    const used = new Map<ColumnRole, number>();
    for (const role of Object.values(targets)) {
      if (role === 'ignore') continue;
      used.set(role, (used.get(role) ?? 0) + 1);
    }
    const unique = [...used.values()].every((count) => count === 1);
    const hasValue = used.has('amount') || used.has('debit') || used.has('credit');
    const mixed = used.has('amount') && (used.has('debit') || used.has('credit'));
    if (!unique || !used.has('date') || !used.has('description') || !hasValue || mixed) {
      event.preventDefault();
      setMapError(
        'Indique uma coluna de data, uma de descrição e o valor — ou débito e crédito, sem repetir campo.',
      );
      return;
    }
    setMapError(null);
  }

  function setTarget(header: string, role: ColumnRole) {
    setTargets((current) => ({ ...current, [header]: role }));
  }

  function backToMapping() {
    if (!loaded) return;
    setPhase('review');
    setHiddenMapBatch(loaded.batchId);
  }

  return {
    preview,
    confirmState,
    start,
    confirm,
    starting,
    confirming,
    confirmed,
    loaded,
    visible,
    included,
    reconciliation,
    mappingOpen,
    step,
    phase,
    targets,
    mapError,
    money,
    update,
    columnFor,
    validateMapping,
    setTarget,
    backToMapping,
    goToCheck: () => setPhase('check'),
    backToReview: () => setPhase('review'),
  };
}
