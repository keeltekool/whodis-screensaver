import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

const RESEND_API_URL = "https://api.resend.com/emails";
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://whodis-screensaver.vercel.app";
const GAME_URL = "https://app-zeta-nine-52.vercel.app";
const R2_BASE = "https://pub-19f678b6a57845a7bafc5e706541ab76.r2.dev";
const BIWEEKLY_START = "2026-09-12";

const EDITION_TYPES = ["deathmatch", "spotlight", "trivia"] as const;

const BTN = `display:inline-block;background:#ffba20;color:#131313;font-weight:900;font-size:12px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:14px 24px`;

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "WHO DIS? <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: `${res.status}: ${body}` };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function photo(key: string) {
  return `${R2_BASE}/photos/${key}`;
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function diffLabel(d: number): string {
  return d === 1 ? "EASY" : d === 2 ? "MEDIUM" : "HARD";
}

// -- Edition content builders (each includes its own action buttons) --

function deathmatchBlock(m: Record<string, string | number>) {
  const pickA = `${BASE_URL}/deathmatch/${m.slug}?pick=a`;
  const pickB = `${BASE_URL}/deathmatch/${m.slug}?pick=b`;
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 auto 20px"><tr>
<td width="42%" style="text-align:center;vertical-align:bottom;padding:0">
<img src="${photo(m.a_photo_key as string)}" alt="${esc(m.a_name as string)}" width="160" style="width:160px;max-width:100%;height:auto;display:block;margin:0 auto"/>
<p style="color:#e5e2e1;font-size:14px;font-weight:700;margin:12px 0 2px;line-height:1.2">${esc(m.fighter_a_nickname as string)}</p>
<p style="color:#666;font-size:11px;margin:0">${esc(m.a_name as string)}</p>
</td>
<td width="16%" style="text-align:center;vertical-align:middle;padding:0">
<p style="color:#ffba20;font-size:24px;font-weight:900;margin:0">VS</p>
</td>
<td width="42%" style="text-align:center;vertical-align:bottom;padding:0">
<img src="${photo(m.b_photo_key as string)}" alt="${esc(m.b_name as string)}" width="160" style="width:160px;max-width:100%;height:auto;display:block;margin:0 auto"/>
<p style="color:#e5e2e1;font-size:14px;font-weight:700;margin:12px 0 2px;line-height:1.2">${esc(m.fighter_b_nickname as string)}</p>
<p style="color:#666;font-size:11px;margin:0">${esc(m.b_name as string)}</p>
</td>
</tr></table>
<p style="color:#999;font-size:14px;font-style:italic;line-height:1.4;margin:0 0 8px">&ldquo;${esc(m.tagline as string)}&rdquo;</p>
<p style="color:#555;font-size:10px;letter-spacing:1px;text-transform:uppercase;margin:0 0 24px">${esc(m.matchup_type as string)} &middot; ${diffLabel(m.difficulty as number)}</p>
<div style="border-top:1px solid #2a2a2a;margin:0 20px 20px"></div>
<p style="color:#e5e2e1;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px">WHO TAKES IT?</p>
<table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
<td style="padding:0 6px"><a href="${pickA}" style="${BTN}">${esc(m.fighter_a_nickname as string)}</a></td>
<td style="padding:0 6px"><a href="${pickB}" style="${BTN}">${esc(m.fighter_b_nickname as string)}</a></td>
</tr></table>`;
}

function spotlightBlock(c: Record<string, string>) {
  return `
<img src="${photo(c.photo_key)}" alt="Mystery icon" width="360" style="width:360px;max-width:100%;height:auto;display:block;margin:0 auto 24px"/>
<p style="color:#ffba20;font-size:28px;font-weight:900;letter-spacing:4px;margin:0 0 12px">? ? ?</p>
<p style="color:#555;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin:0 0 20px">${esc(c.category)} &middot; ${esc(c.era)}</p>
<div style="border-top:1px solid #2a2a2a;margin:0 40px 20px"></div>
<p style="color:#c0bdb8;font-size:14px;line-height:1.7;font-style:italic;margin:0">&ldquo;${esc(c.hint_2)}&rdquo;</p>`;
}

function triviaBlock(
  r: Record<string, string | number>,
  m: Record<string, string>
) {
  const ansA = `${BASE_URL}/deathmatch/${m.slug}?ans=a`;
  const ansB = `${BASE_URL}/deathmatch/${m.slug}?ans=b`;
  return `
<p style="color:#555;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px">FROM THE FIGHT</p>
<p style="color:#e5e2e1;font-size:16px;font-weight:700;margin:0 0 20px">${esc(m.fighter_a_nickname)} vs ${esc(m.fighter_b_nickname)}</p>
<p style="color:#ffba20;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin:0 0 4px">ROUND ${r.round_number}</p>
<p style="color:#ffba20;font-size:12px;letter-spacing:1px;text-transform:uppercase;margin:0 0 20px">${esc(r.round_label as string)}</p>
<div style="border-top:1px solid #2a2a2a;margin:0 20px 20px"></div>
<p style="color:#e5e2e1;font-size:16px;line-height:1.7;margin:0 0 24px">${esc(r.question_text as string)}</p>
<p style="color:#e5e2e1;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px">YOUR ANSWER?</p>
<table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
<td style="padding:0 6px"><a href="${ansA}" style="${BTN}">${esc(m.fighter_a_nickname)}</a></td>
<td style="padding:0 6px"><a href="${ansB}" style="${BTN}">${esc(m.fighter_b_nickname)}</a></td>
</tr></table>`;
}

// -- Email wrapper --

function wrapEmail(
  editionLabel: string,
  editionNumber: number,
  date: string,
  intro: string,
  content: string,
  closing: string,
  ctaText: string,
  ctaUrl: string,
  funFact: string,
  unsubUrl: string
) {
  const ctaHtml = ctaText
    ? `<div style="text-align:center;margin:24px 0 0">
<a href="${ctaUrl}" style="display:inline-block;background:#ffba20;color:#131313;font-size:13px;font-weight:900;letter-spacing:2px;text-transform:uppercase;padding:16px 44px;text-decoration:none">${ctaText}</a>
</div>`
    : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0d0d0d;margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:40px 20px">

<p style="color:#ffba20;font-size:32px;font-weight:900;letter-spacing:6px;text-align:center;margin:0 0 6px;text-transform:uppercase">WHO DIS?</p>
<p style="color:#666;font-size:10px;letter-spacing:3px;text-align:center;text-transform:uppercase;margin:0 0 4px">BI-WEEKLY</p>
<p style="color:#555;font-size:11px;text-align:center;margin:0 0 32px">#${editionNumber} &middot; ${fmtDate(date)}</p>

<div style="border-top:1px solid #ffba20;margin:0 80px 28px"></div>
<p style="color:#ffba20;font-size:11px;letter-spacing:3px;text-align:center;text-transform:uppercase;margin:0 0 16px">${editionLabel}</p>

<p style="color:#999;font-size:13px;line-height:1.6;text-align:center;margin:0 0 28px">${intro}</p>

<div style="background:#1a1a1a;border:1px solid #2a2a2a;padding:32px 20px;text-align:center">
${content}
</div>

<p style="color:#888;font-size:12px;line-height:1.5;text-align:center;margin:20px 0 0">${closing}</p>

${ctaHtml}

<div style="border-top:1px solid #2a2a2a;margin:36px 0 24px"></div>

<div style="background:#1a1a1a;border:1px solid #2a2a2a;padding:20px 24px;text-align:center">
<p style="color:#ffba20;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px">DID YOU KNOW?</p>
<p style="color:#c0bdb8;font-size:12px;line-height:1.6;font-style:italic;margin:0">${funFact}</p>
</div>

<div style="margin:28px 0 0"></div>
<p style="color:#555;font-size:10px;letter-spacing:2px;text-align:center;text-transform:uppercase;margin:0 0 12px">ALSO ON WHO DIS?</p>
<p style="text-align:center;margin:0;line-height:2.2">
<a href="${GAME_URL}" style="color:#ffba20;font-size:11px;letter-spacing:1px;text-decoration:none;text-transform:uppercase;padding:0 8px">THE GAME</a>
<span style="color:#333">&middot;</span>
<a href="${BASE_URL}/screensaver" style="color:#ffba20;font-size:11px;letter-spacing:1px;text-decoration:none;text-transform:uppercase;padding:0 8px">THE WALL</a>
<span style="color:#333">&middot;</span>
<a href="${BASE_URL}/gallery" style="color:#ffba20;font-size:11px;letter-spacing:1px;text-decoration:none;text-transform:uppercase;padding:0 8px">IN COLOR</a>
<span style="color:#333">&middot;</span>
<a href="${BASE_URL}/deathmatch" style="color:#ffba20;font-size:11px;letter-spacing:1px;text-decoration:none;text-transform:uppercase;padding:0 8px">DEATHMATCH</a>
</p>

<div style="margin:32px 0 0"></div>
<p style="color:#444;font-size:10px;text-align:center;line-height:1.6;margin:0">Bi-weekly from WHO DIS? &mdash; the celebrity photo arcade.</p>
<p style="text-align:center;margin:8px 0 0"><a href="${unsubUrl}" style="color:#444;font-size:10px;text-decoration:underline">Unsubscribe</a></p>

</div></body></html>`;
}

