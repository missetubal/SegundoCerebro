import 'server-only';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { userPreferences } from '@/db/schema';

export type Preferences = typeof userPreferences.$inferSelect;

async function findPreferences(userId: string): Promise<Preferences | null> {
  const [preferences] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId));
  return preferences ?? null;
}

export async function getPreferences(userId: string): Promise<Preferences> {
  const existing = await findPreferences(userId);
  if (existing) return existing;

  const [created] = await db
    .insert(userPreferences)
    .values({ userId })
    .onConflictDoNothing({ target: userPreferences.userId })
    .returning();
  const preferences = created ?? (await findPreferences(userId));
  if (!preferences) {
    throw new Error(`Preferences not found for user ${userId}`);
  }
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
