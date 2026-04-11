import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getDayNumber, getTodayDateStr } from "@/lib/daily";
import DailyChallengeEmail from "@/emails/daily-challenge";

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://whodis-screensaver.vercel.app";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getDb();
    const today = getTodayDateStr();
    const dayNumber = getDayNumber(today);

    if (dayNumber < 1) {
      return NextResponse.json({ error: "Before launch date" }, { status: 400 });
    }

    // Generate today's challenge (idempotent)
    let [challenge] = await sql`SELECT * FROM daily_challenges WHERE date = ${today}`;

    if (!challenge) {
      let [matchup] = await sql`
        SELECT m.id FROM matchups m WHERE m.active = true
        AND m.id NOT IN (SELECT matchup_id FROM daily_challenges WHERE matchup_id IS NOT NULL)
        ORDER BY RANDOM() LIMIT 1
      `;
      if (!matchup) {
        [matchup] = await sql`SELECT id FROM matchups WHERE active = true ORDER BY RANDOM() LIMIT 1`;
      }
      [challenge] = await sql`
        INSERT INTO daily_challenges (date, challenge_type, matchup_id)
        VALUES (${today}, 'deathmatch', ${matchup.id})
        ON CONFLICT (date) DO UPDATE SET date = EXCLUDED.date
        RETURNING *
      `;
    }

    // Build teaser from matchup
    const [matchup] = await sql`SELECT tagline, fighter_a_nickname, fighter_b_nickname FROM matchups WHERE id = ${challenge.matchup_id}`;
    const teaser = matchup
      ? `${matchup.fighter_a_nickname} vs ${matchup.fighter_b_nickname} — ${matchup.tagline}`
      : "Today's deathmatch awaits.";

    // Fetch active subscribers
    const subscribers = await sql`SELECT email FROM daily_subscribers WHERE active = true`;

    if (subscribers.length === 0) {
      return NextResponse.json({ sent: 0, message: "No active subscribers" });
    }

    // Send in batches of 50
    let sent = 0;
    const errors: string[] = [];

    for (let i = 0; i < subscribers.length; i += 50) {
      const batch = subscribers.slice(i, i + 50);
      const results = await Promise.allSettled(
        batch.map((sub) =>
          resend.emails.send({
            from: "WHO DIS? <onboarding@resend.dev>",
            to: sub.email,
            subject: `WHO DIS? Daily #${dayNumber} — Deathmatch`,
            react: DailyChallengeEmail({
              date: today,
              dayNumber,
              challengeType: "deathmatch",
              teaser,
              challengeUrl: `${BASE_URL}/daily/${today}`,
              unsubscribeUrl: `${BASE_URL}/api/daily/unsubscribe?email=${encodeURIComponent(sub.email)}`,
            }),
          })
        )
      );

      for (const r of results) {
        if (r.status === "fulfilled") sent++;
        else errors.push(r.reason?.message || "Unknown send error");
      }
    }

    return NextResponse.json({ sent, total: subscribers.length, errors: errors.length, date: today, dayNumber });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Daily send error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