// -- Main handler --

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getDb();
    const today = new Date().toISOString().split("T")[0];

    // Edition number based on bi-weekly sends so far
    const [countRow] = await sql`
      SELECT COUNT(*)::int AS count FROM daily_challenges
      WHERE date >= ${BIWEEKLY_START}
    `;
    const prevCount = countRow.count as number;
    const editionNumber = prevCount + 1;
    const editionType = EDITION_TYPES[prevCount % 3];

    // Random fun fact for every edition
    const [factRow] = await sql`
      SELECT fun_fact FROM matchup_rounds
      WHERE fun_fact IS NOT NULL AND fun_fact != ''
      ORDER BY RANDOM() LIMIT 1
    `;
    const funFact = esc(factRow?.fun_fact || "WHO DIS? has 50 matchups and 350 trivia questions.");

    let content: string;
    let intro: string;
    let closing: string;
    let ctaText = "";
    let ctaUrl = "";
    let subject: string;
    let challengeMatchupId: number | null = null;
    let challengeCelebId: number | null = null;

    if (editionType === "deathmatch") {
      let [matchup] = await sql`
        SELECT m.id, m.slug, m.tagline, m.matchup_type, m.difficulty,
               m.fighter_a_nickname, m.fighter_b_nickname,
               ca.name AS a_name, ca.photo_key AS a_photo_key,
               cb.name AS b_name, cb.photo_key AS b_photo_key
        FROM matchups m
        JOIN celebrities ca ON ca.id = m.fighter_a_id
        JOIN celebrities cb ON cb.id = m.fighter_b_id
        WHERE m.active = true
        AND m.id NOT IN (
          SELECT matchup_id FROM daily_challenges
          WHERE matchup_id IS NOT NULL AND challenge_type = 'deathmatch'
          AND date >= ${BIWEEKLY_START}
        )
        ORDER BY RANDOM() LIMIT 1
      `;
      if (!matchup) {
        [matchup] = await sql`
          SELECT m.id, m.slug, m.tagline, m.matchup_type, m.difficulty,
                 m.fighter_a_nickname, m.fighter_b_nickname,
                 ca.name AS a_name, ca.photo_key AS a_photo_key,
                 cb.name AS b_name, cb.photo_key AS b_photo_key
          FROM matchups m
          JOIN celebrities ca ON ca.id = m.fighter_a_id
          JOIN celebrities cb ON cb.id = m.fighter_b_id
          WHERE m.active = true ORDER BY RANDOM() LIMIT 1
        `;
      }

      content = deathmatchBlock(matchup);
      intro = "Two legends enter. Seven rounds of trivia decide who walks out with the crown. Make your call.";
      closing = "50 matchups. 350 questions. All fact-checked, all waiting.";
      subject = `WHO DIS? #${editionNumber} — ${matchup.fighter_a_nickname} vs ${matchup.fighter_b_nickname}`;
      challengeMatchupId = matchup.id as number;
    } else if (editionType === "spotlight") {
      let [celeb] = await sql`
        SELECT id, name, category, era, hint_2, photo_key
        FROM celebrities
        WHERE active = true AND photo_type = 'bw'
          AND hint_2 IS NOT NULL AND hint_2 != ''
          AND id NOT IN (
            SELECT celebrity_id FROM daily_challenges
            WHERE celebrity_id IS NOT NULL AND challenge_type = 'spotlight'
            AND date >= ${BIWEEKLY_START}
          )
        ORDER BY RANDOM() LIMIT 1
      `;
      if (!celeb) {
        [celeb] = await sql`
          SELECT id, name, category, era, hint_2, photo_key
          FROM celebrities
          WHERE active = true AND photo_type = 'bw'
            AND hint_2 IS NOT NULL AND hint_2 != ''
          ORDER BY RANDOM() LIMIT 1
        `;
      }

      content = spotlightBlock(celeb);
      intro = "One photo. One clue. Can you name the icon before scrolling down?";
      closing = `This was <strong style="color:#ffba20">${esc(celeb.name)}</strong>. 459 B&amp;W photos live on The Wall.`;
      ctaText = "EXPLORE THE WALL";
      ctaUrl = `${BASE_URL}/screensaver`;
      subject = `WHO DIS? #${editionNumber} — Can You Name This Icon?`;
      challengeCelebId = celeb.id as number;
    } else {
      const [round] = await sql`
        SELECT mr.round_number, mr.round_label, mr.question_text, mr.matchup_id,
               m.slug, m.fighter_a_nickname, m.fighter_b_nickname
        FROM matchup_rounds mr
        JOIN matchups m ON m.id = mr.matchup_id
        WHERE m.active = true
        ORDER BY RANDOM() LIMIT 1
      `;

      content = triviaBlock(round, round);
      intro = "One question. Two possible answers. Make your pick right here.";
      closing = "The answer is in the fight. Seven rounds, one winner.";
      subject = `WHO DIS? #${editionNumber} — Quick Trivia`;
      challengeMatchupId = round.matchup_id as number;
    }

    // Record this send
    await sql`
      INSERT INTO daily_challenges (date, challenge_type, matchup_id, celebrity_id)
      VALUES (${today}, ${editionType}, ${challengeMatchupId}, ${challengeCelebId})
      ON CONFLICT (date) DO UPDATE SET
        challenge_type = EXCLUDED.challenge_type,
        matchup_id = EXCLUDED.matchup_id,
        celebrity_id = EXCLUDED.celebrity_id
    `;

    // Fetch subscribers
    const subscribers =
      await sql`SELECT email FROM daily_subscribers WHERE active = true`;

    if (subscribers.length === 0) {
      return NextResponse.json({
        sent: 0,
        message: "No active subscribers",
        edition: editionType,
        editionNumber,
      });
    }

    // Send in batches
    let sent = 0;
    const errors: string[] = [];

    for (let i = 0; i < subscribers.length; i += 50) {
      const batch = subscribers.slice(i, i + 50);
      const results = await Promise.allSettled(
        batch.map((sub) => {
          const unsubUrl = `${BASE_URL}/api/daily/unsubscribe?email=${encodeURIComponent(sub.email)}`;
          const html = wrapEmail(
            editionType === "deathmatch"
              ? "DEATHMATCH"
              : editionType === "spotlight"
                ? "ICON SPOTLIGHT"
                : "TRIVIA DROP",
            editionNumber,
            today,
            intro,
            content,
            closing,
            ctaText,
            ctaUrl,
            funFact,
            unsubUrl
          );
          return sendEmail(sub.email, subject, html);
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled" && r.value.success) {
          sent++;
        } else {
          const error =
            r.status === "fulfilled"
              ? r.value.error || "Send failed"
              : r.reason?.message || "Unknown error";
          errors.push(error);
        }
      }
    }

    return NextResponse.json({
      sent,
      total: subscribers.length,
      errors: errors.length,
      errorDetails: errors.slice(0, 5),
      edition: editionType,
      editionNumber,
      date: today,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Newsletter send error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
