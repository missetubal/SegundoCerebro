import 'server-only';
import { and, eq } from 'drizzle-orm';
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';
import { db } from '@/db';
import { isUniqueViolation } from '@/db/errors';

export type OwnedTable = PgTable & { id: AnyPgColumn; userId: AnyPgColumn };

export type WriteResult<T> =
  | { ok: true; item: T }
  | { ok: false; reason: 'duplicate_name' | 'not_found' };

export function ownedBy(table: OwnedTable, userId: string, id: string) {
  return and(eq(table.userId, userId), eq(table.id, id));
}

/** Runs an insert/update `returning()`; maps no row to not_found and unique violations to duplicate_name. */
export async function writeUnique<T>(
  write: () => Promise<T[]>,
): Promise<WriteResult<T>> {
  try {
    const [item] = await write();
    return item ? { ok: true, item } : { ok: false, reason: 'not_found' };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, reason: 'duplicate_name' };
    throw error;
  }
}

export async function deleteOwned(
  table: OwnedTable,
  userId: string,
  id: string,
): Promise<boolean> {
  const rows = await db
    .delete(table)
    .where(ownedBy(table, userId, id))
    .returning({ id: table.id });
  return rows.length > 0;
}
