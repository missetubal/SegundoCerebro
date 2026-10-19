import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';
import { defineConfig } from 'vitest/config';
import { assertTestDatabaseUrl } from './src/test/env-guard.mjs';

function readEnvFile(path: string): Record<string, string> {
  return existsSync(path) ? parse(readFileSync(path)) : {};
}

const testEnv = readEnvFile('.env.test');
assertTestDatabaseUrl(testEnv.DATABASE_URL, [
  process.env.DATABASE_URL,
  readEnvFile('.env').DATABASE_URL,
  readEnvFile('.env.local').DATABASE_URL,
]);

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'server-only': fileURLToPath(
        new URL('./src/test/server-only.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: testEnv,
    // Neon-backed integration tests routinely take 1–4s each; heavy isolation
    // cases tip over Vitest's 5s default under CI load.
    testTimeout: 20_000,
    hookTimeout: 20_000,
    server: { deps: { inline: ['next-auth'] } },
  },
});
