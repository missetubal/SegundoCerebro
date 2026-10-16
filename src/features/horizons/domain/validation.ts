import { z } from 'zod';
import { formText } from '@/shared/lib/validation';

export const HORIZON_NAME_MAX = 40;

export const horizonNameSchema = formText.pipe(
  z
    .string()
    .min(1, 'Dê um nome ao horizonte.')
    .max(HORIZON_NAME_MAX, `Use até ${HORIZON_NAME_MAX} caracteres no nome.`),
);
