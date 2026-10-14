import 'server-only';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { userPreferences } from '@/db/schema';

export type Preferences = typeof userPreferences.$inferSelect;

export async function getPreferences(userId: string): Promise<Preferences> {
  await db
    .insert(userPreferences)
    .values({ userId })
    .onConflictDoNothing({ target: userPreferences.userId });

  const [preferences] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId));
  return preferences;
}

export async function updateTimezone(
  userId: string,
  timezone: string,
): Promise<Preferences> {
  const [preferences] = await db
    .insert(userPreferences)
    .values({ userId, timezone })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { timezone, updatedAt: sql`now()` },
    })
    .returning();
  return preferences;
}
