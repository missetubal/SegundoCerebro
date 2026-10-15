import { z } from 'zod';

export const NAME_MAX = 80;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

const emailSchema = z
  .string({ error: 'Informe um e-mail válido.' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Informe um e-mail válido.' }));

export const signUpSchema = z.object({
  name: z
    .string({ error: 'Informe seu nome.' })
    .trim()
    .min(1, { error: 'Informe seu nome.' })
    .max(NAME_MAX, { error: `O nome pode ter até ${NAME_MAX} caracteres.` }),
  email: emailSchema,
  password: z
    .string({ error: `A senha precisa ter pelo menos ${PASSWORD_MIN} caracteres.` })
    .min(PASSWORD_MIN, {
      error: `A senha precisa ter pelo menos ${PASSWORD_MIN} caracteres.`,
    })
    .max(PASSWORD_MAX, { error: `A senha pode ter até ${PASSWORD_MAX} caracteres.` }),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1)
    .max(PASSWORD_MAX),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
