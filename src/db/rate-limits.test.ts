import { eq, like } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';
import { db } from '@/db';
import { rateLimits } from '@/db/schema';
import { consumeRateLimits, type RateLimit, resetRateLimit } from './rate-limits';

const prefix = `test:${crypto.randomUUID()}`;

afterAll(async () => {
  await db.delete(rateLimits).where(like(rateLimits.key, `${prefix}%`));
});

function uniqueLimit(max = 3, windowMinutes = 15): RateLimit {
  return { key: `${prefix}:${crypto.randomUUID()}`, max, windowMinutes };
}

async function countOf(key: string) {
  const [row] = await db.select().from(rateLimits).where(eq(rateLimits.key, key));
  return row?.count ?? 0;
}

describe('consumeRateLimits', () => {
  it('allows attempts up to the max and refuses the next one', async () => {
    const limit = uniqueLimit(2);

    await expect(consumeRateLimits([limit])).resolves.toBe(true);
    await expect(consumeRateLimits([limit])).resolves.toBe(true);
    await expect(consumeRateLimits([limit])).resolves.toBe(false);
    expect(await countOf(limit.key)).toBe(3);
  });

  it('refuses when any of the limits is exceeded and counts all of them', async () => {
    const tight = uniqueLimit(1);
    const loose = uniqueLimit(10);

    await expect(consumeRateLimits([tight, loose])).resolves.toBe(true);
    await expect(consumeRateLimits([tight, loose])).resolves.toBe(false);
    expect(await countOf(loose.key)).toBe(2);
  });

  it('keeps keys independent', async () => {
    const blocked = uniqueLimit(1);
    const other = uniqueLimit(1);
    await consumeRateLimits([blocked]);
    await consumeRateLimits([blocked]);

    await expect(consumeRateLimits([other])).resolves.toBe(true);
  });

  it('starts a new window when the previous one expired', async () => {
    const limit = uniqueLimit(1, 15);
    await db.insert(rateLimits).values({
      key: limit.key,
      count: 5,
      windowStartedAt: new Date(Date.now() - 16 * 60 * 1000),
    });

    await expect(consumeRateLimits([limit])).resolves.toBe(true);
    expect(await countOf(limit.key)).toBe(1);
  });

  it('purges rows older than a day', async () => {
    const stale = uniqueLimit();
    await db.insert(rateLimits).values({
      key: stale.key,
      count: 1,
      windowStartedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
    });

    await consumeRateLimits([uniqueLimit()]);

    expect(await countOf(stale.key)).toBe(0);
  });
});

describe('resetRateLimit', () => {
  it('clears the counter for that key', async () => {
    const limit = uniqueLimit(1);
    await consumeRateLimits([limit]);
    await consumeRateLimits([limit]);

    await resetRateLimit(limit.key);

    await expect(consumeRateLimits([limit])).resolves.toBe(true);
  });
});
