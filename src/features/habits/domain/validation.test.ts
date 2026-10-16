import { describe, expect, it } from 'vitest';
import { habitInputSchema } from './validation';

describe('habitInputSchema', () => {
  it('accepts a completion habit like Meditar', () => {
    expect(
      habitInputSchema.parse({
        name: '  Meditar  ',
        trackingType: 'completion',
        frequencyKind: 'daily',
        areaIds: ['area-1'],
      }),
    ).toEqual({
      name: 'Meditar',
      trackingType: 'completion',
      frequencyKind: 'daily',
      weekdays: null,
      targetValue: null,
      unit: null,
      areaIds: ['area-1'],
    });
  });

  it('accepts a quantity habit like Água', () => {
    expect(
      habitInputSchema.parse({
        name: 'Água',
        trackingType: 'quantity',
        frequencyKind: 'daily',
        targetValue: '2000',
        unit: 'ml',
        areaIds: ['area-1', 'area-2'],
      }),
    ).toEqual({
      name: 'Água',
      trackingType: 'quantity',
      frequencyKind: 'daily',
      weekdays: null,
      targetValue: 2000,
      unit: 'ml',
      areaIds: ['area-1', 'area-2'],
    });
  });

  it('rejects quantity without a unit', () => {
    const result = habitInputSchema.safeParse({
      name: 'Água',
      trackingType: 'quantity',
      frequencyKind: 'daily',
      targetValue: '2000',
      areaIds: ['area-1'],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.message === 'Informe a unidade.')).toBe(
      true,
    );
  });

  it('rejects completion with a target', () => {
    const result = habitInputSchema.safeParse({
      name: 'Meditar',
      trackingType: 'completion',
      frequencyKind: 'daily',
      targetValue: '10',
      areaIds: ['area-1'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects weekdays frequency with no days', () => {
    const result = habitInputSchema.safeParse({
      name: 'Treinar',
      trackingType: 'completion',
      frequencyKind: 'weekdays',
      weekdays: [],
      areaIds: ['area-1'],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      'Escolha ao menos um dia da semana.',
    );
  });

  it('rejects a habit without areas', () => {
    const result = habitInputSchema.safeParse({
      name: 'Meditar',
      trackingType: 'completion',
      frequencyKind: 'daily',
      areaIds: [],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      'Escolha ao menos uma área.',
    );
  });

  it('rejects a blank name', () => {
    const result = habitInputSchema.safeParse({
      name: '   ',
      trackingType: 'completion',
      frequencyKind: 'daily',
      areaIds: ['area-1'],
    });
    expect(result.success).toBe(false);
  });
});
