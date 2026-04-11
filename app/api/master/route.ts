import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sql = getDb();
    const celebrities = await sql`
      SELECT id, name, category, era, hint_2, photo_key, photo_type
      FROM celebrities
      WHERE active = true
      ORDER BY RANDOM()
    `;
    return NextResponse.json(celebrities);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Master API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
