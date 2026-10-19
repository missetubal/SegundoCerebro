import { z } from 'zod';

export const NOTE_MAX = 2000;
export const RANGE_MAX_DAYS = 366;

const DAY_MS = 86_400_000;

export function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

export function inclusiveCalendarDays(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  return Math.round((end - start) / DAY_MS) + 1;
}

export const entryDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.')
  .refine(isCalendarDate, 'Data inválida.');

const noteSchema = z
  .string()
  .trim()
  .max(NOTE_MAX, 'A nota passou do limite.');

const moodSchema = z.union(
  [
    z.null(),
    z
      .number('Informe um humor de 1 a 5.')
      .int('Informe um humor de 1 a 5.')
      .min(1, 'Informe um humor de 1 a 5.')
      .max(5, 'Informe um humor de 1 a 5.'),
  ],
  { error: 'Informe um humor de 1 a 5.' },
);

const habitIdSchema = z.string().trim().min(1, 'Hábito inválido.');

const completionLogSchema = z
  .object({
    habitId: habitIdSchema,
    completionStatus: z.enum(['done', 'not_done'], {
      error: 'Situação do hábito inválida.',
    }),
  })
  .strict();

const quantityLogSchema = z
  .object({
    habitId: habitIdSchema,
    value: z
      .number('Informe um número.')
      .int('Informe um número inteiro.')
      .nonnegative('Informe um número a partir de zero.'),
  })
  .strict();

const clearLogSchema = z
  .object({
    habitId: habitIdSchema,
    clear: z.literal(true),
  })
  .strict();

export const checkInPutSchema = z
  .object({
    generalNote: noteSchema
      .nullable()
      .optional()
      .transform((value) => (value == null || value === '' ? null : value)),
    mood: moodSchema.optional().transform((value) => value ?? null),
    habitLogs: z
      .array(z.union([clearLogSchema, completionLogSchema, quantityLogSchema]))
      .optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.habitLogs) return;
    const seen = new Set<string>();
    for (const [index, log] of value.habitLogs.entries()) {
      if (seen.has(log.habitId)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Hábito repetido no mesmo dia.',
          path: ['habitLogs', index, 'habitId'],
        });
      }
      seen.add(log.habitId);
    }
  });

export const checkInRangeSchema = z
  .object({
    from: entryDateSchema,
    to: entryDateSchema,
  })
  .superRefine((value, ctx) => {
    if (value.from > value.to) {
      ctx.addIssue({
        code: 'custom',
        message: 'O intervalo está invertido.',
        path: ['from'],
      });
      return;
    }
    if (inclusiveCalendarDays(value.from, value.to) > RANGE_MAX_DAYS) {
      ctx.addIssue({
        code: 'custom',
        message: 'O intervalo passou de 366 dias.',
        path: ['to'],
      });
    }
  });

export type CheckInPut = z.output<typeof checkInPutSchema>;
export type CheckInHabitLog = NonNullable<CheckInPut['habitLogs']>[number];

export type CheckInFailureReason =
  | 'invalid_habit'
  | 'not_applicable'
  | 'invalid_log';

export function checkInFailureMessage(reason: CheckInFailureReason): string {
  if (reason === 'not_applicable') {
    return 'Esse hábito não se aplica a essa data.';
  }
  if (reason === 'invalid_log') return 'Revise os campos do hábito.';
  return 'Esse hábito não está disponível.';
}
