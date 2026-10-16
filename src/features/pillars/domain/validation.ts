import { z } from 'zod';
import { PILLAR_COLORS, PILLAR_ICONS } from './options';
import { formText, optionalFormText } from '@/shared/lib/validation';

export const PILLAR_NAME_MAX = 60;
export const PILLAR_DESCRIPTION_MAX = 500;

export const pillarInputSchema = z.object({
  name: formText.pipe(
    z
      .string()
      .min(1, 'Dê um nome à área.')
      .max(PILLAR_NAME_MAX, `Use até ${PILLAR_NAME_MAX} caracteres no nome.`),
  ),
  description: optionalFormText.pipe(
    z
      .string()
      .max(
        PILLAR_DESCRIPTION_MAX,
        `Use até ${PILLAR_DESCRIPTION_MAX} caracteres na descrição.`,
      )
      .nullable(),
  ),
  color: optionalFormText.pipe(
    z.enum(PILLAR_COLORS, { error: 'Escolha uma cor da lista.' }).nullable(),
  ),
  icon: optionalFormText.pipe(
    z.enum(PILLAR_ICONS, { error: 'Escolha um ícone da lista.' }).nullable(),
  ),
});

export type PillarInput = z.output<typeof pillarInputSchema>;
