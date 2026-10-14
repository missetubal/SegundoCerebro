export function assertTestDatabaseUrl(
  testUrl: string | undefined,
  realUrl: string | undefined,
): string {
  if (!testUrl) {
    throw new Error(
      'DATABASE_URL missing in .env.test. Create it with the Neon test branch connection string.',
    );
  }
  if (testUrl === realUrl) {
    throw new Error(
      'DATABASE_URL in .env.test equals the one in .env. Tests must not run against the real database.',
    );
  }
  return testUrl;
}
