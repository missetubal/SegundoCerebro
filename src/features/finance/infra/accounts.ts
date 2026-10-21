import 'server-only';

import { and, eq, isNull, sql } from 'drizzle-orm';
import {
  creditCards,
  db,
  financialAccounts,
  financialInstitutions,
  isUniqueViolation,
  ownedBy,
  statements,
  transactions,
} from '@/shared/db';
import { accountBalance, type LedgerRow } from '../domain';
import type {
  AccountInput,
  CardInput,
  InstitutionInput,
  InstitutionType,
} from '../domain';

export type FinancialInstitution = typeof financialInstitutions.$inferSelect;
export type FinancialAccount = typeof financialAccounts.$inferSelect;
export type CreditCard = typeof creditCards.$inferSelect;

export type FinanceFailure =
  | 'not_found'
  | 'duplicate_name'
  | 'has_children'
  | 'currency_locked'
  | 'archived';

export type FinanceResult<T> =
  | { ok: true; item: T }
  | { ok: false; reason: FinanceFailure };

export async function listInstitutions(
  userId: string,
): Promise<FinancialInstitution[]> {
  return db
    .select()
    .from(financialInstitutions)
    .where(eq(financialInstitutions.userId, userId))
    .orderBy(financialInstitutions.name);
}

export async function createInstitution(
  userId: string,
  input: InstitutionInput,
): Promise<FinanceResult<FinancialInstitution>> {
  try {
    const [item] = await db
      .insert(financialInstitutions)
      .values({ userId, name: input.name, type: input.type })
      .returning();
    return item
      ? { ok: true, item }
      : { ok: false, reason: 'not_found' };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, reason: 'duplicate_name' };
    throw error;
  }
}

export async function listAccounts(userId: string): Promise<{
  active: FinancialAccount[];
  archived: FinancialAccount[];
}> {
  const rows = await db
    .select()
    .from(financialAccounts)
    .where(eq(financialAccounts.userId, userId))
    .orderBy(financialAccounts.name);
  return {
    active: rows.filter((row) => row.archivedAt === null),
    archived: rows.filter((row) => row.archivedAt !== null),
  };
}

export async function getAccount(
  userId: string,
  id: string,
): Promise<FinancialAccount | null> {
  const [item] = await db
    .select()
    .from(financialAccounts)
    .where(ownedBy(financialAccounts, userId, id));
  return item ?? null;
}

export async function createAccount(
  userId: string,
  input: AccountInput,
): Promise<FinanceResult<FinancialAccount>> {
  const institutionId = await ensureInstitution(
    userId,
    input.institutionId,
    input.newInstitutionName,
    'bank',
  );
  if (!institutionId) return { ok: false, reason: 'not_found' };
  const [item] = await db
    .insert(financialAccounts)
    .values({
      userId,
      institutionId,
      name: input.name,
      accountType: input.accountType,
      currency: input.currency,
      openingBalanceMinor: input.openingBalance,
    })
    .returning();
  return item ? { ok: true, item } : { ok: false, reason: 'not_found' };
}

export async function updateAccount(
  userId: string,
  id: string,
  input: AccountInput,
): Promise<FinanceResult<FinancialAccount>> {
  const existing = await getAccount(userId, id);
  if (!existing) return { ok: false, reason: 'not_found' };
  if (input.currency !== existing.currency.trim()) {
    const locked = await accountHasTransactions(userId, id);
    if (locked) return { ok: false, reason: 'currency_locked' };
  }
  const institutionId = await ensureInstitution(
    userId,
    input.institutionId,
    input.newInstitutionName,
    'bank',
  );
  if (!institutionId) return { ok: false, reason: 'not_found' };
  const [item] = await db
    .update(financialAccounts)
    .set({
      institutionId,
      name: input.name,
      accountType: input.accountType,
      currency: input.currency,
      openingBalanceMinor: input.openingBalance,
      updatedAt: sql`now()`,
    })
    .where(ownedBy(financialAccounts, userId, id))
    .returning();
  return item ? { ok: true, item } : { ok: false, reason: 'not_found' };
}

