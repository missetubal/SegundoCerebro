import { z } from 'zod';

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
    .max(80, { error: 'O nome pode ter até 80 caracteres.' }),
  email: emailSchema,
  password: z
    .string({ error: 'A senha precisa ter pelo menos 8 caracteres.' })
    .min(8, { error: 'A senha precisa ter pelo menos 8 caracteres.' })
    .max(128, { error: 'A senha pode ter até 128 caracteres.' }),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
