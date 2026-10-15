import 'server-only';
import { CredentialsSignin } from 'next-auth';
import {
  clearLoginFailures,
  findPasswordUserByEmail,
  recordLoginFailure,
} from '@/db/credentials';
import { hashPassword, verifyPassword } from '@/lib/password';
import { signInSchema } from '@/lib/validation/credentials';

export const MAX_LOGIN_FAILURES = 5;

export class RateLimitedSignin extends CredentialsSignin {
  code = 'rate_limited';
}

export type AuthorizedUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

let dummyHash: Promise<string> | undefined;

function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword(crypto.randomUUID());
  return dummyHash;
}

export async function authorizeCredentials(
  credentials: Partial<Record<string, unknown>>,
): Promise<AuthorizedUser | null> {
  const parsed = signInSchema.safeParse(credentials);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;

  // Reserve a slot first (atomic upsert). Parallel attempts serialize on the row lock.
  // Fail-closed when the window already exceeds the max.
  const failures = await recordLoginFailure(email);
  if (failures > MAX_LOGIN_FAILURES) {
    throw new RateLimitedSignin();
  }

  const user = await findPasswordUserByEmail(email);
  const matches = await verifyPassword(
    password,
    user?.passwordHash ?? (await getDummyHash()),
  );

  if (!user?.passwordHash || !matches) {
    return null;
  }

  await clearLoginFailures(email);
  return { id: user.id, name: user.name, email: user.email, image: user.image };
}
