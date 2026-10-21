import 'server-only';

import { and, eq, sql } from 'drizzle-orm';
import {
  db,
  importBatches,
  ownedBy,
  statementAttachments,
  statements,
  transactions,
} from '@/shared/db';
import {
  dedupeHash,
  markDuplicates,
  csvHeaders,
  MAX_INCLUDED_ROWS,
  parseCsv,
  parseOfx,
  reconcileIncluded,
  type CsvMapping,
  type Direction,
  type TransactionType,
} from '../domain';
import type { FinanceResult } from './accounts';
import { defaultBlobStore, type BlobStore } from './blob-store';

export type ImportLine = {
  transactionDate: string;
  postedDate: string | null;
  description: string;
  amountMinor: bigint;
  type: TransactionType;
  direction: Direction;
  externalId: string | null;
  incompatibleCurrency: boolean;
  duplicate: boolean;
  included: boolean;
  categoryId: string | null;
};

type DraftLine = Omit<ImportLine, 'amountMinor' | 'included'> & {
  amountMinor: string;
};

export async function importSource(
  userId: string,
  statementId: string,
  store: BlobStore = defaultBlobStore(),
): Promise<{ kind: 'csv' | 'ofx' | 'other'; headers: string[] } | null> {
  const statement = await ownedStatement(userId, statementId);
  if (!statement) return null;
  const [attachment] = await db
    .select()
    .from(statementAttachments)
    .where(eq(statementAttachments.statementId, statementId));
  if (!attachment) return null;
  const kind = fileKind(attachment.fileName);
  if (kind !== 'csv') {
    return { kind: kind === 'ofx' ? 'ofx' : 'other', headers: [] };
  }
  const bytes = await store.read(attachment.storageKey);
  return { kind: 'csv', headers: csvHeaders(new TextDecoder().decode(bytes)) };
}

export async function listBatches(userId: string, statementId: string) {
  return db
    .select({
      id: importBatches.id,
      status: importBatches.status,
      rowCount: importBatches.rowCount,
      sourceFormat: importBatches.sourceFormat,
    })
    .from(importBatches)
    .where(and(eq(importBatches.userId, userId), eq(importBatches.statementId, statementId)));
}

export async function startPreview(
  userId: string,
  statementId: string,
  mapping: CsvMapping | null,
  store: BlobStore = defaultBlobStore(),
): Promise<
  | { ok: true; batchId: string; lines: ImportLine[] }
  | { ok: false; reason: 'not_found' | 'mapping_required' | 'unsupported' }
> {
  const statement = await ownedStatement(userId, statementId);
  if (!statement) return { ok: false, reason: 'not_found' };
  const [attachment] = await db
    .select()
    .from(statementAttachments)
    .where(eq(statementAttachments.statementId, statementId));
  if (!attachment) return { ok: false, reason: 'not_found' };
  const bytes = await store.read(attachment.storageKey);
  const text = new TextDecoder().decode(bytes);
  const instrument = statement.creditCardId ? 'card' : 'account';
  const kind = fileKind(attachment.fileName);
  if (kind === 'pdf' || kind === 'image') return { ok: false, reason: 'unsupported' };
  const parsed =
    kind === 'csv'
      ? parseCsv(text, mapping, instrument, statement.currency.trim())
      : parseOfx(text, instrument, statement.currency.trim());
  if (!parsed.ok) {
    return {
      ok: false,
      reason: parsed.reason === 'mapping_required' ? 'mapping_required' : 'unsupported',
    };
  }
  const existing = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId));
  const marked = markDuplicates(
    parsed.lines.map((line) => ({
      ...line,
      instrumentKind: instrument,
      instrumentId: statement.accountId ?? statement.creditCardId ?? '',
    })),
    existing.flatMap((row) => {
      const instrumentId = row.accountId ?? row.creditCardId;
      if (!instrumentId) return [];
      return [
        {
          id: row.id,
          instrumentKind: row.accountId ? ('account' as const) : ('card' as const),
          instrumentId,
          transactionDate: row.transactionDate,
          amountMinor: row.amountMinor,
          description: row.description,
          externalId: row.externalId,
        },
      ];
    }),
  );
  const lines: ImportLine[] = marked.map((line) => ({
    transactionDate: line.transactionDate,
    postedDate: line.postedDate,
    description: line.description,
    amountMinor: line.amountMinor,
    type: line.type,
    direction: line.direction,
    externalId: line.externalId,
    incompatibleCurrency: line.incompatibleCurrency,
    duplicate: line.duplicate,
    included: true,
    categoryId: null,
  }));
  const [batch] = await db
    .insert(importBatches)
    .values({
      userId,
      statementId,
      sourceFormat: kind === 'csv' ? 'csv' : 'ofx',
      status: 'preview',
      rowCount: lines.length,
      mappingConfig: mapping ? { version: 1, ...mapping } : null,
      draftRows: lines.map(toDraft),
    })
    .returning({ id: importBatches.id });
  if (!batch) return { ok: false, reason: 'not_found' };
  return { ok: true, batchId: batch.id, lines };
}

