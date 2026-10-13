import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __segundoCerebroSql?: ReturnType<typeof postgres>;
  __segundoCerebroDb?: Database;
};

/**
 * Neon pooled URLs work with postgres.js when `prepare: false`.
 * Prefer DATABASE_URL from `.env.local` (neon deploy).
 * Migrations should use DATABASE_URL_UNPOOLED when available.
 */
function createDb(connectionString: string): Database {
  const client = postgres(connectionString, {
    prepare: false,
    max: 1,
    connect_timeout: 15,
  });
  return drizzle(client, { schema });
}

export function getDb(): Database {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Put it in .env.local (neon deploy) and restart the dev server.",
    );
  }

  if (!globalForDb.__segundoCerebroDb) {
    globalForDb.__segundoCerebroDb = createDb(connectionString);
  }
  return globalForDb.__segundoCerebroDb;
}

/**
 * Eager instance for Auth.js DrizzleAdapter (`is(db, PgDatabase)`).
 * Uses a non-connecting placeholder string only when DATABASE_URL is absent (e.g. bare build).
 */
export const db: Database = process.env.DATABASE_URL
  ? getDb()
  : createDb("postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder");
