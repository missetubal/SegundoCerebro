import { describe, expect, it } from 'vitest';
import { areaInputSchema } from './validation';

describe('areaInputSchema', () => {
  it('trims fields and turns empty optional fields into null', () => {
    const result = areaInputSchema.parse({
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
    const result = areaInputSchema.parse({ name: 'Lazer' });

    expect(result).toEqual({
      name: 'Lazer',
      description: null,
      color: null,
      icon: null,
    });
  });

  it('accepts known color and icon keys', () => {
    const result = areaInputSchema.parse({
      name: 'Carreira',
      color: 'blue',
      icon: 'briefcase',
    });

    expect(result.color).toBe('blue');
    expect(result.icon).toBe('briefcase');
  });

  it('rejects a blank name', () => {
    const result = areaInputSchema.safeParse({ name: '   ' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Dê um nome à área.');
  });

  it('enforces name and description limits', () => {
    expect(areaInputSchema.safeParse({ name: 'a'.repeat(60) }).success).toBe(
      true,
    );
    expect(areaInputSchema.safeParse({ name: 'a'.repeat(61) }).success).toBe(
      false,
    );
    expect(
      areaInputSchema.safeParse({ name: 'Casa', description: 'a'.repeat(501) })
        .success,
    ).toBe(false);
  });

  it('rejects unknown color or icon keys', () => {
    const color = areaInputSchema.safeParse({ name: 'Casa', color: '#ff0000' });
    const icon = areaInputSchema.safeParse({ name: 'Casa', icon: 'unicorn' });

    expect(color.error?.issues[0].message).toBe('Escolha uma cor da lista.');
    expect(icon.error?.issues[0].message).toBe('Escolha um ícone da lista.');
  });
});
