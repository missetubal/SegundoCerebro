/**
 * Drizzle applies a journal entry when its `when` is greater than the latest
 * `created_at` already stored. Editing `when` in `_journal.json` after a
 * migration was applied leaves the DB with the old timestamp, so migrate
 * re-runs SQL and fails (e.g. "relation already exists").
 *
 * This syncs `drizzle.__drizzle_migrations.created_at` to the journal `when`
 * for rows that match by SQL file hash.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';
import { config, parse } from 'dotenv';
import { assertTestDatabaseUrl } from '../src/test/env-guard.mts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = process.env.DRIZZLE_ENV_FILE;

if (envFile === '.env.test') {
  const realUrls = [
    process.env.DATABASE_URL,
    ...['.env', '.env.local'].map((path) => {
      const full = join(root, path);
      return existsSync(full) ? parse(readFileSync(full)).DATABASE_URL : undefined;
    }),
  ];
  config({ path: join(root, envFile), override: true, quiet: true });
  assertTestDatabaseUrl(process.env.DATABASE_URL, realUrls);
} else {
  config({
    path: envFile
      ? join(root, envFile)
      : [join(root, '.env.local'), join(root, '.env')],
    quiet: true,
  });
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const journal = JSON.parse(
  readFileSync(join(root, 'drizzle/meta/_journal.json'), 'utf8'),
);

const sql = neon(url);

try {
  await sql`select 1 from drizzle.__drizzle_migrations limit 1`;
} catch {
  // Fresh database — migrator creates the table.
  process.exit(0);
}

for (const entry of journal.entries) {
  const body = readFileSync(join(root, 'drizzle', `${entry.tag}.sql`));
  const hash = createHash('sha256').update(body).digest('hex');
  const updated = await sql`
    update drizzle.__drizzle_migrations
    set created_at = ${entry.when}
    where hash = ${hash}
      and created_at is distinct from ${entry.when}
    returning id, created_at
  `;
  if (updated.length > 0) {
    console.log(
      `synced ${entry.tag}: created_at -> ${entry.when} (id ${updated[0].id})`,
    );
  }
}
