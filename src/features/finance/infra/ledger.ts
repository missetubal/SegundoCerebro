import 'server-only';

import { and, desc, eq, gte, ilike, inArray, isNull, lte, sql } from 'drizzle-orm';
import {
  db,
  financialAccounts,
  isUniqueViolation,
  ownedBy,
  statements,
  transactionCategories,
  transactions,
} from '@/shared/db';
import { dedupeHash } from '../domain';
import type { CategoryInput, TransactionInput } from '../domain';
import type { FinanceResult } from './accounts';
import { activeAccount, activeCard } from './accounts';

export type TransactionCategory = typeof transactionCategories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;

export type TransactionFilters = {
  query?: string;
  from?: string;
  to?: string;
  categoryId?: string;
  accountId?: string;
  creditCardId?: string;
  type?: string;
};

export async function listCategories(userId: string): Promise<{
  active: TransactionCategory[];
  archived: TransactionCategory[];
}> {
  const rows = await db
    .select()
    .from(transactionCategories)
    .where(eq(transactionCategories.userId, userId))
    .orderBy(transactionCategories.name);
  return {
    active: rows.filter((row) => row.archivedAt === null),
    archived: rows.filter((row) => row.archivedAt !== null),
  };
}

export async function createCategory(
  userId: string,
  input: CategoryInput,
): Promise<FinanceResult<TransactionCategory>> {
  if (input.parentId && !(await categoryOwned(userId, input.parentId))) {
    return { ok: false, reason: 'not_found' };
  }
  if (await parentCycle(userId, null, input.parentId)) {
    return { ok: false, reason: 'not_found' };
  }
  try {
    const [item] = await db
      .insert(transactionCategories)
      .values({
        userId,
        name: input.name,
        color: input.color,
        icon: input.icon,
        parentId: input.parentId,
      })
      .returning();
    return item ? { ok: true, item } : { ok: false, reason: 'not_found' };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, reason: 'duplicate_name' };
    throw error;
  }
}

export async function updateCategory(
  userId: string,
  id: string,
  input: CategoryInput,
): Promise<FinanceResult<TransactionCategory>> {
  if (!(await categoryOwned(userId, id))) return { ok: false, reason: 'not_found' };
  if (input.parentId && !(await categoryOwned(userId, input.parentId))) {
    return { ok: false, reason: 'not_found' };
  }
  if (await parentCycle(userId, id, input.parentId)) {
    return { ok: false, reason: 'not_found' };
  }
  try {
    const [item] = await db
      .update(transactionCategories)
      .set({
        name: input.name,
        color: input.color,
        icon: input.icon,
        parentId: input.parentId,
        updatedAt: sql`now()`,
      })
      .where(ownedBy(transactionCategories, userId, id))
      .returning();
    return item ? { ok: true, item } : { ok: false, reason: 'not_found' };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, reason: 'duplicate_name' };
    throw error;
  }
}

export async function setCategoryArchived(
  userId: string,
  id: string,
  archived: boolean,
): Promise<boolean> {
  const rows = await db
    .update(transactionCategories)
    .set({
      archivedAt: archived ? sql`now()` : null,
      updatedAt: sql`now()`,
    })
    .where(ownedBy(transactionCategories, userId, id))
    .returning({ id: transactionCategories.id });
  return rows.length > 0;
}

export async function deleteCategory(
  userId: string,
  id: string,
): Promise<FinanceResult<{ id: string }>> {
  if (!(await categoryOwned(userId, id))) return { ok: false, reason: 'not_found' };
  const [used] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), eq(transactions.categoryId, id)))
    .limit(1);
  if (used) return { ok: false, reason: 'has_children' };
  const rows = await db
    .delete(transactionCategories)
    .where(ownedBy(transactionCategories, userId, id))
    .returning({ id: transactionCategories.id });
  return rows[0]
    ? { ok: true, item: rows[0] }
    : { ok: false, reason: 'not_found' };
}

export async function listTransactions(
  userId: string,
  filters: TransactionFilters = {},
): Promise<Transaction[]> {
  const conditions = [eq(transactions.userId, userId)];
  if (filters.query) {
    conditions.push(ilike(transactions.description, `%${filters.query}%`));
  }
  if (filters.from) conditions.push(gte(transactions.transactionDate, filters.from));
  if (filters.to) conditions.push(lte(transactions.transactionDate, filters.to));
  if (filters.categoryId === 'none') {
    conditions.push(isNull(transactions.categoryId));
  } else if (filters.categoryId) {
    conditions.push(eq(transactions.categoryId, filters.categoryId));
  }
  if (filters.accountId) conditions.push(eq(transactions.accountId, filters.accountId));
  if (filters.creditCardId) {
    conditions.push(eq(transactions.creditCardId, filters.creditCardId));
  }
  if (filters.type) conditions.push(eq(transactions.type, filters.type));
  return db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.transactionDate), desc(transactions.createdAt));
}

export async function getTransaction(
  userId: string,
  id: string,
): Promise<Transaction | null> {
  const [item] = await db
    .select()
    .from(transactions)
    .where(ownedBy(transactions, userId, id));
  return item ?? null;
}

