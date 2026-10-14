import { describe, expect, it } from 'vitest';
import { assertTestDatabaseUrl } from './env-guard.mjs';

const real = 'postgresql://u:p@ep-real-123.sa-east-1.aws.neon.tech/neondb';

describe('assertTestDatabaseUrl', () => {
  it('accepts a test URL pointing to a different endpoint', () => {
    const test = 'postgresql://u:p@ep-test-456.sa-east-1.aws.neon.tech/neondb';
    expect(assertTestDatabaseUrl(test, [real])).toBe(test);
  });

  it('accepts a different database on the same endpoint', () => {
    const test = 'postgresql://u:p@ep-real-123.sa-east-1.aws.neon.tech/testdb';
    expect(assertTestDatabaseUrl(test, [real])).toBe(test);
  });

  it('aborts when the test URL equals a real one', () => {
    expect(() => assertTestDatabaseUrl(real, [undefined, real])).toThrow(
      /real database/,
    );
  });

  it('aborts when only the pooler hostname or credentials differ', () => {
    const pooled =
      'postgresql://other:secret@ep-real-123-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';
    expect(() => assertTestDatabaseUrl(pooled, [real])).toThrow(
      /real database/,
    );
  });

  it('aborts when the test URL is missing', () => {
    expect(() => assertTestDatabaseUrl(undefined, [real])).toThrow(
      /\.env\.test/,
    );
  });
});
