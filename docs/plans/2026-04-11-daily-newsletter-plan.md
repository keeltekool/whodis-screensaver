# THE DAILY — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a daily newsletter challenge mode (THE DAILY) — subscribers get a daily email linking to a date-locked challenge that alternates between THE GAME and DEATHMATCH.

**Architecture:** Resend for email delivery, React Email for templates styled with our design system, Neon PostgreSQL for subscribers + daily challenge tracking, Vercel Cron for daily send trigger. New `/daily` landing page + `/daily/[date]` challenge route.

**Tech Stack:** Resend, React Email, Neon PostgreSQL (existing), Vercel Cron, Next.js 16 App Router

**Design doc:** `docs/plans/2026-04-11-daily-newsletter-design.md`

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install Resend + React Email**

```bash
cd C:\Users\Kasutaja\Claude_Projects\whodis-screensaver
npm install resend @react-email/components
```

**Step 2: Add Resend API key to .env.local**

```bash
# Add to .env.local:
RESEND_API_KEY=re_xxxxxxxxxxxx
```

Get the key from https://resend.com/api-keys (create account if needed).

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(daily): install resend + react-email dependencies"
```

---

## Task 2: Database Tables

**Files:**
- Create: `scripts/create-daily-tables.mjs`

**Step 1: Write migration script**

```js
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const sql = neon(process.env.DATABASE_URL);

