import 'server-only';
import { asc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { type MoveDirection, moveRow } from '@/db/ordering';
import { deleteOwned, ownedBy, type WriteResult, writeUnique } from '@/db/owned';
import { getPreferences } from '@/db/preferences';
import { horizons, userPreferences } from '@/db/schema';

export type Horizon = typeof horizons.$inferSelect;

export type HorizonWriteResult = WriteResult<Horizon>;

export const DEFAULT_HORIZON_NAMES = ['Curto', 'Médio', 'Longo', 'Contínuo'];

async function seedDefaultHorizons(userId: string): Promise<void> {
  const preferences = await getPreferences(userId);
  if (preferences.horizonsSeededAt) return;

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
  const [preferences, existing] = await Promise.all([
    getPreferences(userId),
    selectHorizons(userId),
  ]);
  if (preferences.horizonsSeededAt) return existing;

  await seedDefaultHorizons(userId);
  return selectHorizons(userId);
}

export async function createHorizon(
  userId: string,
  name: string,
): Promise<HorizonWriteResult> {
  await seedDefaultHorizons(userId);
  return writeUnique(() =>
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
  return writeUnique(() =>
    db
      .update(horizons)
      .set({ name, updatedAt: sql`now()` })
      .where(ownedBy(horizons, userId, id))
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

export function deleteHorizon(userId: string, id: string): Promise<boolean> {
  return deleteOwned(horizons, userId, id);
}