export function previewReconciliation(
  lines: ImportLine[],
  declaredTotalMinor: bigint | null,
) {
  return reconcileIncluded(
    lines.filter((line) => line.included && !line.incompatibleCurrency),
    declaredTotalMinor,
  );
}

export async function confirmImport(
  userId: string,
  batchId: string,
  lines: ImportLine[],
): Promise<FinanceResult<{ imported: number }>> {
  const batch = await ownedBatch(userId, batchId);
  if (!batch || batch.status !== 'preview') return { ok: false, reason: 'not_found' };
  const statement = await ownedStatement(userId, batch.statementId);
  if (!statement) return { ok: false, reason: 'not_found' };
  const included = lines.filter((line) => line.included && !line.incompatibleCurrency);
  if (included.length > MAX_INCLUDED_ROWS) return { ok: false, reason: 'not_found' };
  const instrumentKind = statement.accountId ? 'account' : 'card';
  const instrumentId = statement.accountId ?? statement.creditCardId ?? '';
  const inserts = included.map((line) =>
    db.insert(transactions).values({
      userId,
      accountId: statement.accountId,
      creditCardId: statement.creditCardId,
      statementId: statement.id,
      importBatchId: batch.id,
      transactionDate: line.transactionDate,
      postedDate: line.postedDate,
      description: line.description,
      amountMinor: line.amountMinor,
      currency: statement.currency.trim(),
      direction: line.direction,
      type: line.type,
      categoryId: line.categoryId,
      dedupeHash: dedupeHash({
        instrumentKind,
        instrumentId,
        transactionDate: line.transactionDate,
        amountMinor: line.amountMinor,
        description: line.description,
        externalId: line.externalId,
      }),
      externalId: line.externalId,
    }),
  );
  const updateBatch = db
    .update(importBatches)
    .set({
      status: 'confirmed',
      importedCount: included.length,
      ignoredCount: lines.length - included.length,
      draftRows: null,
      updatedAt: sql`now()`,
    })
    .where(ownedBy(importBatches, userId, batch.id));
  const updateStatement = db
    .update(statements)
    .set({
      status: included.length > 0 ? 'imported' : statement.status,
      updatedAt: sql`now()`,
    })
    .where(ownedBy(statements, userId, statement.id));
  try {
    await db.batch(
      inserts.length > 0
        ? [inserts[0], ...inserts.slice(1), updateBatch, updateStatement]
        : [updateBatch, updateStatement],
    );
  } catch (error) {
    console.error('finance import confirm failed');
    void error;
    return { ok: false, reason: 'not_found' };
  }
  return { ok: true, item: { imported: included.length } };
}

export async function undoImport(
  userId: string,
  batchId: string,
): Promise<FinanceResult<{ removed: number }>> {
  const batch = await ownedBatch(userId, batchId);
  if (!batch || batch.status !== 'confirmed') return { ok: false, reason: 'not_found' };
  const [removed] = await db.batch([
    db
      .delete(transactions)
      .where(
        and(eq(transactions.userId, userId), eq(transactions.importBatchId, batch.id)),
      )
      .returning({ id: transactions.id }),
    db
      .update(importBatches)
      .set({ status: 'undone', draftRows: null, updatedAt: sql`now()` })
      .where(ownedBy(importBatches, userId, batch.id)),
    db
      .update(statements)
      .set({ status: 'attached', updatedAt: sql`now()` })
      .where(
        and(
          ownedBy(statements, userId, batch.statementId),
          sql`not exists (
            select 1 from ${importBatches}
            where ${importBatches.statementId} = ${batch.statementId}
              and ${importBatches.status} = 'confirmed'
          )`,
        ),
      ),
  ]);
  return { ok: true, item: { removed: removed.length } };
}

async function ownedStatement(userId: string, id: string) {
  const [row] = await db.select().from(statements).where(ownedBy(statements, userId, id));
  return row ?? null;
}

async function ownedBatch(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(importBatches)
    .where(ownedBy(importBatches, userId, id));
  return row ?? null;
}

function fileKind(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension === 'csv') return 'csv';
  if (extension === 'ofx' || extension === 'qfx') return 'ofx';
  if (extension === 'pdf') return 'pdf';
  return 'image';
}

function toDraft(line: ImportLine): DraftLine {
  return { ...line, amountMinor: line.amountMinor.toString() };
}