async function createTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS daily_subscribers (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      subscribed_at TIMESTAMP DEFAULT NOW(),
      unsubscribed_at TIMESTAMP,
      active BOOLEAN DEFAULT true
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS daily_challenges (
      id SERIAL PRIMARY KEY,
      date DATE UNIQUE NOT NULL,
      challenge_type TEXT NOT NULL,
      celebrity_id INT,
      matchup_id INT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  console.log("Daily tables created.");
}

createTables().catch(console.error);
```

**Step 2: Run it**

```bash
node scripts/create-daily-tables.mjs
```

Expected: "Daily tables created."

**Step 3: Commit**

```bash
git add scripts/create-daily-tables.mjs
git commit -m "feat(daily): create subscribers + challenges DB tables"
```

---

## Task 3: Subscribe API Routes

**Files:**
- Create: `app/api/daily/subscribe/route.ts`
- Create: `app/api/daily/unsubscribe/route.ts`

**Step 1: Subscribe endpoint**

```ts
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const sql = getDb();

    // Upsert — reactivate if previously unsubscribed
    await sql`
      INSERT INTO daily_subscribers (email, active)
      VALUES (${email.toLowerCase().trim()}, true)
      ON CONFLICT (email) DO UPDATE SET
        active = true,
        unsubscribed_at = NULL,
        subscribed_at = NOW()
    `;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Subscribe error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 2: Unsubscribe endpoint**

```ts
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const sql = getDb();

    await sql`
      UPDATE daily_subscribers
      SET active = false, unsubscribed_at = NOW()
      WHERE email = ${email.toLowerCase().trim()}
    `;

    // Return a simple HTML page confirming unsubscribe
    return new Response(
      `<html><body style="background:#131313;color:#e5e2e1;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1 style="color:#ffba20">WHO DIS?</h1><p>You've been unsubscribed from THE DAILY.</p><p style="color:#666">You can resubscribe anytime at the site.</p></div></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 3: Commit**

```bash
git add app/api/daily/
git commit -m "feat(daily): add subscribe + unsubscribe API routes"
```

---

## Task 4: Daily Challenge Generation API

**Files:**
- Create: `app/api/daily/challenge/route.ts`
- Create: `lib/daily.ts`

**Step 1: Create daily logic helper — `lib/daily.ts`**

```ts
// Launch date — day 1 of THE DAILY
export const DAILY_LAUNCH_DATE = "2026-04-12";

export function getDayNumber(dateStr: string): number {
  const launch = new Date(DAILY_LAUNCH_DATE);
  const target = new Date(dateStr);
  const diff = Math.floor((target.getTime() - launch.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1; // Day 1, 2, 3...
}

export function getChallengeType(dayNumber: number): "game" | "deathmatch" {
  return dayNumber % 2 === 1 ? "game" : "deathmatch";
}

export function getTodayDateStr(): string {
  return new Date().toISOString().split("T")[0];
}
```

**Step 2: Create challenge API — `app/api/daily/challenge/route.ts`**

This route: checks if today's challenge exists → if not, generates one (picking unused content) → returns it.

```ts
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import { getDayNumber, getChallengeType, getTodayDateStr } from "@/lib/daily";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date") || getTodayDateStr();
    const sql = getDb();

    // Check if challenge already generated for this date
    const [existing] = await sql`
      SELECT * FROM daily_challenges WHERE date = ${dateParam}
    `;

    if (existing) {
      return NextResponse.json(existing);
    }

    // Generate new challenge
    const dayNumber = getDayNumber(dateParam);
    if (dayNumber < 1) {
      return NextResponse.json({ error: "Date is before launch" }, { status: 400 });
    }

    const type = getChallengeType(dayNumber);

    if (type === "game") {
      // Pick a BW celebrity not yet used in daily_challenges
      const [celeb] = await sql`
        SELECT c.id FROM celebrities c
        WHERE c.active = true AND c.photo_type = 'bw'
        AND c.id NOT IN (SELECT celebrity_id FROM daily_challenges WHERE celebrity_id IS NOT NULL)
        ORDER BY RANDOM() LIMIT 1
      `;

      if (!celeb) {
        // Pool exhausted — reset by picking any random
        const [fallback] = await sql`
          SELECT id FROM celebrities WHERE active = true AND photo_type = 'bw' ORDER BY RANDOM() LIMIT 1
        `;
        const [challenge] = await sql`
          INSERT INTO daily_challenges (date, challenge_type, celebrity_id)
          VALUES (${dateParam}, 'game', ${fallback.id})
          RETURNING *
        `;
        return NextResponse.json(challenge);
      }

      const [challenge] = await sql`
        INSERT INTO daily_challenges (date, challenge_type, celebrity_id)
        VALUES (${dateParam}, 'game', ${celeb.id})
        RETURNING *
      `;
      return NextResponse.json(challenge);

    } else {
      // Pick a matchup not yet used in daily_challenges
      const [matchup] = await sql`
        SELECT m.id FROM matchups m
        WHERE m.active = true
        AND m.id NOT IN (SELECT matchup_id FROM daily_challenges WHERE matchup_id IS NOT NULL)
        ORDER BY RANDOM() LIMIT 1
      `;

      if (!matchup) {
        const [fallback] = await sql`
          SELECT id FROM matchups WHERE active = true ORDER BY RANDOM() LIMIT 1
        `;
        const [challenge] = await sql`
          INSERT INTO daily_challenges (date, challenge_type, matchup_id)
          VALUES (${dateParam}, 'deathmatch', ${fallback.id})
          RETURNING *
        `;
        return NextResponse.json(challenge);
      }

      const [challenge] = await sql`
        INSERT INTO daily_challenges (date, challenge_type, matchup_id)
        VALUES (${dateParam}, 'deathmatch', ${matchup.id})
        RETURNING *
      `;
      return NextResponse.json(challenge);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Daily challenge error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 3: Commit**

```bash
git add lib/daily.ts app/api/daily/challenge/route.ts
git commit -m "feat(daily): add challenge generation API with no-repeat logic"
```

---

## Task 5: Email Template

**Files:**
- Create: `emails/daily-challenge.tsx`

**Step 1: Create the React Email template**

```tsx
import {
  Html, Head, Body, Container, Section, Text, Button, Hr, Img,
} from "@react-email/components";

interface DailyChallengeEmailProps {
  date: string;
  dayNumber: number;
  challengeType: "game" | "deathmatch";
  teaser: string;
  challengeUrl: string;
  unsubscribeUrl: string;
}

export default function DailyChallengeEmail({
  date, dayNumber, challengeType, teaser, challengeUrl, unsubscribeUrl,
}: DailyChallengeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#131313", margin: 0, padding: 0, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
        <Container style={{ maxWidth: "500px", margin: "0 auto", padding: "40px 20px" }}>
          <Text style={{ color: "#ffba20", fontSize: "12px", letterSpacing: "3px", textTransform: "uppercase" as const, textAlign: "center" as const, margin: "0 0 8px" }}>
            WHO DIS? — THE DAILY
          </Text>
          <Text style={{ color: "#e5e2e1", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase" as const, textAlign: "center" as const, margin: "0 0 32px", opacity: 0.5 }}>
            {date} · #{dayNumber}
          </Text>

          <Section style={{ backgroundColor: "#1c1b1b", padding: "32px 24px", textAlign: "center" as const }}>
            <Text style={{ color: "#ffba20", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase" as const, margin: "0 0 16px" }}>
              {challengeType === "game" ? "TODAY'S CELEBRITY" : "TODAY'S DEATHMATCH"}
            </Text>
            <Text style={{ color: "#e5e2e1", fontSize: "18px", lineHeight: "1.4", margin: "0 0 24px", fontStyle: "italic" }}>
              {teaser}
            </Text>
            <Button
              href={challengeUrl}
              style={{
                backgroundColor: "#ffba20",
                color: "#131313",
                fontSize: "14px",
                fontWeight: "bold",
                letterSpacing: "1px",
                textTransform: "uppercase" as const,
                padding: "16px 40px",
                textDecoration: "none",
              }}
            >
              PLAY TODAY'S CHALLENGE →
            </Button>
          </Section>

          <Hr style={{ borderColor: "#2a2a2a", margin: "32px 0" }} />

          <Text style={{ color: "#666", fontSize: "11px", textAlign: "center" as const, lineHeight: "1.6" }}>
            You're receiving this because you subscribed at whodis-screensaver.vercel.app
          </Text>
          <Text style={{ textAlign: "center" as const, margin: "8px 0 0" }}>
            <a href={unsubscribeUrl} style={{ color: "#666", fontSize: "11px", textDecoration: "underline" }}>
              Unsubscribe
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

**Step 2: Commit**

```bash
git add emails/daily-challenge.tsx
git commit -m "feat(daily): add React Email template with neo-noir design"
```

---

## Task 6: Email Send API (Cron Trigger)

**Files:**
- Create: `app/api/daily/send/route.ts`

**Step 1: Create the send endpoint**

This is called by Vercel Cron daily. It generates today's challenge, fetches all active subscribers, and sends the email.

```ts
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getDayNumber, getChallengeType, getTodayDateStr } from "@/lib/daily";
import DailyChallengeEmail from "@/emails/daily-challenge";

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = "https://whodis-screensaver.vercel.app";

export async function POST(req: Request) {
  try {
    // Verify cron secret to prevent unauthorized triggers
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getDb();
    const today = getTodayDateStr();
    const dayNumber = getDayNumber(today);
    const type = getChallengeType(dayNumber);

    // Generate today's challenge (idempotent — won't duplicate)
    const challengeRes = await fetch(`${BASE_URL}/api/daily/challenge?date=${today}`);
    const challenge = await challengeRes.json();

    // Build teaser text
    let teaser = "";
    if (type === "game") {
      const [celeb] = await sql`SELECT hint_1 FROM celebrities WHERE id = ${challenge.celebrity_id}`;
      teaser = celeb?.hint_1 || "Can you guess today's celebrity?";
    } else {
      const [matchup] = await sql`SELECT tagline, fighter_a_nickname, fighter_b_nickname FROM matchups WHERE id = ${challenge.matchup_id}`;
      teaser = matchup ? `"${matchup.fighter_a_nickname}" vs "${matchup.fighter_b_nickname}" — ${matchup.tagline}` : "Today's deathmatch awaits.";
    }

    // Fetch active subscribers
    const subscribers = await sql`SELECT email FROM daily_subscribers WHERE active = true`;

    if (subscribers.length === 0) {
      return NextResponse.json({ sent: 0, message: "No active subscribers" });
    }

    // Send emails in batches of 50
    let sent = 0;
    for (let i = 0; i < subscribers.length; i += 50) {
      const batch = subscribers.slice(i, i + 50);
      await Promise.all(
        batch.map((sub) =>
          resend.emails.send({
            from: "WHO DIS? <daily@whodis.app>",
            to: sub.email,
            subject: `WHO DIS? Daily #${dayNumber} — ${type === "game" ? "Guess the Celebrity" : "Deathmatch"}`,
            react: DailyChallengeEmail({
              date: today,
              dayNumber,
              challengeType: type,
              teaser,
              challengeUrl: `${BASE_URL}/daily/${today}`,
              unsubscribeUrl: `${BASE_URL}/api/daily/unsubscribe?email=${encodeURIComponent(sub.email)}`,
            }),
          })
        )
      );
      sent += batch.length;
    }

    return NextResponse.json({ sent, date: today, type, dayNumber });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Daily send error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 2: Add CRON_SECRET to .env.local**

```
CRON_SECRET=your-random-secret-here
```

**Step 3: Commit**

```bash
git add app/api/daily/send/route.ts
git commit -m "feat(daily): add email send API with Resend + batch sending"
```

---

## Task 7: Vercel Cron Config

**Files:**
- Create: `vercel.json`

**Step 1: Create cron configuration**

```json
{
  "crons": [
    {
      "path": "/api/daily/send",
      "schedule": "0 7 * * *"
    }
  ]
}
```

This triggers daily at 7:00 AM UTC.

**Step 2: Commit**

```bash
git add vercel.json
git commit -m "feat(daily): add Vercel Cron for daily 7AM UTC email send"
```

---

## Task 8: Daily Landing Page (`/daily`)

**Files:**
- Create: `app/daily/page.tsx`

The subscribe landing page with description, preview, and email form.

**Step 1: Create the page**

Build a client component with:
- Hero section: "THE DAILY" heading, description copy
- How it works: 3 steps (subscribe → get email → play)
- Email input form with subscribe button
- Success state after subscribing

**Step 2: Commit**

```bash
git add app/daily/page.tsx
git commit -m "feat(daily): add subscribe landing page"
```

---

## Task 9: Daily Challenge Page (`/daily/[date]`)

**Files:**
- Create: `app/daily/[date]/page.tsx`

**Step 1: Create the challenge page**

This page:
- Fetches `/api/daily/challenge?date=[date]`
- If challenge_type is "game": renders a single-round game (reuse existing game components)
- If challenge_type is "deathmatch": redirects to `/deathmatch/[slug]` with a daily banner
- If date is in the future: shows "come back tomorrow"
- If date is before launch: shows "not available"

**Step 2: Commit**

```bash
git add app/daily/
git commit -m "feat(daily): add daily challenge page with game/deathmatch routing"
```

---

## Task 10: Hub Integration

**Files:**
- Modify: `app/page.tsx`

**Step 1: Add THE DAILY card**

Add between the experiences grid and The Vault, as its own section:

```tsx
<section className="px-4 md:px-8 pb-10 md:pb-16 max-w-5xl mx-auto w-full">
  <h2 className="font-label text-xs font-extrabold uppercase tracking-[0.2em] text-on-surface-variant mb-6">
    The Daily
  </h2>
  <ExperienceCard
    label="WHO DIS? — THE DAILY"
    title="THE DAILY"
    description="One challenge. Every day. Same for everyone. Subscribe and get a daily celebrity challenge delivered to your inbox. Game or Deathmatch — alternating, never repeating."
    ctaText="SUBSCRIBE →"
    href="/daily"
  />
</section>
```

**Step 2: Add soft nudge to game result screens**

Add a small subscribe prompt to `components/FightResult.tsx` and the game summary (in the who-dis app, future task).

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat(daily): add THE DAILY card to hub page"
```

---

## Task 11: Resend Domain Setup + Deploy

**Step 1: Create Resend account and get API key**

Go to https://resend.com, sign up, get API key, add to Vercel env vars:
- `RESEND_API_KEY`
- `CRON_SECRET`

**Step 2: Configure sender domain**

For production emails, configure a verified domain in Resend (or use the default `onboarding@resend.dev` for testing).

**Step 3: Build + Deploy**

```bash
npm run build
vercel --prod
```

**Step 4: Test the full flow**

1. Visit `/daily` → subscribe with your email
2. Trigger send manually: `curl -X POST https://whodis-screensaver.vercel.app/api/daily/send -H "Authorization: Bearer YOUR_CRON_SECRET"`
3. Check inbox for the email
4. Click through to the daily challenge
5. Play it
6. Unsubscribe via email footer link

**Step 5: Commit any fixes**

---

## Summary

| Task | What |
|------|------|
| 1 | Install Resend + React Email |
| 2 | DB tables (subscribers + challenges) |
| 3 | Subscribe/unsubscribe API routes |
| 4 | Challenge generation API (no-repeat logic) |
| 5 | React Email template (neo-noir) |
| 6 | Email send API (Resend + batching) |
| 7 | Vercel Cron config |
| 8 | Subscribe landing page (`/daily`) |
| 9 | Daily challenge page (`/daily/[date]`) |
| 10 | Hub integration (new card + nudge) |
| 11 | Resend setup + deploy + test |
