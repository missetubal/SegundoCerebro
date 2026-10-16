import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('hashPassword / verifyPassword', () => {
  it('accepts the right password and rejects a wrong one', async () => {
    const hash = await hashPassword('correct horse battery');

    await expect(verifyPassword('correct horse battery', hash)).resolves.toBe(
      true,
    );
    await expect(verifyPassword('correct horse batterY', hash)).resolves.toBe(
      false,
    );
  });

  it('never contains the plain password and uses a fresh salt each time', async () => {
    const first = await hashPassword('correct horse battery');
    const second = await hashPassword('correct horse battery');

    expect(first).not.toContain('correct horse battery');
    expect(first).not.toBe(second);
    expect(first).toMatch(/^scrypt\$32768\$8\$1\$[^$]+\$[^$]+$/);
  });

  it.each([
    '',
    'not-a-hash',
    'bcrypt$32768$8$1$c2FsdA==$a2V5',
    'scrypt$abc$8$1$c2FsdA==$a2V5',
    'scrypt$32768$8$1$$a2V5',
    'scrypt$32768$8$1$c2FsdA==',
    // Caps: N/r/p or keylen above DEFAULT_PARAMS must not run scrypt
    'scrypt$65536$8$1$c2FsdA==$a2V5',
    'scrypt$32768$16$1$c2FsdA==$a2V5',
    'scrypt$32768$8$2$c2FsdA==$a2V5',
    `scrypt$32768$8$1$c2FsdA==$${Buffer.alloc(65).toString('base64')}`,
  ])('returns false for a malformed hash %j', async (stored) => {
    await expect(verifyPassword('anything', stored)).resolves.toBe(false);
  });
});
