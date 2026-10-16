import 'server-only';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/shared/db';
import { isUniqueViolation } from '@/shared/db';
import { userPasswords, users } from '@/shared/db';
import { normalizeEmail } from '@/shared/lib';

export type PasswordUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  passwordHash: string | null;
};

export type CreatePasswordUserResult =
  | { status: 'created'; userId: string }
  | { status: 'email_taken' };

export async function createPasswordUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<CreatePasswordUserResult> {
  const userId = crypto.randomUUID();
  const email = normalizeEmail(input.email);
  try {
    await db.batch([
      db.insert(users).values({ id: userId, name: input.name, email }),
      db
        .insert(userPasswords)
        .values({ userId, passwordHash: input.passwordHash }),
    ]);
  } catch (error) {
    if (isUniqueViolation(error)) return { status: 'email_taken' };
    throw error;
  }
  return { status: 'created', userId };
}

export async function findPasswordUserByEmail(
  email: string,
): Promise<PasswordUser | null> {
  const normalized = normalizeEmail(email);
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      passwordHash: userPasswords.passwordHash,
    })
    .from(users)
    .leftJoin(userPasswords, eq(userPasswords.userId, users.id))
    .where(eq(sql`lower(${users.email})`, normalized))
    .limit(1);
  if (!row?.email) return null;
  return { ...row, email: row.email };
}
