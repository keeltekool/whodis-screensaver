import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const sql = getDb();

    const [matchup] = await sql`
      SELECT
        m.id, m.slug, m.tagline, m.matchup_type, m.difficulty,
        m.fighter_a_nickname, m.fighter_b_nickname,
        ca.id AS a_id, ca.name AS a_name, ca.photo_key AS a_photo_key, ca.category AS a_category, ca.era AS a_era,
        cb.id AS b_id, cb.name AS b_name, cb.photo_key AS b_photo_key, cb.category AS b_category, cb.era AS b_era
      FROM matchups m
      JOIN celebrities ca ON ca.id = m.fighter_a_id
      JOIN celebrities cb ON cb.id = m.fighter_b_id
      WHERE m.slug = ${slug} AND m.active = true
    `;

    if (!matchup) {
      return NextResponse.json({ error: "Matchup not found" }, { status: 404 });
    }

    const rounds = await sql`
      SELECT round_number, round_label, question_text
      FROM matchup_rounds
      WHERE matchup_id = ${matchup.id}
      ORDER BY round_number
    `;

    return NextResponse.json({
      id: matchup.id,
      slug: matchup.slug,
      tagline: matchup.tagline,
      matchup_type: matchup.matchup_type,
      difficulty: matchup.difficulty,
      fighter_a: {
        id: matchup.a_id, name: matchup.a_name, photo_key: matchup.a_photo_key,
        nickname: matchup.fighter_a_nickname, category: matchup.a_category, era: matchup.a_era,
      },
      fighter_b: {
        id: matchup.b_id, name: matchup.b_name, photo_key: matchup.b_photo_key,
        nickname: matchup.fighter_b_nickname, category: matchup.b_category, era: matchup.b_era,
      },
      rounds,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Deathmatch detail API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
