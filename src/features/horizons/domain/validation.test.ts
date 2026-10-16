import { describe, expect, it } from 'vitest';
import { horizonNameSchema } from './validation';

describe('horizonNameSchema', () => {
  it('trims the name', () => {
    expect(horizonNameSchema.parse('  Este trimestre ')).toBe('Este trimestre');
  });

  it('rejects blank or missing names', () => {
    expect(horizonNameSchema.safeParse('  ').success).toBe(false);
    expect(horizonNameSchema.safeParse(null).success).toBe(false);
  });

  it('enforces the 40 character limit', () => {
    expect(horizonNameSchema.safeParse('a'.repeat(40)).success).toBe(true);
    expect(horizonNameSchema.safeParse('a'.repeat(41)).success).toBe(false);
  });
});
