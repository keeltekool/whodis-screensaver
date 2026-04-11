import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getDayNumber, getTodayDateStr } from "@/lib/daily";

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
        batch.map((sub) => {
          const unsubUrl = `${BASE_URL}/api/daily/unsubscribe?email=${encodeURIComponent(sub.email)}`;
          const challengeUrl = `${BASE_URL}/daily/${today}`;
          const html = `<!DOCTYPE html><html><body style="background:#131313;margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif"><div style="max-width:500px;margin:0 auto;padding:40px 20px"><p style="color:#ffba20;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-align:center;margin:0 0 8px">WHO DIS? — THE DAILY</p><p style="color:#e5e2e1;font-size:11px;letter-spacing:2px;text-transform:uppercase;text-align:center;margin:0 0 32px;opacity:0.5">${today} · #${dayNumber}</p><div style="background:#1c1b1b;padding:32px 24px;text-align:center"><p style="color:#ffba20;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px">TODAY'S DEATHMATCH</p><p style="color:#e5e2e1;font-size:18px;line-height:1.4;margin:0 0 24px;font-style:italic">"${teaser}"</p><a href="${challengeUrl}" style="display:inline-block;background:#ffba20;color:#131313;font-size:14px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;padding:16px 40px;text-decoration:none">PLAY TODAY'S CHALLENGE →</a></div><hr style="border-color:#2a2a2a;margin:32px 0"/><p style="color:#666;font-size:11px;text-align:center;line-height:1.6">You're receiving this because you subscribed to WHO DIS? THE DAILY.</p><p style="text-align:center;margin:8px 0 0"><a href="${unsubUrl}" style="color:#666;font-size:11px;text-decoration:underline">Unsubscribe</a></p></div></body></html>`;

          return resend.emails.send({
            from: "WHO DIS? <onboarding@resend.dev>",
            to: sub.email,
            subject: `WHO DIS? Daily #${dayNumber} — Deathmatch`,
            html,
          });
        })
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
