import { z } from 'zod';
import { AREA_COLORS, AREA_ICONS } from './options';
import { formText, optionalFormText } from '@/shared/lib/validation';

export const AREA_NAME_MAX = 60;
export const AREA_DESCRIPTION_MAX = 500;

export const areaInputSchema = z.object({
  name: formText.pipe(
    z
      .string()
      .min(1, 'Dê um nome à área.')
      .max(AREA_NAME_MAX, `Use até ${AREA_NAME_MAX} caracteres no nome.`),
  ),
  description: optionalFormText.pipe(
    z
      .string()
      .max(
        AREA_DESCRIPTION_MAX,
        `Use até ${AREA_DESCRIPTION_MAX} caracteres na descrição.`,
      )
      .nullable(),
  ),
  color: optionalFormText.pipe(
    z.enum(AREA_COLORS, { error: 'Escolha uma cor da lista.' }).nullable(),
  ),
  icon: optionalFormText.pipe(
    z.enum(AREA_ICONS, { error: 'Escolha um ícone da lista.' }).nullable(),
  ),
});

export type AreaInput = z.output<typeof areaInputSchema>;