export async function setAccountArchived(
  userId: string,
  id: string,
  archived: boolean,
): Promise<boolean> {
  const rows = await db
    .update(financialAccounts)
    .set({
      archivedAt: archived ? sql`now()` : null,
      updatedAt: sql`now()`,
    })
    .where(ownedBy(financialAccounts, userId, id))
    .returning({ id: financialAccounts.id });
  return rows.length > 0;
}

export async function deleteAccount(
  userId: string,
  id: string,
): Promise<FinanceResult<{ id: string }>> {
  const existing = await getAccount(userId, id);
  if (!existing) return { ok: false, reason: 'not_found' };
  if (
    (await accountHasTransactions(userId, id)) ||
    (await accountHasStatements(userId, id))
  ) {
    return { ok: false, reason: 'has_children' };
  }
  const rows = await db
    .delete(financialAccounts)
    .where(ownedBy(financialAccounts, userId, id))
    .returning({ id: financialAccounts.id });
  return rows[0]
    ? { ok: true, item: rows[0] }
    : { ok: false, reason: 'not_found' };
}

export async function listAccountBalances(userId: string): Promise<
  Array<{
    id: string;
    name: string;
    currency: string;
    balanceMinor: bigint;
    archivedAt: Date | null;
  }>
> {
  const accounts = await db
    .select()
    .from(financialAccounts)
    .where(eq(financialAccounts.userId, userId));
  const movements = await db
    .select({
      accountId: transactions.accountId,
      amountMinor: transactions.amountMinor,
      direction: transactions.direction,
      currency: transactions.currency,
      type: transactions.type,
    })
    .from(transactions)
    .where(eq(transactions.userId, userId));
  const rows: LedgerRow[] = movements.flatMap((movement) => {
    if (!movement.accountId) return [];
    return [
      {
        amountMinor: movement.amountMinor,
        currency: movement.currency.trim() as LedgerRow['currency'],
        type: movement.type as LedgerRow['type'],
        direction: movement.direction as LedgerRow['direction'],
        categoryName: null,
        accountId: movement.accountId,
        creditCardId: null,
      },
    ];
  });
  return accounts.map((account) => ({
    id: account.id,
    name: account.name,
    currency: account.currency.trim(),
    archivedAt: account.archivedAt,
    balanceMinor: accountBalance(account.openingBalanceMinor, rows, account.id),
  }));
}

export async function listCards(userId: string): Promise<{
  active: CreditCard[];
  archived: CreditCard[];
}> {
  const rows = await db
    .select()
    .from(creditCards)
    .where(eq(creditCards.userId, userId))
    .orderBy(creditCards.nickname);
  return {
    active: rows.filter((row) => row.archivedAt === null),
    archived: rows.filter((row) => row.archivedAt !== null),
  };
}

export async function getCard(
  userId: string,
  id: string,
): Promise<CreditCard | null> {
  const [item] = await db
    .select()
    .from(creditCards)
    .where(ownedBy(creditCards, userId, id));
  return item ?? null;
}

export async function createCard(
  userId: string,
  input: CardInput,
): Promise<FinanceResult<CreditCard>> {
  const institutionId = await ensureInstitution(
    userId,
    input.institutionId,
    input.newInstitutionName,
    'bank',
  );
  if (!institutionId) return { ok: false, reason: 'not_found' };
  const [item] = await db
    .insert(creditCards)
    .values({
      userId,
      institutionId,
      nickname: input.nickname,
      brand: input.brand,
      last4: input.last4,
      creditLimitMinor: input.creditLimit,
      closingDay: input.closingDay,
      dueDay: input.dueDay,
      currency: input.currency,
    })
    .returning();
  return item ? { ok: true, item } : { ok: false, reason: 'not_found' };
}

