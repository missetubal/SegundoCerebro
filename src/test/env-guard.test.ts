import { describe, expect, it } from 'vitest';
import { assertTestDatabaseUrl } from './env-guard.mjs';

describe('assertTestDatabaseUrl', () => {
  it('accepts a test URL different from the real one', () => {
    expect(assertTestDatabaseUrl('postgres://test', 'postgres://real')).toBe(
      'postgres://test',
    );
  });

  it('aborts when the test URL equals the real one', () => {
    expect(() =>
      assertTestDatabaseUrl('postgres://same', 'postgres://same'),
    ).toThrow(/real database/);
  });

  it('aborts when the test URL is missing', () => {
    expect(() => assertTestDatabaseUrl(undefined, 'postgres://real')).toThrow(
      /\.env\.test/,
    );
  });
});
