# Resend → Brevo Email Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Resend email provider with Brevo so daily newsletter can send to 100+ real subscribers on the free tier (300/day).

**Architecture:** Single-file send route swap from Resend SDK to Brevo REST API (`fetch`). All other routes, DB, cron, templates untouched. No new dependencies — removing two (`resend`, `@react-email/components`).

**Tech Stack:** Brevo Transactional Email API v3, Next.js 16, Neon Postgres, Vercel Cron

---

### Task 1: Brevo Account Setup (User-Guided)

**This task requires user interaction — walk them through step by step.**

**Step 1: Create Brevo account**
- Go to https://app.brevo.com/account/register
- Sign up with email + organization name
- No credit card required
- Confirm email verification link

**Step 2: Get API key**
- Dashboard → Settings (gear icon top-right) → SMTP & API → API Keys
- Click "Generate a new API key"
- Name it `whodis-daily`
- Copy the key (starts with `xkeysib-`)

**Step 3: Verify sender**
- Dashboard → Settings → Senders, Domains & Dedicated IPs → Senders
- Click "Add a sender"
- Name: `WHO DIS?`
- Email: use an email address on a domain you control, OR your personal email
- Brevo sends a verification email — click the link
- Alternative: verify full domain under "Domains" tab (adds DKIM/SPF DNS records for better deliverability)

**Step 4: Add env vars**

Add to `.env.local`:
```
BREVO_API_KEY=xkeysib-your-key-here
BREVO_SENDER_EMAIL=your-verified-sender@domain.com
```

Add to Vercel:
```bash
printf 'xkeysib-your-key-here' | vercel env add BREVO_API_KEY production preview development
printf 'your-verified-sender@domain.com' | vercel env add BREVO_SENDER_EMAIL production preview development
```

**Step 5: Commit env template update**

---

### Task 2: Remove Resend Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Remove packages**

```bash
cd C:\Users\Kasutaja\Claude_Projects\whodis-screensaver
npm uninstall resend @react-email/components
```

**Step 2: Verify package.json no longer contains resend or @react-email/components**

Run: `grep -i resend package.json`
Expected: no output

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove resend and react-email dependencies"
```

---

### Task 3: Rewrite Send Route for Brevo

**Files:**
- Modify: `app/api/daily/send/route.ts` (full file)

**Step 1: Replace the entire send route**

```typescript
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import { getDayNumber, getTodayDateStr } from "@/lib/daily";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://whodis-screensaver.vercel.app";

async function sendBrevoEmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY!,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "WHO DIS?",
          email: process.env.BREVO_SENDER_EMAIL!,
        },
        to: [{ email: to }],
        subject,
        htmlContent,
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
      error: err instanceof Error ? err.message : "Unknown send error",
    };
  }
}

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

          return sendBrevoEmail(
            sub.email,
            `WHO DIS? Daily #${dayNumber} — Deathmatch`,
            html
          );
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
      date: today,
      dayNumber,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Daily send error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: no TypeScript errors, no build errors

**Step 3: Commit**

```bash
git add app/api/daily/send/route.ts
git commit -m "feat: replace resend with brevo transactional email API"
```

---

### Task 4: Update STACK.md

**Files:**
- Modify: `STACK.md`

**Step 1: Update services table**

Add Brevo row, remove any Resend reference:

```markdown
| Brevo | Daily newsletter email delivery (free: 300/day) | `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` |
```

**Step 2: Update post-deploy smoke tests**

Add email test:
```markdown
5. Trigger daily send manually: `curl -X POST https://whodis-screensaver.vercel.app/api/daily/send -H "Authorization: Bearer $CRON_SECRET"` — verify subscriber receives email
```

**Step 3: Commit**

```bash
git add STACK.md
git commit -m "docs: update STACK.md with brevo service"
```

---

### Task 5: Update Global STACK.md + Memory

**Files:**
- Modify: Global `STACK.md` at standard location
- Modify: Memory index if needed

**Step 1: Add Brevo to global services**

**Step 2: Commit**

---

### Task 6: Test Send (Manual Verification)

**Step 1: Local test — send to yourself**

```bash
curl -X POST http://localhost:3002/api/daily/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer whodis-daily-cron-1775920106"
```

Expected: JSON response with `sent: 1` (or however many active subscribers). Check inbox for email delivery.

**Step 2: Deploy to Vercel**

```bash
cd C:\Users\Kasutaja\Claude_Projects\whodis-screensaver
vercel --prod
```

**Step 3: Production test**

```bash
curl -X POST https://whodis-screensaver.vercel.app/api/daily/send \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Step 4: Verify email received**
- Check inbox (not spam)
- Verify neo-noir styling renders
- Verify "PLAY TODAY'S CHALLENGE" link works
- Verify unsubscribe link works

**Step 5: Browser verification via chrome-devtools MCP**
- Navigate to https://whodis-screensaver.vercel.app/daily
- Subscribe with a test email
- Check network tab — subscribe call succeeds
- Trigger send again — verify new subscriber receives email

---

### Task 7: Update Newsletter Design Doc

**Files:**
- Modify: `docs/plans/2026-04-11-daily-newsletter-design.md`

**Step 1: Update tech stack table**

Replace Resend references with Brevo in sections 3 and 6.

**Step 2: Commit**

```bash
git add docs/plans/
git commit -m "docs: update newsletter design doc for brevo migration"
```
