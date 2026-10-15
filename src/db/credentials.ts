import 'server-only';
import { and, count, eq, gt, lt, sql } from 'drizzle-orm';
import { db } from '@/db';
import { isUniqueViolation } from '@/db/errors';
import { loginFailures, userPasswords, users } from '@/db/schema';

export const LOGIN_FAILURE_WINDOW_MINUTES = 15;

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
  try {
    await db.batch([
      db.insert(users).values({ id: userId, name: input.name, email: input.email }),
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
    .where(eq(sql`lower(${users.email})`, email.toLowerCase()))
    .limit(1);
  if (!row?.email) return null;
  return { ...row, email: row.email };
}

export async function countRecentLoginFailures(email: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(loginFailures)
    .where(
      and(
        eq(loginFailures.email, email),
        gt(
          loginFailures.createdAt,
          sql`now() - make_interval(mins => ${LOGIN_FAILURE_WINDOW_MINUTES})`,
        ),
      ),
    );
  return row?.total ?? 0;
}

export async function recordLoginFailure(email: string): Promise<void> {
  await db.batch([
    db.insert(loginFailures).values({ email }),
    db
      .delete(loginFailures)
      .where(lt(loginFailures.createdAt, sql`now() - interval '1 day'`)),
  ]);
}
