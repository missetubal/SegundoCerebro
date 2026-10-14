import { type AnyColumn, type SQL, sql } from 'drizzle-orm';

export type MoveDirection = 'up' | 'down';

export function moveInOrder(
  ids: readonly string[],
  id: string,
  direction: MoveDirection,
): string[] | null {
  const index = ids.indexOf(id);
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= ids.length) return null;

  const reordered = [...ids];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  return reordered;
}

export function sortOrderCase(idColumn: AnyColumn, ids: readonly string[]): SQL {
  const branches = ids.map(
    (id, index) => sql`when ${id} then ${index + 1}::integer`,
  );
  return sql`case ${idColumn} ${sql.join(branches, sql` `)} end`;
}