export async function createTransaction(
  userId: string,
  input: TransactionInput,
): Promise<FinanceResult<Transaction>> {
  const instrument = await assertInstrument(userId, input.accountId, input.creditCardId);
  if (!instrument.ok) return instrument;
  if (input.categoryId && !(await activeCategory(userId, input.categoryId))) {
    return { ok: false, reason: 'not_found' };
  }
  if (input.statementId && !(await statementOwned(userId, input.statementId))) {
    return { ok: false, reason: 'not_found' };
  }
  const [item] = await db
    .insert(transactions)
    .values(transactionValues(userId, input, instrument.currency))
    .returning();
  return item ? { ok: true, item } : { ok: false, reason: 'not_found' };
}

export async function updateTransaction(
  userId: string,
  id: string,
  input: TransactionInput,
): Promise<FinanceResult<Transaction>> {
  if (!(await getTransaction(userId, id))) return { ok: false, reason: 'not_found' };
  const instrument = await assertInstrument(userId, input.accountId, input.creditCardId);
  if (!instrument.ok) return instrument;
  if (input.categoryId && !(await categoryOwned(userId, input.categoryId))) {
    return { ok: false, reason: 'not_found' };
  }
  const [item] = await db
    .update(transactions)
    .set({
      ...transactionValues(userId, input, instrument.currency),
      updatedAt: sql`now()`,
    })
    .where(ownedBy(transactions, userId, id))
    .returning();
  return item ? { ok: true, item } : { ok: false, reason: 'not_found' };
}

export async function deleteTransaction(
  userId: string,
  id: string,
): Promise<boolean> {
  const rows = await db
    .delete(transactions)
    .where(ownedBy(transactions, userId, id))
    .returning({ id: transactions.id });
  return rows.length > 0;
}

export async function assignCategory(
  userId: string,
  ids: string[],
  categoryId: string,
): Promise<FinanceResult<{ count: number }>> {
  if (ids.length === 0) return { ok: true, item: { count: 0 } };
  const uniqueIds = [...new Set(ids)];
  const owned = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      and(eq(transactions.userId, userId), inArray(transactions.id, uniqueIds)),
    );
  if (owned.length !== uniqueIds.length) return { ok: false, reason: 'not_found' };
  if (!(await activeCategory(userId, categoryId))) {
    return { ok: false, reason: 'not_found' };
  }
  await db
    .update(transactions)
    .set({ categoryId, updatedAt: sql`now()` })
    .where(
      and(eq(transactions.userId, userId), inArray(transactions.id, uniqueIds)),
    );
  return { ok: true, item: { count: uniqueIds.length } };
}

function transactionValues(
  userId: string,
  input: TransactionInput,
  currency: string,
) {
  const accountId = input.accountId;
  const creditCardId = input.creditCardId;
  const instrumentKind = accountId ? 'account' : 'card';
  const instrumentId = accountId ?? creditCardId ?? '';
  return {
    userId,
    accountId,
    creditCardId,
    statementId: input.statementId,
    description: input.description,
    transactionDate: input.transactionDate,
    postedDate: input.postedDate,
    amountMinor: input.amount,
    currency,
    direction: input.direction,
    type: input.type,
    categoryId: input.categoryId,
    installmentNumber: input.installmentNumber
      ? Number(input.installmentNumber)
      : null,
    installmentTotal: input.installmentTotal
      ? Number(input.installmentTotal)
      : null,
    notes: input.notes,
    dedupeHash: dedupeHash({
      instrumentKind,
      instrumentId,
      transactionDate: input.transactionDate,
      amountMinor: input.amount,
      description: input.description,
      externalId: null,
    }),
  };
}

async function assertInstrument(
  userId: string,
  accountId: string | null,
  creditCardId: string | null,
): Promise<{ ok: true; currency: string } | { ok: false; reason: 'archived' | 'not_found' }> {
  if (accountId) {
    const account = await activeAccount(userId, accountId);
    if (!account) {
      const any = await db
        .select({ id: financialAccounts.id })
        .from(financialAccounts)
        .where(ownedBy(financialAccounts, userId, accountId));
      return { ok: false, reason: any.length > 0 ? 'archived' : 'not_found' };
    }
    return { ok: true, currency: account.currency.trim() };
  }
  if (creditCardId) {
    const card = await activeCard(userId, creditCardId);
    if (!card) return { ok: false, reason: 'not_found' };
    return { ok: true, currency: card.currency.trim() };
  }
  return { ok: false, reason: 'not_found' };
}

async function statementOwned(userId: string, id: string) {
  const [row] = await db
    .select({ id: statements.id })
    .from(statements)
    .where(ownedBy(statements, userId, id));
  return Boolean(row);
}

async function categoryOwned(userId: string, id: string) {
  const [row] = await db
    .select({ id: transactionCategories.id })
    .from(transactionCategories)
    .where(ownedBy(transactionCategories, userId, id));
  return Boolean(row);
}

async function activeCategory(userId: string, id: string) {
  const [row] = await db
    .select({ id: transactionCategories.id })
    .from(transactionCategories)
    .where(
      and(
        ownedBy(transactionCategories, userId, id),
        isNull(transactionCategories.archivedAt),
      ),
    );
  return Boolean(row);
}

async function parentCycle(
  userId: string,
  categoryId: string | null,
  parentId: string | null,
) {
  let current = parentId;
  const seen = new Set<string>();
  while (current) {
    if (current === categoryId || seen.has(current)) return true;
    seen.add(current);
    const [row] = await db
      .select({ parentId: transactionCategories.parentId })
      .from(transactionCategories)
      .where(ownedBy(transactionCategories, userId, current));
    current = row?.parentId ?? null;
  }
  return false;
}
