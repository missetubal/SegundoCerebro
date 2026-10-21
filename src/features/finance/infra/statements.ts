import 'server-only';

import { createHash } from 'node:crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import {
  db,
  importBatches,
  ownedBy,
  statementAttachments,
  statements,
  transactions,
} from '@/shared/db';
import { inspectFile } from '../domain/files';
import type { StatementInput } from '../domain';
import type { FinanceResult } from './accounts';
import { activeAccount, activeCard } from './accounts';
import { createMemoryBlobStore, defaultBlobStore, type BlobStore } from './blob-store';

export type Statement = typeof statements.$inferSelect;

export type StatementView = {
  id: string;
  accountId: string | null;
  creditCardId: string | null;
  referenceMonth: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string | null;
  declaredTotalMinor: bigint | null;
  currency: string;
  status: string;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
};

type FilePayload = { name: string; type: string; bytes: Uint8Array };

export async function listStatements(
  userId: string,
  filters: { creditCardId?: string; accountId?: string; referenceMonth?: string } = {},
): Promise<StatementView[]> {
  const conditions = [eq(statements.userId, userId)];
  if (filters.creditCardId) conditions.push(eq(statements.creditCardId, filters.creditCardId));
  if (filters.accountId) conditions.push(eq(statements.accountId, filters.accountId));
  if (filters.referenceMonth) {
    conditions.push(eq(statements.referenceMonth, monthDate(filters.referenceMonth)));
  }
  const rows = await db
    .select({
      statement: statements,
      fileName: statementAttachments.fileName,
      mimeType: statementAttachments.mimeType,
      sizeBytes: statementAttachments.sizeBytes,
    })
    .from(statements)
    .leftJoin(
      statementAttachments,
      eq(statementAttachments.statementId, statements.id),
    )
    .where(and(...conditions))
    .orderBy(desc(statements.referenceMonth));
  return rows.map((row) => toView(row.statement, row));
}

export async function getStatement(
  userId: string,
  id: string,
): Promise<StatementView | null> {
  const [row] = await db
    .select({
      statement: statements,
      fileName: statementAttachments.fileName,
      mimeType: statementAttachments.mimeType,
      sizeBytes: statementAttachments.sizeBytes,
    })
    .from(statements)
    .leftJoin(
      statementAttachments,
      eq(statementAttachments.statementId, statements.id),
    )
    .where(ownedBy(statements, userId, id));
  return row ? toView(row.statement, row) : null;
}

export async function createStatement(
  userId: string,
  input: StatementInput,
  file: FilePayload,
  store: BlobStore = defaultBlobStore(),
): Promise<FinanceResult<StatementView>> {
  const inspected = inspectFile(file.name, file.type, file.bytes);
  if (!inspected.ok) return { ok: false, reason: 'not_found' };
  const owner = await ownerCurrency(userId, input.accountId, input.creditCardId);
  if (!owner) return { ok: false, reason: 'archived' };
  const checksum = createHash('sha256').update(file.bytes).digest('hex');
  let stored: { pathname: string };
  try {
    stored = await store.put(
      `finance/${userId}/${checksum}-${file.name}`,
      Buffer.from(file.bytes),
      file.type,
    );
  } catch (error) {
    console.error('finance statement upload failed');
    void error;
    return { ok: false, reason: 'not_found' };
  }
  try {
    const [statement] = await db
      .insert(statements)
      .values({
        userId,
        accountId: input.accountId,
        creditCardId: input.creditCardId,
        referenceMonth: monthDate(input.referenceMonth),
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        dueDate: input.dueDate,
        declaredTotalMinor: input.declaredTotal,
        currency: owner.currency,
        status: 'attached',
      })
      .returning();
    if (!statement) return { ok: false, reason: 'not_found' };
    await db.insert(statementAttachments).values({
      userId,
      statementId: statement.id,
      storageKey: stored.pathname,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.bytes.byteLength,
      checksum,
    });
    return { ok: true, item: toView(statement, { fileName: file.name, mimeType: file.type, sizeBytes: file.bytes.byteLength }) };
  } catch (error) {
    console.error('finance statement upload failed');
    void error;
    await store.remove(stored.pathname).catch(() => undefined);
    return { ok: false, reason: 'not_found' };
  }
}

