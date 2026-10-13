import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Allow build/import without a live DB; queries fail loudly at runtime.
  console.warn(
    "[db] DATABASE_URL is not set. Database operations will fail until it is configured.",
  );
}

const client = postgres(connectionString ?? "postgresql://invalid", {
  prepare: false,
  max: 1,
});

export const db = drizzle(client, { schema });
