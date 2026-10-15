import { describe, expect, it } from 'vitest';
import { signInSchema, signUpSchema } from './credentials';

const validSignUp = {
  name: 'Ana',
  email: 'ana@exemplo.com',
  password: '12345678',
};

function firstMessage(result: { error?: { issues: { message: string }[] } }) {
  return result.error?.issues[0]?.message;
}

describe('signUpSchema', () => {
  it('trims the name and normalizes the email without touching the password', () => {
    const result = signUpSchema.parse({
      name: '  Ana  ',
      email: ' Ana@Exemplo.com ',
      password: ' senha com espaço ',
    });

    expect(result).toEqual({
      name: 'Ana',
      email: 'ana@exemplo.com',
      password: ' senha com espaço ',
    });
  });

  it.each([
    ['empty name', { name: '   ' }, 'Informe seu nome.'],
    ['81-char name', { name: 'a'.repeat(81) }, 'O nome pode ter até 80 caracteres.'],
    ['invalid email', { email: 'ana@' }, 'Informe um e-mail válido.'],
    ['7-char password', { password: '1234567' }, 'A senha precisa ter pelo menos 8 caracteres.'],
    ['129-char password', { password: 'a'.repeat(129) }, 'A senha pode ter até 128 caracteres.'],
  ])('rejects %s', (_label, override, message) => {
    const result = signUpSchema.safeParse({ ...validSignUp, ...override });

    expect(result.success).toBe(false);
    expect(firstMessage(result)).toBe(message);
  });

  it('accepts the limits: 80-char name, 8 and 128-char passwords', () => {
    expect(
      signUpSchema.safeParse({ ...validSignUp, name: 'a'.repeat(80) }).success,
    ).toBe(true);
    expect(
      signUpSchema.safeParse({ ...validSignUp, password: 'a'.repeat(128) })
        .success,
    ).toBe(true);
  });

  it('rejects missing fields', () => {
    expect(signUpSchema.safeParse({}).success).toBe(false);
  });
});

describe('signInSchema', () => {
  it('normalizes the email', () => {
    expect(
      signInSchema.parse({ email: ' ANA@exemplo.com', password: 'x' }).email,
    ).toBe('ana@exemplo.com');
  });

  it('rejects an empty password', () => {
    expect(
      signInSchema.safeParse({ email: 'ana@exemplo.com', password: '' })
        .success,
    ).toBe(false);
  });
});
