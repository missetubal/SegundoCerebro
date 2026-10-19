import { describe, expect, it } from 'vitest';
import { checkInPutSchema, checkInRangeSchema } from './validation';

const valid = {
  generalNote: 'Avancei no projeto',
  mood: 3,
};

describe('checkInPutSchema', () => {
  it('accepts a partial check-in and blanks the note', () => {
    const parsed = checkInPutSchema.parse({
      generalNote: '   ',
      mood: 4,
    });
    expect(parsed).toEqual({ generalNote: null, mood: 4 });
  });

  it('rejects mood outside 1–5 without returning data', () => {
    for (const mood of [0, 6]) {
      const result = checkInPutSchema.safeParse({ ...valid, mood });
      expect(result.success).toBe(false);
    }
  });

  it('rejects a note over 2000 characters', () => {
    const result = checkInPutSchema.safeParse({
      generalNote: 'a'.repeat(2001),
      mood: null,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('A nota passou do limite.');
    }
  });

  it('rejects detailed fields and a client userId', () => {
    for (const extra of [
      { gratitude: 'obrigado' },
      { learnings: 'algo' },
      { freeReflection: 'texto' },
      { userId: 'someone-else' },
    ]) {
      const result = checkInPutSchema.safeParse({ ...valid, ...extra });
      expect(result.success).toBe(false);
    }
  });

  it('accepts one log per habit and rejects a repeated habit', () => {
    expect(
      checkInPutSchema.parse({
        mood: null,
        habitLogs: [
          { habitId: 'h1', completionStatus: 'done' },
          { habitId: 'h2', value: 0 },
          { habitId: 'h3', clear: true },
        ],
      }).habitLogs,
    ).toHaveLength(3);

    const repeated = checkInPutSchema.safeParse({
      mood: null,
      habitLogs: [
        { habitId: 'h1', completionStatus: 'done' },
        { habitId: 'h1', clear: true },
      ],
    });
    expect(repeated.success).toBe(false);
  });
});

describe('checkInRangeSchema', () => {
  it('rejects an inverted range and a span over 366 days', () => {
    expect(
      checkInRangeSchema.safeParse({ from: '2026-10-03', to: '2026-10-01' })
        .success,
    ).toBe(false);
    expect(
      checkInRangeSchema.safeParse({ from: '2026-01-01', to: '2027-01-02' })
        .success,
    ).toBe(false);
    expect(
      checkInRangeSchema.safeParse({ from: '2026-01-01', to: '2026-01-01' })
        .success,
    ).toBe(true);
  });
});
