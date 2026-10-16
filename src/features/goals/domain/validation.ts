import { z } from 'zod';
import { formText, optionalFormText } from '@/shared/lib/validation';

export const GOAL_TITLE_MAX = 120;
export const NEXT_STEP_TITLE_MAX = 120;

export const GOAL_STATUSES = ['active', 'completed', 'archived'] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const NEXT_STEP_STATUSES = ['open', 'done'] as const;
export type NextStepStatus = (typeof NEXT_STEP_STATUSES)[number];

const optionalDate = optionalFormText.pipe(
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida.')
    .nullable(),
);

export const goalInputSchema = z
  .object({
    title: formText.pipe(
      z
        .string()
        .min(1, 'Dê um título à meta.')
        .max(GOAL_TITLE_MAX, `Use até ${GOAL_TITLE_MAX} caracteres no título.`),
    ),
    primaryAreaId: formText.pipe(
      z.string().min(1, 'Escolha uma área principal.'),
    ),
    horizonId: formText.pipe(z.string().min(1, 'Escolha um horizonte.')),
    status: formText.pipe(
      z.enum(GOAL_STATUSES, { error: 'Escolha um status válido.' }),
    ),
    startDate: optionalDate,
    targetDate: optionalDate,
  })
  .superRefine((value, ctx) => {
    if (
      value.startDate &&
      value.targetDate &&
      value.targetDate < value.startDate
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'A data-alvo não pode ser anterior à data de início.',
        path: ['targetDate'],
      });
    }
  });

export type GoalInput = z.output<typeof goalInputSchema>;

export const nextStepInputSchema = z.object({
  title: formText.pipe(
    z
      .string()
      .min(1, 'Dê um título ao próximo passo.')
      .max(
        NEXT_STEP_TITLE_MAX,
        `Use até ${NEXT_STEP_TITLE_MAX} caracteres no título.`,
      ),
  ),
});

export type NextStepInput = z.output<typeof nextStepInputSchema>;
