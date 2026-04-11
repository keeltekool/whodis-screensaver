import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sql = getDb();
    const matchups = await sql`
      SELECT
        m.id, m.slug, m.tagline, m.matchup_type, m.difficulty, m.sort_order,
        m.fighter_a_nickname, m.fighter_b_nickname,
        ca.id AS a_id, ca.name AS a_name, ca.photo_key AS a_photo_key,
        cb.id AS b_id, cb.name AS b_name, cb.photo_key AS b_photo_key
      FROM matchups m
      JOIN celebrities ca ON ca.id = m.fighter_a_id
      JOIN celebrities cb ON cb.id = m.fighter_b_id
      WHERE m.active = true
      ORDER BY m.sort_order
    `;

    const result = matchups.map((m) => ({
      id: m.id,
      slug: m.slug,
      tagline: m.tagline,
      matchup_type: m.matchup_type,
      difficulty: m.difficulty,
      fighter_a: { id: m.a_id, name: m.a_name, photo_key: m.a_photo_key, nickname: m.fighter_a_nickname },
      fighter_b: { id: m.b_id, name: m.b_name, photo_key: m.b_photo_key, nickname: m.fighter_b_nickname },
    }));

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Deathmatch list API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
