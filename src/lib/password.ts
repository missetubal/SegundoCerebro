import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

type ScryptParams = { N: number; r: number; p: number };

const DEFAULT_PARAMS: ScryptParams = { N: 2 ** 15, r: 8, p: 1 };
const SALT_BYTES = 16;
const KEY_BYTES = 64;

function derive(
  password: string,
  salt: Buffer,
  keyLength: number,
  { N, r, p }: ScryptParams,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      keyLength,
      { N, r, p, maxmem: 256 * N * r },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(password, salt, KEY_BYTES, DEFAULT_PARAMS);
  const { N, r, p } = DEFAULT_PARAMS;
  return [
    'scrypt',
    N,
    r,
    p,
    salt.toString('base64'),
    key.toString('base64'),
  ].join('$');
}

function parseHash(stored: string) {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return null;

  const [N, r, p] = parts.slice(1, 4).map(Number);
  if (![N, r, p].every((value) => Number.isSafeInteger(value) && value > 0)) {
    return null;
  }

  const salt = Buffer.from(parts[4], 'base64');
  const key = Buffer.from(parts[5], 'base64');
  if (salt.length === 0 || key.length === 0) return null;

  return { params: { N, r, p }, salt, key };
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parsed = parseHash(stored);
  if (!parsed) return false;

  try {
    const key = await derive(
      password,
      parsed.salt,
      parsed.key.length,
      parsed.params,
    );
    return timingSafeEqual(key, parsed.key);
  } catch {
    return false;
  }
}
