import 'server-only';
import { type SQL, sql } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { db } from '@/db';

export type MoveDirection = 'up' | 'down';

/**
 * Swaps the row with its neighbor inside `scope` and renumbers the whole list
 * (1..n) in one statement. `for update` makes concurrent moves on the same list
 * wait for each other and rank the latest committed order, so no move is lost.
 * Returns false when the row is not in `scope`.
 */
export async function moveRow(
  table: PgTable,
  scope: SQL,
  id: string,
  direction: MoveDirection,
): Promise<boolean> {
  const delta = direction === 'up' ? -1 : 1;
  const result = await db.execute<{ found: boolean }>(sql`
    with locked as (
      select id, sort_order, created_at from ${table} where ${scope} for update
    ),
    ranked as (
      select id, row_number() over (order by sort_order, created_at, id)::integer as pos
      from locked
    ),
    target as (
      select pos, pos + ${delta}::integer as new_pos from ranked where id = ${id}
    ),
    renumbered as (
      select r.id,
        case
          when r.id = ${id} then t.new_pos
          when r.pos = t.new_pos then t.pos
          else r.pos
        end as pos
      from ranked r cross join target t
      where exists (select 1 from ranked n where n.pos = t.new_pos)
    ),
    moved as (
      update ${table} set sort_order = renumbered.pos, updated_at = now()
      from renumbered
      where ${table}.id = renumbered.id
      returning ${table}.id
    )
    select exists (select 1 from target) as found
  `);
  return result.rows[0]?.found === true;
}