export async function signedStatementUrl(
  userId: string,
  statementId: string,
  store: BlobStore = defaultBlobStore(),
): Promise<string | null> {
  const [attachment] = await db
    .select({ storageKey: statementAttachments.storageKey })
    .from(statementAttachments)
    .where(
      and(
        eq(statementAttachments.userId, userId),
        eq(statementAttachments.statementId, statementId),
      ),
    );
  if (!attachment) return null;
  return store.signedDownloadUrl(attachment.storageKey);
}

export async function deleteAttachment(
  userId: string,
  statementId: string,
  store: BlobStore = defaultBlobStore(),
): Promise<boolean> {
  const [attachment] = await db
    .select()
    .from(statementAttachments)
    .where(
      and(
        eq(statementAttachments.userId, userId),
        eq(statementAttachments.statementId, statementId),
      ),
    );
  if (!attachment) return false;
  await store.remove(attachment.storageKey);
  await db
    .delete(statementAttachments)
    .where(ownedBy(statementAttachments, userId, attachment.id));
  return true;
}

export async function replaceAttachment(
  userId: string,
  statementId: string,
  file: FilePayload,
  store: BlobStore = defaultBlobStore(),
): Promise<boolean> {
  const statement = await getStatement(userId, statementId);
  if (!statement) return false;
  const inspected = inspectFile(file.name, file.type, file.bytes);
  if (!inspected.ok) return false;
  const [attachment] = await db
    .select()
    .from(statementAttachments)
    .where(
      and(
        eq(statementAttachments.userId, userId),
        eq(statementAttachments.statementId, statementId),
      ),
    );
  if (!attachment) return false;
  const checksum = createHash('sha256').update(file.bytes).digest('hex');
  const stored = await store.put(
    `finance/${userId}/${checksum}-${file.name}`,
    Buffer.from(file.bytes),
    file.type,
  );
  try {
    await db
      .update(statementAttachments)
      .set({
        storageKey: stored.pathname,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.bytes.byteLength,
        checksum,
        updatedAt: new Date(),
      })
      .where(ownedBy(statementAttachments, userId, attachment.id));
  } catch (error) {
    console.error('finance statement upload failed');
    void error;
    await store.remove(stored.pathname).catch(() => undefined);
    return false;
  }
  if (stored.pathname !== attachment.storageKey) {
    await store.remove(attachment.storageKey).catch(() => undefined);
  }
  return true;
}

export async function deleteAttachmentAndImported(
  userId: string,
  statementId: string,
  store: BlobStore = defaultBlobStore(),
): Promise<boolean> {
  const statement = await getStatement(userId, statementId);
  if (!statement) return false;
  const batches = await db
    .select({ id: importBatches.id })
    .from(importBatches)
    .where(
      and(eq(importBatches.userId, userId), eq(importBatches.statementId, statementId)),
    );
  if (batches.length > 0) {
    await db.delete(transactions).where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.statementId, statementId),
        sql`${transactions.importBatchId} is not null`,
      ),
    );
  }
  return deleteAttachment(userId, statementId, store);
}

export async function markStatementReviewed(
  userId: string,
  statementId: string,
): Promise<boolean> {
  const rows = await db
    .update(statements)
    .set({ status: 'reviewed', updatedAt: sql`now()` })
    .where(
      and(
        ownedBy(statements, userId, statementId),
        eq(statements.status, 'imported'),
      ),
    )
    .returning({ id: statements.id });
  return rows.length > 0;
}

function monthDate(month: string) {
  return month.length === 7 ? `${month}-01` : month;
}

async function ownerCurrency(
  userId: string,
  accountId: string | null,
  creditCardId: string | null,
) {
  if (accountId) {
    const account = await activeAccount(userId, accountId);
    return account ? { currency: account.currency.trim() } : null;
  }
  if (creditCardId) {
    const card = await activeCard(userId, creditCardId);
    return card ? { currency: card.currency.trim() } : null;
  }
  return null;
}

function toView(
  statement: Statement,
  file: { fileName: string | null; mimeType: string | null; sizeBytes: number | null },
): StatementView {
  return {
    id: statement.id,
    accountId: statement.accountId,
    creditCardId: statement.creditCardId,
    referenceMonth: statement.referenceMonth.slice(0, 7),
    periodStart: statement.periodStart,
    periodEnd: statement.periodEnd,
    dueDate: statement.dueDate,
    declaredTotalMinor: statement.declaredTotalMinor,
    currency: statement.currency.trim(),
    status: statement.status,
    fileName: file.fileName,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
  };
}

export { createMemoryBlobStore };
