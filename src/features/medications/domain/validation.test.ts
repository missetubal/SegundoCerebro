import { describe, expect, it } from 'vitest';
import { medicationDayPutSchema, medicationWriteSchema } from './validation';

const valid = {
  name: 'Losartana',
  instructions: null,
  frequencyKind: 'daily' as const,
  weekdays: null,
  times: ['08:00'],
};

describe('medicationWriteSchema', () => {
  it('trims the name and blanks instructions', () => {
    const parsed = medicationWriteSchema.parse({
      ...valid,
      name: '  Losartana  ',
      instructions: '   ',
    });
    expect(parsed.name).toBe('Losartana');
    expect(parsed.instructions).toBeNull();
    expect(parsed.startsOn).toBeUndefined();
  });

  it('rejects a blank name, a seventh time, a repeated time, and empty weekdays', () => {
    expect(
      medicationWriteSchema.safeParse({ ...valid, name: '   ' }).success,
    ).toBe(false);
    expect(
      medicationWriteSchema.safeParse({
        ...valid,
        times: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'],
      }).success,
    ).toBe(false);
    expect(
      medicationWriteSchema.safeParse({
        ...valid,
        times: ['08:00', '08:00'],
      }).success,
    ).toBe(false);
    expect(
      medicationWriteSchema.safeParse({
        ...valid,
        frequencyKind: 'weekdays',
        weekdays: [],
      }).success,
    ).toBe(false);
  });

  it('rejects dose fields and a client userId without partial data', () => {
    for (const extra of [
      { doseAmount: 1 },
      { doseUnit: 'mg' },
      { prescribedDose: '1 cp' },
      { userId: 'someone-else' },
    ]) {
      const result = medicationWriteSchema.safeParse({ ...valid, ...extra });
      expect(result.success).toBe(false);
      expect('data' in result).toBe(false);
    }
  });
});

describe('medicationDayPutSchema', () => {
  it('accepts done, not_done, and pending', () => {
    const parsed = medicationDayPutSchema.parse({
      logs: [
        { medicationId: 'med-1', scheduledTime: '08:00', status: 'done' },
        { medicationId: 'med-1', scheduledTime: '20:00', status: 'pending' },
      ],
    });
    expect(parsed.logs).toHaveLength(2);
  });

  it('rejects an unknown status and a repeated occurrence', () => {
    expect(
      medicationDayPutSchema.safeParse({
        logs: [
          { medicationId: 'med-1', scheduledTime: '08:00', status: 'skipped' },
        ],
      }).success,
    ).toBe(false);
    expect(
      medicationDayPutSchema.safeParse({
        logs: [
          { medicationId: 'med-1', scheduledTime: '08:00', status: 'done' },
          { medicationId: 'med-1', scheduledTime: '08:00', status: 'pending' },
        ],
      }).success,
    ).toBe(false);
  });
});
