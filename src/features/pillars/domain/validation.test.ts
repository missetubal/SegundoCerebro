import { describe, expect, it } from 'vitest';
import { pillarInputSchema } from './validation';

describe('pillarInputSchema', () => {
  it('trims fields and turns empty optional fields into null', () => {
    const result = pillarInputSchema.parse({
      name: '  Saúde  ',
      description: '   ',
      color: '',
      icon: '',
    });

    expect(result).toEqual({
      name: 'Saúde',
      description: null,
      color: null,
      icon: null,
    });
  });

  it('treats missing form fields as empty', () => {
    const result = pillarInputSchema.parse({ name: 'Lazer' });

    expect(result).toEqual({
      name: 'Lazer',
      description: null,
      color: null,
      icon: null,
    });
  });

  it('accepts known color and icon keys', () => {
    const result = pillarInputSchema.parse({
      name: 'Carreira',
      color: 'blue',
      icon: 'briefcase',
    });

    expect(result.color).toBe('blue');
    expect(result.icon).toBe('briefcase');
  });

  it('rejects a blank name', () => {
    const result = pillarInputSchema.safeParse({ name: '   ' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Dê um nome à área.');
  });

  it('enforces name and description limits', () => {
    expect(pillarInputSchema.safeParse({ name: 'a'.repeat(60) }).success).toBe(
      true,
    );
    expect(pillarInputSchema.safeParse({ name: 'a'.repeat(61) }).success).toBe(
      false,
    );
    expect(
      pillarInputSchema.safeParse({ name: 'Casa', description: 'a'.repeat(501) })
        .success,
    ).toBe(false);
  });

  it('rejects unknown color or icon keys', () => {
    const color = pillarInputSchema.safeParse({ name: 'Casa', color: '#ff0000' });
    const icon = pillarInputSchema.safeParse({ name: 'Casa', icon: 'unicorn' });

    expect(color.error?.issues[0].message).toBe('Escolha uma cor da lista.');
    expect(icon.error?.issues[0].message).toBe('Escolha um ícone da lista.');
  });
});
