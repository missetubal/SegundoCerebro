import { describe, expect, it } from 'vitest';
import { signedUrlDeadline } from './blob-store';

describe('blob store expiry', () => {
  it('caps the signed url at 15 minutes', () => {
    const now = 1_700_000_000_000;
    expect(signedUrlDeadline(now) - now).toBe(15 * 60 * 1000);
    expect(signedUrlDeadline(now) - now).toBeLessThanOrEqual(900_000);
  });
});
