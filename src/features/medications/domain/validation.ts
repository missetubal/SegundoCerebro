import { z } from 'zod';

export const MEDICATION_NAME_MAX = 80;
export const INSTRUCTIONS_MAX = 2000;
export const TIMES_MAX = 6;
export const RANGE_MAX_DAYS = 366;

export const FREQUENCY_KINDS = ['daily', 'weekdays'] as const;
export type FrequencyKind = (typeof FREQUENCY_KINDS)[number];

/** ISO weekdays: 1 = Monday … 7 = Sunday */
export const ISO_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export type IsoWeekday = (typeof ISO_WEEKDAYS)[number];

export const LOG_STATUSES = ['done', 'not_done', 'pending'] as const;
export type LogStatus = (typeof LOG_STATUSES)[number];

const DAY_MS = 86_400_000;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

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

const timeSchema = z
  .string()
  .regex(TIME_PATTERN, 'Informe um horário no formato HH:mm.');

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
}

export const medicationWriteSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Dê um nome ao medicamento.')
      .max(
        MEDICATION_NAME_MAX,
        `Use até ${MEDICATION_NAME_MAX} caracteres no nome.`,
      ),
    instructions: z
      .union([z.string().trim().max(INSTRUCTIONS_MAX, 'As anotações passaram do limite.'), z.null()])
      .optional()
      .transform((value) => (value == null || value === '' ? null : value)),
    frequencyKind: z.enum(FREQUENCY_KINDS, {
      error: 'Escolha uma frequência.',
    }),
    weekdays: z.array(z.number()).nullable(),
    times: z
      .array(timeSchema)
      .min(1, 'Informe ao menos um horário.')
      .max(TIMES_MAX, `Use até ${TIMES_MAX} horários.`),
    startsOn: entryDateSchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (uniqueSorted(value.times).length !== value.times.length) {
      ctx.addIssue({
        code: 'custom',
        message: 'Horário repetido.',
        path: ['times'],
      });
    }
    if (value.frequencyKind === 'daily') {
      if (value.weekdays !== null && value.weekdays.length > 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Frequência diária não usa dias da semana.',
          path: ['weekdays'],
        });
      }
      return;
    }
    if (value.weekdays === null || value.weekdays.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Escolha ao menos um dia da semana.',
        path: ['weekdays'],
      });
      return;
    }
    for (const day of value.weekdays) {
      if (!ISO_WEEKDAYS.includes(day as IsoWeekday)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Dia da semana inválido.',
          path: ['weekdays'],
        });
        break;
      }
    }
  })
  .transform((value) => ({
    name: value.name,
    instructions: value.instructions,
    frequencyKind: value.frequencyKind,
    weekdays:
      value.frequencyKind === 'daily'
        ? null
        : ([...new Set(value.weekdays ?? [])].sort((a, b) => a - b) as IsoWeekday[]),
    times: uniqueSorted(value.times),
    startsOn: value.startsOn,
  }));

export type MedicationWrite = z.output<typeof medicationWriteSchema>;

const medicationLogSchema = z
  .object({
    medicationId: z.string().trim().min(1, 'Medicamento inválido.'),
    scheduledTime: timeSchema,
    status: z.enum(LOG_STATUSES, { error: 'Situação da tomada inválida.' }),
  })
  .strict();

export const medicationDayPutSchema = z
  .object({
    logs: z.array(medicationLogSchema),
  })
  .strict()
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    for (const [index, log] of value.logs.entries()) {
      const key = `${log.medicationId}|${log.scheduledTime}`;
      if (seen.has(key)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Tomada repetida no mesmo dia.',
          path: ['logs', index, 'medicationId'],
        });
      }
      seen.add(key);
    }
  });

export type MedicationDayPut = z.output<typeof medicationDayPutSchema>;

export const medicationLogRangeSchema = z
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

export type MedicationFailureReason = 'not_found' | 'not_applicable' | 'future';

export function medicationFailureMessage(reason: MedicationFailureReason): string {
  if (reason === 'future') return 'Essa data ainda não está disponível.';
  if (reason === 'not_applicable') {
    return 'Essa tomada não se aplica a essa data.';
  }
  return 'Esse medicamento não está disponível.';
}

export function isScheduleDueOnIsoWeekday(
  item: { frequencyKind: string; weekdays: number[] | null },
  isoWeekday: number,
): boolean {
  if (item.frequencyKind === 'daily') return true;
  return (item.weekdays ?? []).map(Number).includes(isoWeekday);
}

export function parseFrequencyKind(value: unknown): FrequencyKind {
  return value === 'weekdays' ? 'weekdays' : 'daily';
}

export function parseLogStatus(value: unknown): 'done' | 'not_done' | null {
  if (value === 'done' || value === 'not_done') return value;
  return null;
}