export async function updateCard(
  userId: string,
  id: string,
  input: CardInput,
): Promise<FinanceResult<CreditCard>> {
  const existing = await getCard(userId, id);
  if (!existing) return { ok: false, reason: 'not_found' };
  if (input.currency !== existing.currency.trim()) {
    const [child] = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(
        and(eq(transactions.userId, userId), eq(transactions.creditCardId, id)),
      )
      .limit(1);
    if (child) return { ok: false, reason: 'currency_locked' };
  }
  const institutionId = await ensureInstitution(
    userId,
    input.institutionId,
    input.newInstitutionName,
    'bank',
  );
  if (!institutionId) return { ok: false, reason: 'not_found' };
  const [item] = await db
    .update(creditCards)
    .set({
      institutionId,
      nickname: input.nickname,
      brand: input.brand,
      last4: input.last4,
      creditLimitMinor: input.creditLimit,
      closingDay: input.closingDay,
      dueDay: input.dueDay,
      currency: input.currency,
      updatedAt: sql`now()`,
    })
    .where(ownedBy(creditCards, userId, id))
    .returning();
  return item ? { ok: true, item } : { ok: false, reason: 'not_found' };
}

export async function setCardArchived(
  userId: string,
  id: string,
  archived: boolean,
): Promise<boolean> {
  const rows = await db
    .update(creditCards)
    .set({
      archivedAt: archived ? sql`now()` : null,
      updatedAt: sql`now()`,
    })
    .where(ownedBy(creditCards, userId, id))
    .returning({ id: creditCards.id });
  return rows.length > 0;
}

export async function ensureInstitution(
  userId: string,
  institutionId: string | null,
  newName: string | null,
  fallbackType: InstitutionType,
): Promise<string | null> {
  if (newName) {
    const [existing] = await db
      .select({ id: financialInstitutions.id })
      .from(financialInstitutions)
      .where(
        and(
          eq(financialInstitutions.userId, userId),
          sql`lower(${financialInstitutions.name}) = lower(${newName})`,
        ),
      )
      .limit(1);
    if (existing) return existing.id;
    try {
      const [created] = await db
        .insert(financialInstitutions)
        .values({ userId, name: newName, type: fallbackType })
        .returning({ id: financialInstitutions.id });
      return created?.id ?? null;
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const [retry] = await db
        .select({ id: financialInstitutions.id })
        .from(financialInstitutions)
        .where(
          and(
            eq(financialInstitutions.userId, userId),
            sql`lower(${financialInstitutions.name}) = lower(${newName})`,
          ),
        )
        .limit(1);
      return retry?.id ?? null;
    }
  }
  if (!institutionId) return null;
  const [owned] = await db
    .select({ id: financialInstitutions.id })
    .from(financialInstitutions)
    .where(ownedBy(financialInstitutions, userId, institutionId));
  return owned?.id ?? null;
}

async function accountHasTransactions(userId: string, accountId: string) {
  const [row] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      and(eq(transactions.userId, userId), eq(transactions.accountId, accountId)),
    )
    .limit(1);
  return Boolean(row);
}

async function accountHasStatements(userId: string, accountId: string) {
  const [row] = await db
    .select({ id: statements.id })
    .from(statements)
    .where(and(eq(statements.userId, userId), eq(statements.accountId, accountId)))
    .limit(1);
  return Boolean(row);
}

export async function activeAccount(
  userId: string,
  id: string,
): Promise<FinancialAccount | null> {
  const [item] = await db
    .select()
    .from(financialAccounts)
    .where(
      and(
        ownedBy(financialAccounts, userId, id),
        isNull(financialAccounts.archivedAt),
      ),
    );
  return item ?? null;
}

export async function activeCard(
  userId: string,
  id: string,
): Promise<CreditCard | null> {
  const [item] = await db
    .select()
    .from(creditCards)
    .where(and(ownedBy(creditCards, userId, id), isNull(creditCards.archivedAt)));
  return item ?? null;
}
