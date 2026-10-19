import { z } from 'zod';
import { formText, optionalFormText } from '@/shared/lib/validation';

export const HABIT_NAME_MAX = 80;
export const HABIT_UNIT_MAX = 20;

export const TRACKING_TYPES = ['completion', 'quantity'] as const;
export type TrackingType = (typeof TRACKING_TYPES)[number];

export const FREQUENCY_KINDS = ['daily', 'weekdays'] as const;
export type FrequencyKind = (typeof FREQUENCY_KINDS)[number];

/** ISO weekdays: 1 = Monday … 7 = Sunday */
export const ISO_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export type IsoWeekday = (typeof ISO_WEEKDAYS)[number];

function parseAreaIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return [value.trim()];
  }
  return [];
}

function parseWeekdays(value: unknown): number[] {
  const raw = Array.isArray(value) ? value : value == null ? [] : [value];
  const numbers = raw
    .map((item) =>
      typeof item === 'number' ? item : Number.parseInt(String(item), 10),
    )
    .filter((item) => Number.isInteger(item));
  return [...new Set(numbers)].sort((a, b) => a - b);
}

export const habitInputSchema = z
  .object({
    name: formText.pipe(
      z
        .string()
        .min(1, 'Dê um nome ao hábito.')
        .max(HABIT_NAME_MAX, `Use até ${HABIT_NAME_MAX} caracteres no nome.`),
    ),
    trackingType: formText.pipe(
      z.enum(TRACKING_TYPES, { error: 'Escolha um tipo de acompanhamento.' }),
    ),
    frequencyKind: formText.pipe(
      z.enum(FREQUENCY_KINDS, { error: 'Escolha uma frequência.' }),
    ),
    weekdays: z.preprocess(parseWeekdays, z.array(z.number())),
    targetValue: z.preprocess((value) => {
      if (value == null || value === '') return null;
      if (typeof value === 'number') return value;
      const trimmed = String(value).trim();
      if (trimmed === '') return null;
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : value;
    }, z.number('Informe um número.').int('Informe um número inteiro.').positive('Informe um valor maior que zero.').nullable()),
    unit: optionalFormText.pipe(
      z
        .string()
        .max(HABIT_UNIT_MAX, `Use até ${HABIT_UNIT_MAX} caracteres na unidade.`)
        .nullable(),
    ),
    areaIds: z.preprocess(
      parseAreaIds,
      z.array(z.string().min(1)).min(1, 'Escolha ao menos uma área.'),
    ),
  })
  .superRefine((value, ctx) => {
    if (value.trackingType === 'completion') {
      if (value.targetValue !== null || value.unit !== null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Hábitos de conclusão não usam meta nem unidade.',
          path: ['targetValue'],
        });
      }
    } else {
      if (value.targetValue === null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Informe a meta numérica.',
          path: ['targetValue'],
        });
      }
      if (value.unit === null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Informe a unidade.',
          path: ['unit'],
        });
      }
    }

    if (value.frequencyKind === 'daily') {
      if (value.weekdays.length > 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Frequência diária não usa dias da semana.',
          path: ['weekdays'],
        });
      }
    } else {
      if (value.weekdays.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Escolha ao menos um dia da semana.',
          path: ['weekdays'],
        });
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
    }
  })
  .transform((value) => ({
    name: value.name,
    trackingType: value.trackingType,
    frequencyKind: value.frequencyKind,
    weekdays:
      value.frequencyKind === 'daily' ? null : (value.weekdays as IsoWeekday[]),
    targetValue:
      value.trackingType === 'quantity' ? value.targetValue : null,
    unit: value.trackingType === 'quantity' ? value.unit : null,
    areaIds: [...new Set(value.areaIds)],
  }));

export type HabitInput = z.output<typeof habitInputSchema>;

const trackingTypeSchema = z.enum(TRACKING_TYPES);
const frequencyKindSchema = z.enum(FREQUENCY_KINDS);

/** Parses a stored tracking type; unknown values fall back to `completion`. */
export function parseTrackingType(value: unknown): TrackingType {
  const result = trackingTypeSchema.safeParse(value);
  return result.success ? result.data : 'completion';
}

/** Parses a stored frequency kind; unknown values fall back to `daily`. */
export function parseFrequencyKind(value: unknown): FrequencyKind {
  const result = frequencyKindSchema.safeParse(value);
  return result.success ? result.data : 'daily';
}

/** Whether an active habit applies on the given ISO weekday (1=Mon … 7=Sun). */
export function isHabitDueOnIsoWeekday(
  habit: { frequencyKind: string; weekdays: number[] | null },
  isoWeekday: number,
): boolean {
  if (habit.frequencyKind === 'daily') return true;
  const days = (habit.weekdays ?? []).map(Number);
  return days.includes(isoWeekday);
}
