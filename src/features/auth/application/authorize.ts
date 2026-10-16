import 'server-only';
import { CredentialsSignin } from 'next-auth';
import { findPasswordUserByEmail } from '../infra/credentials';
import { consumeRateLimits, resetRateLimit } from '@/shared/db';
import { clientIp } from '@/shared/lib/client-ip';
import { hashPassword, verifyPassword } from '@/shared/lib/password';
import { loginAccountLimit, loginIpLimit } from '@/shared/lib/rate-limit-policies';
import { signInSchema } from '../domain';

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
  request?: Request,
): Promise<AuthorizedUser | null> {
  const parsed = signInSchema.safeParse(credentials);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;
  const ip = clientIp(request?.headers ?? new Headers());
  const accountLimit = loginAccountLimit(email, ip);

  // Reserve a slot first (atomic upsert). Parallel attempts serialize on the row lock.
  // Fail-closed when the window already exceeds the max.
  const allowed = await consumeRateLimits([accountLimit, loginIpLimit(ip)]);
  if (!allowed) {
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

  await resetRateLimit(accountLimit.key);
  return { id: user.id, name: user.name, email: user.email, image: user.image };
}
