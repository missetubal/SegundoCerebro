import { existsSync, readFileSync } from 'node:fs';
import { config, parse } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { assertTestDatabaseUrl } from './src/test/env-guard.mjs';

const envFile = process.env.DRIZZLE_ENV_FILE;

if (envFile === '.env.test') {
  const realUrls = [
    process.env.DATABASE_URL,
    ...['.env', '.env.local'].map((path) =>
      existsSync(path) ? parse(readFileSync(path)).DATABASE_URL : undefined,
    ),
  ];
  config({ path: envFile, override: true, quiet: true });
  assertTestDatabaseUrl(process.env.DATABASE_URL, realUrls);
} else {
  config({ path: envFile ?? ['.env.local', '.env'], quiet: true });
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
