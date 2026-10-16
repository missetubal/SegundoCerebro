import { z } from 'zod';

export const formText = z.preprocess(
  (value) => (typeof value === 'string' ? value : ''),
  z.string().trim(),
);

export const optionalFormText = formText.transform((value) =>
  value === '' ? null : value,
);

export const itemIdSchema = formText.pipe(z.string().min(1));

export const moveDirectionSchema = z.enum(['up', 'down']);

export function firstIssueMessage(error: z.ZodError, fallback: string): string {
  return error.issues[0]?.message || fallback;
}
