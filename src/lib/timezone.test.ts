import { describe, expect, it } from 'vitest';
import { normalizeTimeZone } from './timezone';

describe('normalizeTimeZone', () => {
  it('accepts IANA identifiers', () => {
    expect(normalizeTimeZone('Europe/Lisbon')).toBe('Europe/Lisbon');
    expect(normalizeTimeZone('UTC')).toBe('UTC');
  });

  it('normalizes letter case', () => {
    expect(normalizeTimeZone('america/sao_paulo')).toBe('America/Sao_Paulo');
  });

  it('rejects invalid values', () => {
    expect(normalizeTimeZone('Marte/Base')).toBeNull();
    expect(normalizeTimeZone('')).toBeNull();
    expect(normalizeTimeZone('+03:00')).toBeNull();
  });
});
