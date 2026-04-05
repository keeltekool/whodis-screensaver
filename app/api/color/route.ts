import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sql = getDb();
    const celebrities = await sql`
      SELECT id, name, category, era, photo_key
      FROM celebrities
      WHERE active = true AND photo_type = 'color'
      ORDER BY name
    `;
    return NextResponse.json(celebrities);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Color API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
