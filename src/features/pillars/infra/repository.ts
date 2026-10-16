import 'server-only';
import { asc, eq, sql } from 'drizzle-orm';
import { db } from '@/shared/db';
import { type MoveDirection, moveRow } from '@/shared/db';
import { deleteOwned, ownedBy, type WriteResult, writeUnique } from '@/shared/db';
import { pillars } from '@/shared/db';
import type { PillarInput } from '../domain';

export type Pillar = typeof pillars.$inferSelect;

export type PillarWriteResult = WriteResult<Pillar>;

function nextActiveSortOrder(userId: string) {
  return sql<number>`(
    select coalesce(max(${pillars.sortOrder}), 0) + 1
    from ${pillars}
    where ${pillars.userId} = ${userId} and ${pillars.archivedAt} is null
  )`;
}

export async function listPillars(
  userId: string,
): Promise<{ active: Pillar[]; archived: Pillar[] }> {
  const rows = await db
    .select()
    .from(pillars)
    .where(eq(pillars.userId, userId))
    .orderBy(
      asc(pillars.sortOrder),
      asc(pillars.createdAt),
      asc(pillars.id),
    );

  return {
    active: rows.filter((pillar) => pillar.archivedAt === null),
    archived: rows
      .filter((pillar) => pillar.archivedAt !== null)
      .sort((a, b) => b.archivedAt!.getTime() - a.archivedAt!.getTime()),
  };
}

export async function getPillar(
  userId: string,
  id: string,
): Promise<Pillar | null> {
  const [pillar] = await db.select().from(pillars).where(ownedBy(pillars, userId, id));
  return pillar ?? null;
}

export function createPillar(
  userId: string,
  input: PillarInput,
): Promise<PillarWriteResult> {
  return writeUnique(() =>
    db
      .insert(pillars)
      .values({ ...input, userId, sortOrder: nextActiveSortOrder(userId) })
      .returning(),
  );
}

export function updatePillar(
  userId: string,
  id: string,
  input: PillarInput,
): Promise<PillarWriteResult> {
  return writeUnique(() =>
    db
      .update(pillars)
      .set({ ...input, updatedAt: sql`now()` })
      .where(ownedBy(pillars, userId, id))
      .returning(),
  );
}

export function movePillar(
  userId: string,
  id: string,
  direction: MoveDirection,
): Promise<boolean> {
  return moveRow(
    pillars,
    sql`${pillars.userId} = ${userId} and ${pillars.archivedAt} is null`,
    id,
    direction,
  );
}

export async function archivePillar(userId: string, id: string): Promise<boolean> {
  const rows = await db
    .update(pillars)
    .set({
      archivedAt: sql`coalesce(${pillars.archivedAt}, now())`,
      updatedAt: sql`now()`,
    })
    .where(ownedBy(pillars, userId, id))
    .returning({ id: pillars.id });
  return rows.length > 0;
}

export async function unarchivePillar(
  userId: string,
  id: string,
): Promise<boolean> {
  const rows = await db
    .update(pillars)
    .set({
      sortOrder: sql`case when ${pillars.archivedAt} is null then ${pillars.sortOrder} else ${nextActiveSortOrder(userId)} end`,
      archivedAt: null,
      updatedAt: sql`now()`,
    })
    .where(ownedBy(pillars, userId, id))
    .returning({ id: pillars.id });
  return rows.length > 0;
}

export function deletePillar(userId: string, id: string): Promise<boolean> {
  return deleteOwned(pillars, userId, id);
}
