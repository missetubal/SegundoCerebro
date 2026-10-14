import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';
import { defineConfig } from 'vitest/config';
import { assertTestDatabaseUrl } from './src/test/env-guard.mjs';

function readEnvFile(path: string): Record<string, string> {
  return existsSync(path) ? parse(readFileSync(path)) : {};
}

const testEnv = readEnvFile('.env.test');
const realEnv = readEnvFile('.env');
assertTestDatabaseUrl(testEnv.DATABASE_URL, realEnv.DATABASE_URL);

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
  },
});
