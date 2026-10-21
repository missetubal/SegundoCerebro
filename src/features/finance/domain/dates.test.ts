import { describe, expect, it } from 'vitest';
import { nextDueDate } from './dates';

describe('next due date', () => {
  it('uses the last day of a short month', () => {
    expect(nextDueDate(31, '2026-02-01')).toBe('2026-02-28');
  });

  it('moves to the next month after the due day', () => {
    expect(nextDueDate(10, '2026-04-15')).toBe('2026-05-10');
  });
});
