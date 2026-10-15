import 'server-only';
import { eq, sql } from 'drizzle-orm';
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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

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

export async function countRecentLoginFailures(email: string): Promise<number> {
  const normalized = normalizeEmail(email);
  const [row] = await db
    .select({
      failureCount: loginFailures.failureCount,
      windowStartedAt: loginFailures.windowStartedAt,
    })
    .from(loginFailures)
    .where(eq(loginFailures.email, normalized))
    .limit(1);

  if (!row) return 0;

  const windowMs = LOGIN_FAILURE_WINDOW_MINUTES * 60 * 1000;
  if (row.windowStartedAt.getTime() <= Date.now() - windowMs) return 0;
  return row.failureCount;
}

/**
 * Atomically increments the failure counter for this email (row lock on upsert).
 * Returns the failure count inside the current window after the increment.
 */
export async function recordLoginFailure(email: string): Promise<number> {
  const normalized = normalizeEmail(email);
  const [row] = await db
    .insert(loginFailures)
    .values({
      email: normalized,
      failureCount: 1,
      windowStartedAt: sql`now()`,
    })
    .onConflictDoUpdate({
      target: loginFailures.email,
      set: {
        failureCount: sql`CASE
          WHEN ${loginFailures.windowStartedAt} > now() - make_interval(mins => ${LOGIN_FAILURE_WINDOW_MINUTES})
          THEN ${loginFailures.failureCount} + 1
          ELSE 1
        END`,
        windowStartedAt: sql`CASE
          WHEN ${loginFailures.windowStartedAt} > now() - make_interval(mins => ${LOGIN_FAILURE_WINDOW_MINUTES})
          THEN ${loginFailures.windowStartedAt}
          ELSE now()
        END`,
      },
    })
    .returning({ failureCount: loginFailures.failureCount });

  return row?.failureCount ?? 0;
}

export async function clearLoginFailures(email: string): Promise<void> {
  await db
    .delete(loginFailures)
    .where(eq(loginFailures.email, normalizeEmail(email)));
}
