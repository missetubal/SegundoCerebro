import 'server-only';
import { asc, eq, sql } from 'drizzle-orm';
import { db } from '@/shared/db';
import { type MoveDirection, moveRow } from '@/shared/db';
import { deleteOwned, ownedBy, type WriteResult, writeUnique } from '@/shared/db';
import { areas } from '@/shared/db';
import type { AreaInput } from '../domain';

export type Area = typeof areas.$inferSelect;

export type AreaWriteResult = WriteResult<Area>;

function nextActiveSortOrder(userId: string) {
  return sql<number>`(
    select coalesce(max(${areas.sortOrder}), 0) + 1
    from ${areas}
    where ${areas.userId} = ${userId} and ${areas.archivedAt} is null
  )`;
}

export async function listAreas(
  userId: string,
): Promise<{ active: Area[]; archived: Area[] }> {
  const rows = await db
    .select()
    .from(areas)
    .where(eq(areas.userId, userId))
    .orderBy(
      asc(areas.sortOrder),
      asc(areas.createdAt),
      asc(areas.id),
    );

  return {
    active: rows.filter((area) => area.archivedAt === null),
    archived: rows
      .filter((area) => area.archivedAt !== null)
      .sort((a, b) => b.archivedAt!.getTime() - a.archivedAt!.getTime()),
  };
}

export async function getArea(
  userId: string,
  id: string,
): Promise<Area | null> {
  const [area] = await db.select().from(areas).where(ownedBy(areas, userId, id));
  return area ?? null;
}

export function createArea(
  userId: string,
  input: AreaInput,
): Promise<AreaWriteResult> {
  return writeUnique(() =>
    db
      .insert(areas)
      .values({ ...input, userId, sortOrder: nextActiveSortOrder(userId) })
      .returning(),
  );
}

export function updateArea(
  userId: string,
  id: string,
  input: AreaInput,
): Promise<AreaWriteResult> {
  return writeUnique(() =>
    db
      .update(areas)
      .set({ ...input, updatedAt: sql`now()` })
      .where(ownedBy(areas, userId, id))
      .returning(),
  );
}

export function moveArea(
  userId: string,
  id: string,
  direction: MoveDirection,
): Promise<boolean> {
  return moveRow(
    areas,
    sql`${areas.userId} = ${userId} and ${areas.archivedAt} is null`,
    id,
    direction,
  );
}

export async function archiveArea(userId: string, id: string): Promise<boolean> {
  const rows = await db
    .update(areas)
    .set({
      archivedAt: sql`coalesce(${areas.archivedAt}, now())`,
      updatedAt: sql`now()`,
    })
    .where(ownedBy(areas, userId, id))
    .returning({ id: areas.id });
  return rows.length > 0;
}

export async function unarchiveArea(
  userId: string,
  id: string,
): Promise<boolean> {
  const rows = await db
    .update(areas)
    .set({
      sortOrder: sql`case when ${areas.archivedAt} is null then ${areas.sortOrder} else ${nextActiveSortOrder(userId)} end`,
      archivedAt: null,
      updatedAt: sql`now()`,
    })
    .where(ownedBy(areas, userId, id))
    .returning({ id: areas.id });
  return rows.length > 0;
}

export function deleteArea(userId: string, id: string): Promise<boolean> {
  return deleteOwned(areas, userId, id);
}
