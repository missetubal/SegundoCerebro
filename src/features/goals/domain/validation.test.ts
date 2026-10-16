import { describe, expect, it } from 'vitest';
import { goalInputSchema, nextStepInputSchema } from './validation';

describe('goalInputSchema', () => {
  const valid = {
    title: 'Correr 5 km',
    primaryAreaId: 'area-1',
    horizonId: 'horizon-1',
    status: 'active',
  };

  it('trims the title and accepts optional empty dates as null', () => {
    expect(
      goalInputSchema.parse({
        ...valid,
        title: '  Correr 5 km  ',
        startDate: '',
        targetDate: '',
      }),
    ).toEqual({
      ...valid,
      title: 'Correr 5 km',
      startDate: null,
      targetDate: null,
    });
  });

  it('rejects a blank title', () => {
    const result = goalInputSchema.safeParse({ ...valid, title: '   ' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Dê um título à meta.');
  });

  it('enforces the title length limit', () => {
    expect(
      goalInputSchema.safeParse({ ...valid, title: 'a'.repeat(120) }).success,
    ).toBe(true);
    expect(
      goalInputSchema.safeParse({ ...valid, title: 'a'.repeat(121) }).success,
    ).toBe(false);
  });

  it('rejects inverted dates', () => {
    const result = goalInputSchema.safeParse({
      ...valid,
      startDate: '2026-10-20',
      targetDate: '2026-10-10',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      'A data-alvo não pode ser anterior à data de início.',
    );
  });

  it('rejects an invalid status', () => {
    const result = goalInputSchema.safeParse({ ...valid, status: 'paused' });
    expect(result.success).toBe(false);
  });
});

describe('nextStepInputSchema', () => {
  it('trims the title', () => {
    expect(nextStepInputSchema.parse({ title: '  Comprar tênis  ' })).toEqual({
      title: 'Comprar tênis',
    });
  });

  it('rejects a blank title', () => {
    const result = nextStepInputSchema.safeParse({ title: '  ' });
    expect(result.success).toBe(false);
  });

  it('enforces the title length limit', () => {
    expect(
      nextStepInputSchema.safeParse({ title: 'a'.repeat(121) }).success,
    ).toBe(false);
  });
});
