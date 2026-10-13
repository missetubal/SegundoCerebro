import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json(
        {
          ok: false,
          database: "unconfigured",
          error:
            "DATABASE_URL missing in process env. Confirm .env.local and restart npm run dev.",
        },
        { status: 503 },
      );
    }

    const { getDb } = await import("@/db");
    const db = getDb();
    await db.execute(sql`select 1 as ok`);

    return NextResponse.json({ ok: true, database: "up" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("[api/health]", message);
    return NextResponse.json(
      { ok: false, database: "down", error: message },
      { status: 503 },
    );
  }
}
