import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import { getDayNumber, getTodayDateStr } from "@/lib/daily";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date") || getTodayDateStr();
    const sql = getDb();

    const [existing] = await sql`
      SELECT * FROM daily_challenges WHERE date = ${dateParam}
    `;

    if (existing) {
      return NextResponse.json(existing);
    }

    const dayNumber = getDayNumber(dateParam);
    if (dayNumber < 1) {
      return NextResponse.json({ error: "Date is before launch" }, { status: 400 });
    }

    // Always deathmatch — pick a matchup not yet used
    let [matchup] = await sql`
      SELECT m.id FROM matchups m
      WHERE m.active = true
      AND m.id NOT IN (SELECT matchup_id FROM daily_challenges WHERE matchup_id IS NOT NULL)
      ORDER BY RANDOM() LIMIT 1
    `;

    if (!matchup) {
      [matchup] = await sql`SELECT id FROM matchups WHERE active = true ORDER BY RANDOM() LIMIT 1`;
    }

    const [challenge] = await sql`
      INSERT INTO daily_challenges (date, challenge_type, matchup_id)
      VALUES (${dateParam}, 'deathmatch', ${matchup.id})
      ON CONFLICT (date) DO UPDATE SET date = EXCLUDED.date
      RETURNING *
    `;

    return NextResponse.json(challenge);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Daily challenge error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
