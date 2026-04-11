# WHO DIS? — THE DAILY (Newsletter + Daily Challenge)

## Design Document
**Date:** 2026-04-11
**Status:** Approved — awaiting implementation

---

## 1. Overview

THE DAILY is a daily newsletter + in-app challenge mode. One challenge per day, same for everyone. Alternates between THE GAME (guess the celebrity from a photo) and DEATHMATCH (7-question matchup). Email delivers the hook, app delivers the game.

---

## 2. Subscribe Touchpoints

1. **Hub card** — "THE DAILY" as a new experience card on the hub, links to `/daily`
2. **Landing page** (`/daily`) — describes the concept, shows preview, email subscribe form
3. **Soft nudge** — small subscribe prompt on game result/summary screens (non-intrusive, not its own screen)

---

## 3. The Email

- Sent daily via **Resend** API
- Built with **React Email** using Who Dis? design system (neo-noir, `#131313` bg, `#ffba20` accents, Space Grotesk + Manrope)
- Contains: date, teaser (celebrity silhouette or matchup tagline), CTA button linking to `/daily/2026-04-12`
- Unsubscribe link in footer (Resend handles compliance)
- No game content in the email — just the hook to drive clicks

---

## 4. The Daily Challenge Page

### Route: `/daily/[date]`

- **Game day:** Single-round photo grid challenge. Same mechanics as THE GAME but one celebrity, one round. Score 0-3.
- **Deathmatch day:** Full 7-question matchup. Same mechanics as DEATHMATCH. Score 0-7.
- Date-locked — visiting yesterday's URL still works (archive). Visiting tomorrow's returns "come back tomorrow."
- `/daily` with no date redirects to today's challenge.

### Content Selection

- Strict alternating: odd days = Game, even days = Deathmatch (based on day count from launch date)
- **Game days:** Pick 1 celebrity from the 143 BW pool, date-seeded, tracked in DB so no repeats
- **Deathmatch days:** Pick 1 matchup from the 50, date-seeded, tracked in DB so no repeats
- 143 game celebrities + 50 matchups = **193 unique days** before any content repeats
- After pool exhaustion, reshuffle and restart

---

## 5. Data Model

```sql
CREATE TABLE daily_subscribers (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  unsubscribed_at TIMESTAMP,
  active BOOLEAN DEFAULT true
);

CREATE TABLE daily_challenges (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  challenge_type TEXT NOT NULL,  -- 'game' or 'deathmatch'
  celebrity_id INT,              -- for game days (references celebrities.id)
  matchup_id INT,                -- for deathmatch days (references matchups.id)
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 6. Tech Stack

| Component | Tool | Free Tier |
|-----------|------|-----------|
| Email delivery | **Resend** | 3,000 emails/month |
| Email templates | **React Email** | Open source |
| Subscriber DB | **Neon PostgreSQL** (existing) | Shared with app |
| Daily cron | **Vercel Cron** or external trigger | Vercel: 1/day free |

This pattern (Resend + React Email + own subscriber table) is reusable across other projects (EUDI Wallet tracker, etc).

---

## 7. Hub Integration

New experience card on the hub page:

```
Label:       WHO DIS? — THE DAILY
Title:       THE DAILY
Description: One challenge. Every day. Same for everyone.
             Subscribe and prove you know your icons.
CTA:         SUBSCRIBE →
Route:       /daily
```

Position: either as a 5th card in the grid (making it "Five Ways In") or as a standalone section between the experiences grid and The Vault.

---

## 8. Email Content Structure

```
┌──────────────────────────────────────┐
│  WHO DIS? — THE DAILY                │
│  April 12, 2026 · #47                │
│                                      │
│  TODAY'S CHALLENGE                   │
│                                      │
│  [Silhouette/teaser image]           │
│                                      │
│  "One of them scored 100 points      │
│   in a single game..."              │
│                                      │
│  [ PLAY TODAY'S CHALLENGE → ]        │
│                                      │
│  ─────────────────────────────       │
│  You're receiving this because you   │
│  subscribed at whodis.app            │
│  [Unsubscribe]                       │
└──────────────────────────────────────┘
```

---

## 9. API Routes Needed

```
POST /api/daily/subscribe     — add email to subscribers
POST /api/daily/unsubscribe   — mark email inactive
GET  /api/daily/[date]        — get today's challenge (type + content)
POST /api/daily/send          — cron-triggered: generate challenge + send emails
```

---

## 10. What's NOT in MVP

- No user accounts — subscribe by email only
- No in-email gameplay — always links to app
- No streak tracking (future addition)
- No social sharing of daily scores (future addition)
- No premium tier
