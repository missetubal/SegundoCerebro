// Neon exposes the same database through a pooled ("-pooler") and a direct
// hostname, so URLs are compared by endpoint, port and database name.
function databaseIdentity(url: string): string {
  const { hostname, port, pathname } = new URL(url);
  return `${hostname.replace(/-pooler(?=\.)/, '')}:${port || '5432'}${pathname}`;
}

export function assertTestDatabaseUrl(
  testUrl: string | undefined,
  realUrls: (string | undefined)[],
): string {
  if (!testUrl) {
    throw new Error(
      'DATABASE_URL missing in .env.test. Create it with the Neon test branch connection string.',
    );
  }
  const testIdentity = databaseIdentity(testUrl);
  for (const realUrl of realUrls) {
    if (realUrl && databaseIdentity(realUrl) === testIdentity) {
      throw new Error(
        'DATABASE_URL in .env.test points to the same database as .env/.env.local. Tests must not run against the real database.',
      );
    }
  }
  return testUrl;
}
