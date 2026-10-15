import 'server-only';
import { eq, sql } from 'drizzle-orm';
import type { Adapter, AdapterUser } from 'next-auth/adapters';
import { db } from '@/db';
import { users } from '@/db/schema';
import { normalizeEmail } from '@/lib/email';

/** Store and look up emails in lowercase so Google + Credentials share one identity. */
export function withNormalizedEmails(adapter: Adapter): Adapter {
  return {
    ...adapter,
    async createUser(data) {
      const email =
        typeof data.email === 'string' ? normalizeEmail(data.email) : data.email;
      return adapter.createUser!({ ...data, email });
    },
    async updateUser(data) {
      const email =
        typeof data.email === 'string' ? normalizeEmail(data.email) : data.email;
      return adapter.updateUser!({ ...data, email });
    },
    async getUserByEmail(email) {
      const normalized = normalizeEmail(email);
      const [row] = await db
        .select()
        .from(users)
        .where(eq(sql`lower(${users.email})`, normalized))
        .limit(1);
      return (row as AdapterUser | undefined) ?? null;
    },
  };
}
