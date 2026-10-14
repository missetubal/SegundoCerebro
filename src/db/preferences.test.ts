import { eq } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';
import { db } from '@/db';
import { userPreferences } from '@/db/schema';
import { createUserFixtures } from '@/test/fixtures';
import { getPreferences, updateTimezone } from './preferences';

const fixtures = createUserFixtures();
afterAll(() => fixtures.cleanup());

function countRows(userId: string) {
  return db.$count(userPreferences, eq(userPreferences.userId, userId));
}

describe('getPreferences', () => {
  it('creates default preferences on first access', async () => {
    const userId = await fixtures.createUser();

    const preferences = await getPreferences(userId);

    expect(preferences.userId).toBe(userId);
    expect(preferences.timezone).toBe('America/Sao_Paulo');
    expect(preferences.journalTemplate).toBe('minimal');
  });

  it('does not duplicate rows on concurrent access', async () => {
    const userId = await fixtures.createUser();

    await Promise.all([
      getPreferences(userId),
      getPreferences(userId),
      getPreferences(userId),
    ]);

    expect(await countRows(userId)).toBe(1);
  });
});

describe('updateTimezone', () => {
  it('updates timezone and updated_at', async () => {
    const userId = await fixtures.createUser();
    const before = await getPreferences(userId);

    const after = await updateTimezone(userId, 'Europe/Lisbon');

    expect(after.timezone).toBe('Europe/Lisbon');
    expect(after.updatedAt.getTime()).toBeGreaterThanOrEqual(
      before.updatedAt.getTime(),
    );
    expect((await getPreferences(userId)).timezone).toBe('Europe/Lisbon');
  });
});

describe('isolation between users', () => {
  it('reads and writes by A never touch B', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    await updateTimezone(userA, 'Europe/Lisbon');
    await updateTimezone(userB, 'Asia/Tokyo');

    const preferencesA = await getPreferences(userA);
    expect(preferencesA.userId).toBe(userA);
    expect(preferencesA.timezone).toBe('Europe/Lisbon');

    await updateTimezone(userA, 'America/New_York');

    const preferencesB = await getPreferences(userB);
    expect(preferencesB.timezone).toBe('Asia/Tokyo');
  });
});
