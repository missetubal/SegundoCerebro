import { inArray } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';

export function createUserFixtures() {
  const createdIds: string[] = [];

  return {
    async createUser(): Promise<string> {
      const id = `test-${crypto.randomUUID()}`;
      await db.insert(users).values({ id, email: `${id}@test.local` });
      createdIds.push(id);
      return id;
    },
    track(id: string): void {
      createdIds.push(id);
    },
    async cleanup(): Promise<void> {
      if (createdIds.length === 0) return;
      await db.delete(users).where(inArray(users.id, createdIds));
    },
  };
}
