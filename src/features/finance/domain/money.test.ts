import { describe, expect, it } from 'vitest';
import { addMinor, parseAmountToMinor } from './money';

describe('money', () => {
  it('adds ten and twenty cents as integers', () => {
    const ten = parseAmountToMinor('0,10');
    const twenty = parseAmountToMinor('0.20');
    expect(ten).toBe(10n);
    expect(twenty).toBe(20n);
    expect(addMinor(ten!, twenty!)).toBe(30n);
    expect(typeof addMinor(ten!, twenty!)).toBe('bigint');
  });

  it('rejects amounts that are not exact cents', () => {
    expect(parseAmountToMinor('0,001')).toBeNull();
    expect(parseAmountToMinor('10.555')).toBeNull();
    expect(parseAmountToMinor('abc')).toBeNull();
  });
});
