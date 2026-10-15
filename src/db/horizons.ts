import 'server-only';
import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { isUniqueViolation } from '@/db/errors';
import { type MoveDirection, moveRow } from '@/db/ordering';
import { getPreferences } from '@/db/preferences';
import { horizons, userPreferences } from '@/db/schema';

export type Horizon = typeof horizons.$inferSelect;

export type HorizonWriteResult =
  | { ok: true; horizon: Horizon }
  | { ok: false; reason: 'duplicate_name' | 'not_found' };

export const DEFAULT_HORIZON_NAMES = ['Curto', 'Médio', 'Longo', 'Contínuo'];

function ownedBy(userId: string, id: string) {
  return and(eq(horizons.userId, userId), eq(horizons.id, id));
}

async function writeHorizon(
  write: () => Promise<Horizon[]>,
): Promise<HorizonWriteResult> {
  try {
    const [horizon] = await write();
    return horizon ? { ok: true, horizon } : { ok: false, reason: 'not_found' };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, reason: 'duplicate_name' };
    throw error;
  }
}

async function seedDefaultHorizons(userId: string): Promise<void> {
  await getPreferences(userId);

  const defaults = sql.join(
    DEFAULT_HORIZON_NAMES.map(
      (name, index) => sql`(${name}, ${index + 1}::integer)`,
    ),
    sql`, `,
  );

  await db.execute(sql`
    with claimed as (
      update ${userPreferences}
      set ${sql.identifier(userPreferences.horizonsSeededAt.name)} = now()
      where ${userPreferences.userId} = ${userId}
        and ${userPreferences.horizonsSeededAt} is null
      returning ${userPreferences.userId} as user_id
    )
    insert into ${horizons} (
      ${sql.identifier(horizons.id.name)},
      ${sql.identifier(horizons.userId.name)},
      ${sql.identifier(horizons.name.name)},
      ${sql.identifier(horizons.sortOrder.name)}
    )
    select gen_random_uuid()::text, claimed.user_id, d.name, d.sort_order
    from claimed cross join (values ${defaults}) as d(name, sort_order)
    on conflict do nothing
  `);
}

function selectHorizons(userId: string) {
  return db
    .select()
    .from(horizons)
    .where(eq(horizons.userId, userId))
    .orderBy(asc(horizons.sortOrder), asc(horizons.createdAt), asc(horizons.id));
}

export async function listHorizons(userId: string): Promise<Horizon[]> {
  await seedDefaultHorizons(userId);
  return selectHorizons(userId);
}

export async function createHorizon(
  userId: string,
  name: string,
): Promise<HorizonWriteResult> {
  await seedDefaultHorizons(userId);
  return writeHorizon(() =>
    db
      .insert(horizons)
      .values({
        userId,
        name,
        sortOrder: sql`(
          select coalesce(max(${horizons.sortOrder}), 0) + 1
          from ${horizons}
          where ${horizons.userId} = ${userId}
        )`,
      })
      .returning(),
  );
}

export function renameHorizon(
  userId: string,
  id: string,
  name: string,
): Promise<HorizonWriteResult> {
  return writeHorizon(() =>
    db
      .update(horizons)
      .set({ name, updatedAt: sql`now()` })
      .where(ownedBy(userId, id))
      .returning(),
  );
}

export function moveHorizon(
  userId: string,
  id: string,
  direction: MoveDirection,
): Promise<boolean> {
  return moveRow(horizons, sql`${horizons.userId} = ${userId}`, id, direction);
}

export async function deleteHorizon(userId: string, id: string): Promise<boolean> {
  const rows = await db
    .delete(horizons)
    .where(ownedBy(userId, id))
    .returning({ id: horizons.id });
  return rows.length > 0;
}
