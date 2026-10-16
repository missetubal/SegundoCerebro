import 'server-only';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/shared/db';
import { rateLimits } from '@/shared/db';

export type RateLimit = {
  key: string;
  max: number;
  windowMinutes: number;
};

const RETENTION_HOURS = 24;

function consume({ key, windowMinutes }: RateLimit) {
  const windowOpen = sql`${rateLimits.windowStartedAt} > now() - make_interval(mins => ${windowMinutes})`;
  return db
    .insert(rateLimits)
    .values({ key, count: 1, windowStartedAt: sql`now()` })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE WHEN ${windowOpen} THEN ${rateLimits.count} + 1 ELSE 1 END`,
        windowStartedAt: sql`CASE WHEN ${windowOpen} THEN ${rateLimits.windowStartedAt} ELSE now() END`,
      },
    })
    .returning({ count: rateLimits.count });
}

/**
 * Counts one attempt against every limit (atomic upsert per key, in a single
 * round trip that also purges stale rows). Returns false when any limit is
 * already over its max inside its window.
 */
export async function consumeRateLimits(limits: RateLimit[]): Promise<boolean> {
  const [, ...results] = await db.batch([
    db
      .delete(rateLimits)
      .where(
        sql`${rateLimits.windowStartedAt} < now() - make_interval(hours => ${RETENTION_HOURS})`,
      ),
    ...limits.map(consume),
  ]);
  return results.every(([row], index) => (row?.count ?? 0) <= limits[index].max);
}

export async function resetRateLimit(key: string): Promise<void> {
  await db.delete(rateLimits).where(eq(rateLimits.key, key));
}
