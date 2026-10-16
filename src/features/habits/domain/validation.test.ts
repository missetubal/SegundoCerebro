import { describe, expect, it } from 'vitest';
import {
  habitInputSchema,
  isHabitDueOnIsoWeekday,
  parseFrequencyKind,
  parseTrackingType,
} from './validation';

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

describe('parseTrackingType and parseFrequencyKind', () => {
  it('accepts known values and falls back for unknown', () => {
    expect(parseTrackingType('quantity')).toBe('quantity');
    expect(parseTrackingType('nope')).toBe('completion');
    expect(parseFrequencyKind('weekdays')).toBe('weekdays');
    expect(parseFrequencyKind(null)).toBe('daily');
  });
});

describe('isHabitDueOnIsoWeekday', () => {
  it('includes daily habits every day', () => {
    expect(
      isHabitDueOnIsoWeekday(
        { frequencyKind: 'daily', weekdays: null },
        5,
      ),
    ).toBe(true);
  });

  it('matches weekday habits only on listed ISO days', () => {
    const habit = { frequencyKind: 'weekdays', weekdays: [1, 3] };
    expect(isHabitDueOnIsoWeekday(habit, 1)).toBe(true);
    expect(isHabitDueOnIsoWeekday(habit, 2)).toBe(false);
  });
});
