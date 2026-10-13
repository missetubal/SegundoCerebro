import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { ok: false, database: "unconfigured", error: "DATABASE_URL missing" },
      { status: 503 },
    );
  }

  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, database: "up" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json(
      { ok: false, database: "down", error: message },
      { status: 503 },
    );
  }
}
