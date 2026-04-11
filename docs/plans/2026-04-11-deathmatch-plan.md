# Deathmatch Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a versus quiz mode (Mode #5) to the Who Dis? hub where two celebrities face off across 7 trivia questions.

**Architecture:** New `/deathmatch` route in the whodis-screensaver Next.js app. Two new Neon DB tables (`matchups`, `matchup_rounds`). Three new API routes. Client-side state via localStorage. All content seeded from a JSON file.

**Tech Stack:** Next.js 16, React 19, Tailwind 4, Neon Postgres (`@neondatabase/serverless`), TypeScript. No new dependencies.

**Design doc:** `docs/plans/2026-04-11-deathmatch-design.md`

---

## Task 1: Database Schema

**Files:**
- Create: `scripts/create-deathmatch-tables.mjs`

**Step 1: Write the migration script**

```js
import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL);

async function createTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS matchups (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      fighter_a_id INT NOT NULL,
      fighter_b_id INT NOT NULL,
      fighter_a_nickname TEXT,
      fighter_b_nickname TEXT,
      tagline TEXT NOT NULL,
      matchup_type TEXT NOT NULL,
      difficulty INT DEFAULT 2,
      sort_order INT DEFAULT 0,
      active BOOLEAN DEFAULT true
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS matchup_rounds (
      id SERIAL PRIMARY KEY,
      matchup_id INT REFERENCES matchups(id) ON DELETE CASCADE,
      round_number INT NOT NULL,
      round_label TEXT NOT NULL,
      question_text TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      explanation TEXT NOT NULL,
      fun_fact TEXT,
      UNIQUE(matchup_id, round_number)
    )
  `;

  console.log("Deathmatch tables created.");
}

createTables().catch(console.error);
```

**Step 2: Run it**

```bash
cd C:\Users\Kasutaja\Claude_Projects\whodis-screensaver
node scripts/create-deathmatch-tables.mjs
```

Expected: "Deathmatch tables created."

**Step 3: Commit**

```bash
git add scripts/create-deathmatch-tables.mjs
git commit -m "feat(deathmatch): create matchups + matchup_rounds tables"
```

---

## Task 2: Seed Data — Matchups JSON + Seed Script

**Files:**
- Create: `content/deathmatch-matchups.json`
- Create: `scripts/seed-deathmatch.mjs`

**Step 1: Create the matchups JSON**

Structure for all 30 matchups. Each matchup contains the slug, fighter names (must match `celebrities.name` exactly), nicknames, tagline, type, difficulty, and 7 rounds with questions.

```json
[
  {
    "slug": "stallone-vs-schwarzenegger",
    "fighter_a_name": "Sylvester Stallone",
    "fighter_b_name": "Arnold Schwarzenegger",
    "fighter_a_nickname": "The Italian Stallion",
    "fighter_b_nickname": "The Austrian Oak",
    "tagline": "The Ultimate 80s Action Showdown",
    "matchup_type": "rivalry",
    "difficulty": 2,
    "rounds": [
      {
        "round_number": 1,
        "round_label": "ORIGIN STORY",
        "question_text": "One of these men was so broke he sold his dog for $40 — then bought it back for $15,000 after his first film was greenlit. Which one?",
        "correct_answer": "a",
        "explanation": "Stallone sold his bull mastiff Butkus before Rocky was greenlit. He was offered $350,000 for the script but refused to sell unless he could star.",
        "fun_fact": "He bought the dog back for $15,000 from the guy outside a 7-Eleven."
      }
    ]
  }
]
```

This file will contain all 30 matchups × 7 rounds = 210 questions. **This is the content authoring task — the heaviest lift of the entire build.** Start with 3-5 complete matchups for MVP testing, then fill the rest.

**Step 2: Write the seed script**

```js
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL);
const matchups = JSON.parse(readFileSync("content/deathmatch-matchups.json", "utf-8"));

async function seed() {
  for (const m of matchups) {
    // Look up fighter IDs from celebrities table (use first match with bw photo_type for game entries)
    const [fighterA] = await sql`
      SELECT id FROM celebrities WHERE name = ${m.fighter_a_name} AND photo_type = 'bw' LIMIT 1
    `;
    const [fighterB] = await sql`
      SELECT id FROM celebrities WHERE name = ${m.fighter_b_name} AND photo_type = 'bw' LIMIT 1
    `;

    // Fallback: try any photo_type if bw not found
    const aId = fighterA?.id || (await sql`SELECT id FROM celebrities WHERE name = ${m.fighter_a_name} LIMIT 1`)[0]?.id;
    const bId = fighterB?.id || (await sql`SELECT id FROM celebrities WHERE name = ${m.fighter_b_name} LIMIT 1`)[0]?.id;

    if (!aId || !bId) {
      console.warn(`SKIP: ${m.slug} — fighter not found (a=${m.fighter_a_name}:${aId}, b=${m.fighter_b_name}:${bId})`);
      continue;
    }

    // Upsert matchup
    const [matchup] = await sql`
      INSERT INTO matchups (slug, fighter_a_id, fighter_b_id, fighter_a_nickname, fighter_b_nickname, tagline, matchup_type, difficulty, sort_order)
      VALUES (${m.slug}, ${aId}, ${bId}, ${m.fighter_a_nickname}, ${m.fighter_b_nickname}, ${m.tagline}, ${m.matchup_type}, ${m.difficulty}, ${matchups.indexOf(m)})
      ON CONFLICT (slug) DO UPDATE SET
        fighter_a_id = EXCLUDED.fighter_a_id,
        fighter_b_id = EXCLUDED.fighter_b_id,
        fighter_a_nickname = EXCLUDED.fighter_a_nickname,
        fighter_b_nickname = EXCLUDED.fighter_b_nickname,
        tagline = EXCLUDED.tagline,
        matchup_type = EXCLUDED.matchup_type,
        difficulty = EXCLUDED.difficulty,
        sort_order = EXCLUDED.sort_order
      RETURNING id
    `;

    // Delete old rounds and insert new
    await sql`DELETE FROM matchup_rounds WHERE matchup_id = ${matchup.id}`;

    for (const r of m.rounds) {
      await sql`
        INSERT INTO matchup_rounds (matchup_id, round_number, round_label, question_text, correct_answer, explanation, fun_fact)
        VALUES (${matchup.id}, ${r.round_number}, ${r.round_label}, ${r.question_text}, ${r.correct_answer}, ${r.explanation}, ${r.fun_fact})
      `;
    }

    console.log(`Seeded: ${m.slug} (${m.rounds.length} rounds)`);
  }

  console.log("Done.");
}

seed().catch(console.error);
```

**Step 3: Seed the initial matchups**

```bash
node scripts/seed-deathmatch.mjs
```

Expected: "Seeded: stallone-vs-schwarzenegger (7 rounds)" etc.

**Step 4: Commit**

```bash
git add content/deathmatch-matchups.json scripts/seed-deathmatch.mjs
git commit -m "feat(deathmatch): add matchup content JSON + seed script"
```

---

## Task 3: Types + localStorage Persistence

**Files:**
- Modify: `lib/types.ts` — add deathmatch types
- Create: `lib/deathmatch.ts` — verdict logic, share card, localStorage

**Step 1: Add types to `lib/types.ts`**

Append to existing file:

```ts
export type Matchup = {
  id: number;
  slug: string;
  fighter_a: { id: number; name: string; photo_key: string; nickname: string };
  fighter_b: { id: number; name: string; photo_key: string; nickname: string };
  tagline: string;
  matchup_type: string;
  difficulty: number;
};

export type MatchupRound = {
  round_number: number;
  round_label: string;
  question_text: string;
};

export type MatchupRoundAnswer = MatchupRound & {
  correct_answer: "a" | "b";
  explanation: string;
  fun_fact: string | null;
};

export type FightResult = {
  accuracy: number;
  total: number;
  fight_score_a: number;
  fight_score_b: number;
  winner: "a" | "b" | "draw";
  verdict: string;
  date: string;
  answers: ("a" | "b")[];
  correct: boolean[];
};

export type DeathmatchRecord = {
  results: Record<string, FightResult>;
  fights_played: number;
  overall_correct: number;
  overall_total: number;
  best_score: number;
};
```

**Step 2: Create `lib/deathmatch.ts`**

```ts
import { FightResult, DeathmatchRecord } from "./types";

const STORAGE_KEY = "whodis-deathmatch";

// --- Verdicts ---

export function getVerdict(accuracy: number): string {
  if (accuracy === 7) return "KNOCKOUT";
  if (accuracy >= 5) return "DECISION";
  if (accuracy >= 3) return "SPLIT DECISION";
  return "TKO";
}

export function getRank(overallAccuracy: number): string {
  if (overallAccuracy >= 0.9) return "Hall of Famer";
  if (overallAccuracy >= 0.8) return "Pop Culture Surgeon";
  if (overallAccuracy >= 0.7) return "Pit Wall Analyst";
  if (overallAccuracy >= 0.6) return "Armchair Expert";
  if (overallAccuracy >= 0.5) return "Lucky Guesser";
  return "Tourist";
}

// --- Share card ---

export function generateShareCard(
  fighterA: string,
  fighterB: string,
  result: FightResult
): string {
  const emojis = result.correct.map((c) => (c ? "🟨" : "⬛")).join("");
  const winnerName = result.winner === "a" ? fighterA : result.winner === "b" ? fighterB : "DRAW";
  return [
    "WHO DIS? DEATHMATCH ⚡",
    `${fighterA} vs ${fighterB}`,
    `${result.verdict}: ${winnerName} wins ${result.fight_score_a}–${result.fight_score_b}`,
    `${result.accuracy}/${result.total} correct`,
    emojis,
  ].join("\n");
}

// --- localStorage ---

export function loadRecord(): DeathmatchRecord {
  if (typeof window === "undefined") {
    return { results: {}, fights_played: 0, overall_correct: 0, overall_total: 0, best_score: 0 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { results: {}, fights_played: 0, overall_correct: 0, overall_total: 0, best_score: 0 };
    return JSON.parse(raw);
  } catch {
    return { results: {}, fights_played: 0, overall_correct: 0, overall_total: 0, best_score: 0 };
  }
}

export function saveResult(slug: string, result: FightResult): DeathmatchRecord {
  const record = loadRecord();
  const isNew = !record.results[slug];
  record.results[slug] = result;
  if (isNew) {
    record.fights_played += 1;
    record.overall_correct += result.accuracy;
    record.overall_total += result.total;
  } else {
    // Recalculate from all results
    let correct = 0;
    let total = 0;
    for (const r of Object.values(record.results)) {
      correct += r.accuracy;
      total += r.total;
    }
    record.overall_correct = correct;
    record.overall_total = total;
    record.fights_played = Object.keys(record.results).length;
  }
  record.best_score = Math.max(record.best_score, result.accuracy);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  return record;
}
```

**Step 3: Commit**

```bash
git add lib/types.ts lib/deathmatch.ts
git commit -m "feat(deathmatch): add types, verdict logic, localStorage persistence"
```

---

## Task 4: API Routes

**Files:**
- Create: `app/api/deathmatch/route.ts`
- Create: `app/api/deathmatch/[slug]/route.ts`
- Create: `app/api/deathmatch/[slug]/answer/route.ts`

**Step 1: List all matchups — `app/api/deathmatch/route.ts`**

```ts
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
```

**Step 2: Get matchup detail — `app/api/deathmatch/[slug]/route.ts`**

```ts
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

    // Get rounds — do NOT return correct_answer or explanation
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
```

**Step 3: Answer validation — `app/api/deathmatch/[slug]/answer/route.ts`**

```ts
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { round_number, answer } = body;

    if (!round_number || !answer || !["a", "b"].includes(answer)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const sql = getDb();

    const [round] = await sql`
      SELECT mr.correct_answer, mr.explanation, mr.fun_fact
      FROM matchup_rounds mr
      JOIN matchups m ON m.id = mr.matchup_id
      WHERE m.slug = ${slug} AND mr.round_number = ${round_number}
    `;

    if (!round) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 });
    }

    return NextResponse.json({
      correct: answer === round.correct_answer,
      correct_answer: round.correct_answer,
      explanation: round.explanation,
      fun_fact: round.fun_fact,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Deathmatch answer API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 4: Commit**

```bash
git add app/api/deathmatch/
git commit -m "feat(deathmatch): add API routes — list, detail, answer"
```

---

## Task 5: Fight Card Wall Page (`/deathmatch`)

**Files:**
- Create: `components/FightCard.tsx`
- Create: `app/deathmatch/page.tsx`

**Step 1: Create `components/FightCard.tsx`**

The matchup card for the wall. Two photos side by side, tagline, difficulty stars, play state.

```tsx
"use client";

import { Matchup } from "@/lib/types";

interface FightCardProps {
  matchup: Matchup;
  photoBaseUrl: string;
  played: boolean;
  accuracy?: number;
}

export default function FightCard({ matchup, photoBaseUrl, played, accuracy }: FightCardProps) {
  const { fighter_a, fighter_b, tagline, difficulty } = matchup;
  const stars = "★".repeat(difficulty) + "☆".repeat(3 - difficulty);

  return (
    <a
      href={`/deathmatch/${matchup.slug}`}
      className={`block bg-surface-container-low transition-all hover:bg-surface-container-high ${played ? "opacity-60" : ""}`}
    >
      {/* Fighter photos */}
      <div className="flex">
        <div className="flex-1 aspect-square overflow-hidden relative">
          <img
            src={`${photoBaseUrl}/photos/${fighter_a.photo_key}`}
            alt={fighter_a.name}
            className="w-full h-full object-cover photo-filter"
          />
        </div>
        <div className="w-[2px] bg-primary-fixed-dim flex-shrink-0" />
        <div className="flex-1 aspect-square overflow-hidden relative">
          <img
            src={`${photoBaseUrl}/photos/${fighter_b.photo_key}`}
            alt={fighter_b.name}
            className="w-full h-full object-cover photo-filter"
          />
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-label text-[10px] uppercase tracking-[0.2em] text-primary-fixed-dim">
            {stars}
          </span>
          {played && (
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
              ✓ {accuracy}/7
            </span>
          )}
        </div>
        <p className="font-label text-xs uppercase tracking-[0.15em] text-on-surface-variant leading-snug">
          {tagline}
        </p>
        <div className="mt-3">
          {played ? (
            <span className="block w-full bg-surface-container-high text-on-surface-variant/40 font-label font-bold text-sm py-3 tracking-[0.1em] uppercase text-center">
              REPLAY →
            </span>
          ) : (
            <span className="block w-full bg-primary-container text-on-primary font-label font-bold text-sm py-3 tracking-[0.1em] uppercase text-center">
              FIGHT →
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
```

**Step 2: Create `app/deathmatch/page.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { Matchup } from "@/lib/types";
import { loadRecord, getRank } from "@/lib/deathmatch";
import FightCard from "@/components/FightCard";

const R2_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://pub-19f678b6a57845a7bafc5e706541ab76.r2.dev";

export default function DeathmatchPage() {
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [loading, setLoading] = useState(true);
  const record = typeof window !== "undefined" ? loadRecord() : null;

  useEffect(() => {
    fetch("/api/deathmatch")
      .then((res) => res.json())
      .then((data) => {
        setMatchups(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch matchups:", err);
        setLoading(false);
      });
  }, []);

  const overallAccuracy = record && record.overall_total > 0
    ? record.overall_correct / record.overall_total
    : 0;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-surface">
        <span className="font-headline text-xl text-primary-fixed-dim animate-pulse">Loading...</span>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface">
      {/* Header */}
      <section className="px-8 pt-16 pb-8 max-w-5xl mx-auto">
        <a href="/" className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/50 hover:text-primary-fixed-dim transition-colors">
          ← Back
        </a>
        <h1 className="font-headline font-black text-5xl md:text-6xl text-primary-fixed-dim tracking-tighter mt-4">
          DEATHMATCH
        </h1>
        <p className="mt-2 text-on-surface-variant font-body text-sm font-light">
          Two legends. Seven rounds. Your knowledge decides who wins.
        </p>

        {/* Stats bar */}
        {record && record.fights_played > 0 && (
          <div className="mt-6 flex gap-6 text-on-surface-variant/60 font-label text-[10px] uppercase tracking-[0.2em]">
            <span>{record.fights_played}/30 fights</span>
            <span>{Math.round(overallAccuracy * 100)}% accuracy</span>
            <span>Best: {record.best_score}/7</span>
            <span>{getRank(overallAccuracy)}</span>
          </div>
        )}
      </section>

      {/* Fight Card Grid */}
      <section className="px-8 pb-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {matchups.map((m) => (
            <FightCard
              key={m.slug}
              matchup={m}
              photoBaseUrl={R2_BASE}
              played={!!record?.results[m.slug]}
              accuracy={record?.results[m.slug]?.accuracy}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
```

**Step 3: Verify locally**

```bash
cd C:\Users\Kasutaja\Claude_Projects\whodis-screensaver
npm run dev
```

Navigate to `http://localhost:3000/deathmatch`. Verify the grid renders with matchup cards.

**Step 4: Commit**

```bash
git add components/FightCard.tsx app/deathmatch/page.tsx
git commit -m "feat(deathmatch): add Fight Card Wall page"
```

---

## Task 6: Fight Screen (`/deathmatch/[slug]`)

**Files:**
- Create: `components/FighterDisplay.tsx`
- Create: `components/FightScore.tsx`
- Create: `components/QuestionScreen.tsx`
- Create: `components/AnswerReveal.tsx`
- Create: `components/FightResult.tsx`
- Create: `app/deathmatch/[slug]/page.tsx`

This is the largest task. It has three phases: pre-fight, fight rounds, and result.

**Step 1: Create `components/FighterDisplay.tsx`**

Fighter photo with name and nickname. Used on pre-fight and result screens.

```tsx
interface FighterDisplayProps {
  name: string;
  nickname: string;
  photoKey: string;
  photoBaseUrl: string;
  category?: string;
  era?: string;
  dimmed?: boolean;
}

export default function FighterDisplay({ name, nickname, photoKey, photoBaseUrl, category, era, dimmed }: FighterDisplayProps) {
  return (
    <div className={`flex flex-col items-center ${dimmed ? "opacity-40 grayscale" : ""} transition-all duration-500`}>
      <div className="photo-matte w-full max-w-[240px]">
        <div className="aspect-[3/4] overflow-hidden">
          <img
            src={`${photoBaseUrl}/photos/${photoKey}`}
            alt={name}
            className="w-full h-full object-cover photo-filter"
          />
        </div>
      </div>
      <h3 className="font-headline font-bold text-xl md:text-2xl text-on-surface mt-3 text-center tracking-tight">
        {name.toUpperCase()}
      </h3>
      <p className="font-body text-sm text-on-surface-variant/60 italic text-center">
        &ldquo;{nickname}&rdquo;
      </p>
      {category && era && (
        <div className="mt-2 flex gap-2">
          <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 font-label text-[9px] font-bold uppercase tracking-widest">
            {category}
          </span>
          <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 font-label text-[9px] font-bold uppercase tracking-widest">
            {era}
          </span>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Create `components/FightScore.tsx`**

Boxing-style scoreboard shown during rounds.

```tsx
interface FightScoreProps {
  nameA: string;
  nameB: string;
  scoreA: number;
  scoreB: number;
  round: number;
  totalRounds: number;
}

export default function FightScore({ nameA, nameB, scoreA, scoreB, round, totalRounds }: FightScoreProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-surface-container-low">
      <span className="font-label text-xs uppercase tracking-[0.15em] text-on-surface-variant">
        {nameA.split(" ").pop()} <span className="text-primary-fixed-dim font-bold text-base">{scoreA}</span>
      </span>
      <span className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/50">
        Round {round}/{totalRounds}
      </span>
      <span className="font-label text-xs uppercase tracking-[0.15em] text-on-surface-variant">
        <span className="text-primary-fixed-dim font-bold text-base">{scoreB}</span> {nameB.split(" ").pop()}
      </span>
    </div>
  );
}
```

**Step 3: Create `components/QuestionScreen.tsx`**

The question with two answer buttons.

```tsx
interface QuestionScreenProps {
  roundNumber: number;
  roundLabel: string;
  questionText: string;
  fighterAName: string;
  fighterBName: string;
  onAnswer: (answer: "a" | "b") => void;
  disabled: boolean;
}

export default function QuestionScreen({
  roundNumber, roundLabel, questionText, fighterAName, fighterBName, onAnswer, disabled,
}: QuestionScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-2xl mx-auto">
      <span className="font-label text-[10px] uppercase tracking-[0.3em] text-primary-fixed-dim/60 mb-4">
        Round {roundNumber} · {roundLabel}
      </span>

      <p className="font-headline text-lg md:text-xl text-on-surface text-center leading-snug mb-10 max-w-lg">
        {questionText}
      </p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        <button
          onClick={() => onAnswer("a")}
          disabled={disabled}
          className="bg-surface-container-high hover:bg-surface-bright text-on-surface font-label font-bold text-sm py-5 uppercase tracking-[0.1em] transition-colors disabled:opacity-50"
        >
          {fighterAName}
        </button>
        <button
          onClick={() => onAnswer("b")}
          disabled={disabled}
          className="bg-surface-container-high hover:bg-surface-bright text-on-surface font-label font-bold text-sm py-5 uppercase tracking-[0.1em] transition-colors disabled:opacity-50"
        >
          {fighterBName}
        </button>
      </div>
    </div>
  );
}
```

**Step 4: Create `components/AnswerReveal.tsx`**

Shown after answering. Photo of the correct fighter, explanation, fun fact.

```tsx
interface AnswerRevealProps {
  correct: boolean;
  correctFighterName: string;
  correctFighterPhotoKey: string;
  photoBaseUrl: string;
  explanation: string;
  funFact: string | null;
  pointFor: string;
  onNext: () => void;
}

export default function AnswerReveal({
  correct, correctFighterName, correctFighterPhotoKey, photoBaseUrl, explanation, funFact, pointFor, onNext,
}: AnswerRevealProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-2xl mx-auto">
      <span className={`font-headline font-bold text-2xl mb-4 ${correct ? "text-green-400" : "text-red-400"}`}>
        {correct ? "✓ CORRECT" : "✗ WRONG"}
      </span>

      <div className="photo-matte w-full max-w-[200px] mb-4">
        <div className="aspect-[3/4] overflow-hidden">
          <img
            src={`${photoBaseUrl}/photos/${correctFighterPhotoKey}`}
            alt={correctFighterName}
            className="w-full h-full object-cover photo-filter"
          />
        </div>
      </div>

      <p className="font-label text-xs uppercase tracking-[0.15em] text-primary-fixed-dim mb-3">
        Point → {pointFor}
      </p>

      <p className="font-body text-sm text-on-surface-variant font-light leading-relaxed text-center max-w-md mb-2">
        {explanation}
      </p>

      {funFact && (
        <p className="font-body text-xs text-on-surface-variant/50 italic text-center max-w-md mb-6">
          {funFact}
        </p>
      )}

      <button
        onClick={onNext}
        className="bg-primary-container text-on-primary font-label font-bold text-sm py-4 px-12 tracking-[0.1em] uppercase transition-all hover:brightness-110"
      >
        {/* Text will be "NEXT ROUND →" or "SEE RESULTS →" based on parent */}
        CONTINUE →
      </button>
    </div>
  );
}
```

**Step 5: Create `components/FightResult.tsx`**

Final result screen with verdict, accuracy, share card.

```tsx
"use client";

import { FightResult as FightResultType } from "@/lib/types";
import { generateShareCard, getVerdict, getRank, loadRecord } from "@/lib/deathmatch";
import FighterDisplay from "./FighterDisplay";

interface FightResultProps {
  fighterA: { name: string; photo_key: string; nickname: string };
  fighterB: { name: string; photo_key: string; nickname: string };
  photoBaseUrl: string;
  result: FightResultType;
}

export default function FightResult({ fighterA, fighterB, photoBaseUrl, result }: FightResultProps) {
  const winnerName = result.winner === "a" ? fighterA.name : result.winner === "b" ? fighterB.name : null;
  const record = loadRecord();
  const overallAccuracy = record.overall_total > 0 ? record.overall_correct / record.overall_total : 0;

  const shareText = generateShareCard(fighterA.name, fighterB.name, result);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ text: shareText });
    } else {
      await navigator.clipboard.writeText(shareText);
      alert("Copied to clipboard!");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-2xl mx-auto">
      <span className="font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant/50 mb-4">
        Deathmatch Result
      </span>

      {/* Fighter photos */}
      <div className="flex gap-6 mb-6">
        <FighterDisplay
          name={fighterA.name}
          nickname={fighterA.nickname}
          photoKey={fighterA.photo_key}
          photoBaseUrl={photoBaseUrl}
          dimmed={result.winner === "b"}
        />
        <FighterDisplay
          name={fighterB.name}
          nickname={fighterB.nickname}
          photoKey={fighterB.photo_key}
          photoBaseUrl={photoBaseUrl}
          dimmed={result.winner === "a"}
        />
      </div>

      {/* Fight score */}
      <p className="font-headline font-bold text-2xl text-on-surface mb-1">
        {fighterA.name.split(" ").pop()} {result.fight_score_a} — {result.fight_score_b} {fighterB.name.split(" ").pop()}
      </p>

      {/* Winner */}
      <p className="font-headline font-bold text-lg text-primary-fixed-dim mb-4">
        ⚡ {winnerName ? `${winnerName.toUpperCase()} WINS` : "DRAW"}
      </p>

      {/* Stats */}
      <div className="bg-surface-container-low p-6 w-full max-w-sm mb-6">
        <div className="space-y-2 text-center">
          <p className="font-body text-sm text-on-surface-variant">
            You got <span className="text-on-surface font-bold">{result.accuracy}/{result.total}</span> correct
          </p>
          <p className="font-label text-xs uppercase tracking-[0.15em] text-on-surface-variant/60">
            Verdict: {result.verdict}
          </p>
          <p className="font-label text-xs uppercase tracking-[0.15em] text-on-surface-variant/60">
            Rank: {getRank(overallAccuracy)}
          </p>
        </div>

        {/* Emoji row */}
        <p className="text-center text-xl mt-3 tracking-widest">
          {result.correct.map((c, i) => (
            <span key={i}>{c ? "🟨" : "⬛"}</span>
          ))}
        </p>
      </div>

      {/* CTAs */}
      <div className="flex gap-4">
        <button
          onClick={handleShare}
          className="bg-surface-container-high text-on-surface font-label font-bold text-sm py-4 px-8 tracking-[0.1em] uppercase transition-all hover:bg-surface-bright"
        >
          SHARE
        </button>
        <a
          href="/deathmatch"
          className="bg-primary-container text-on-primary font-label font-bold text-sm py-4 px-8 tracking-[0.1em] uppercase transition-all hover:brightness-110 text-center"
        >
          NEXT FIGHT →
        </a>
      </div>
    </div>
  );
}
```

**Step 6: Create the main page — `app/deathmatch/[slug]/page.tsx`**

This is the state machine: pre-fight → rounds → result.

```tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { MatchupRound, FightResult as FightResultType } from "@/lib/types";
import { getVerdict, saveResult } from "@/lib/deathmatch";
import FighterDisplay from "@/components/FighterDisplay";
import FightScore from "@/components/FightScore";
import QuestionScreen from "@/components/QuestionScreen";
import AnswerReveal from "@/components/AnswerReveal";
import FightResultScreen from "@/components/FightResult";

const R2_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://pub-19f678b6a57845a7bafc5e706541ab76.r2.dev";

type Phase = "loading" | "prefight" | "question" | "reveal" | "result";

type MatchupData = {
  slug: string;
  tagline: string;
  fighter_a: { id: number; name: string; photo_key: string; nickname: string; category: string; era: string };
  fighter_b: { id: number; name: string; photo_key: string; nickname: string; category: string; era: string };
  rounds: MatchupRound[];
};

export default function DeathmatchFightPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [matchup, setMatchup] = useState<MatchupData | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [currentRound, setCurrentRound] = useState(0);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [answers, setAnswers] = useState<("a" | "b")[]>([]);
  const [correctList, setCorrectList] = useState<boolean[]>([]);
  const [lastReveal, setLastReveal] = useState<{
    correct: boolean;
    correct_answer: "a" | "b";
    explanation: string;
    fun_fact: string | null;
  } | null>(null);
  const [answering, setAnswering] = useState(false);

  // Shuffle round order on load
  const [roundOrder, setRoundOrder] = useState<number[]>([]);

  useEffect(() => {
    fetch(`/api/deathmatch/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setMatchup(data);
        // Shuffle round indices
        const indices = data.rounds.map((_: MatchupRound, i: number) => i);
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        setRoundOrder(indices);
        setPhase("prefight");
      })
      .catch((err) => console.error("Failed to load matchup:", err));
  }, [slug]);

  if (phase === "loading" || !matchup) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-surface">
        <span className="font-headline text-xl text-primary-fixed-dim animate-pulse">Loading...</span>
      </main>
    );
  }

  const { fighter_a, fighter_b, rounds } = matchup;
  const shuffledRounds = roundOrder.map((i) => rounds[i]);
  const round = shuffledRounds[currentRound];
  const totalRounds = rounds.length;

  const handleStartFight = () => {
    setPhase("question");
  };

  const handleAnswer = async (answer: "a" | "b") => {
    setAnswering(true);
    try {
      const res = await fetch(`/api/deathmatch/${slug}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ round_number: rounds[roundOrder[currentRound]].round_number, answer }),
      });
      const data = await res.json();

      setAnswers((prev) => [...prev, answer]);
      setCorrectList((prev) => [...prev, data.correct]);

      if (data.correct) {
        if (data.correct_answer === "a") setScoreA((s) => s + 1);
        else setScoreB((s) => s + 1);
      } else {
        // Wrong — point goes to the correct fighter
        if (data.correct_answer === "a") setScoreA((s) => s + 1);
        else setScoreB((s) => s + 1);
      }

      setLastReveal(data);
      setPhase("reveal");
    } catch (err) {
      console.error("Answer error:", err);
    } finally {
      setAnswering(false);
    }
  };

  const handleNextRound = () => {
    if (currentRound + 1 >= totalRounds) {
      // Fight over — save and show result
      const accuracy = correctList.length > 0
        ? [...correctList].filter(Boolean).length
        : 0;
      // Need to include the current round's correctness
      const finalCorrect = [...correctList];
      const finalAccuracy = finalCorrect.filter(Boolean).length;

      const winner = scoreA > scoreB ? "a" as const : scoreB > scoreA ? "b" as const : "draw" as const;

      const result: FightResultType = {
        accuracy: finalAccuracy,
        total: totalRounds,
        fight_score_a: scoreA,
        fight_score_b: scoreB,
        winner,
        verdict: getVerdict(finalAccuracy),
        date: new Date().toISOString().split("T")[0],
        answers: [...answers],
        correct: finalCorrect,
      };

      saveResult(slug, result);
      setPhase("result");
    } else {
      setCurrentRound((r) => r + 1);
      setLastReveal(null);
      setPhase("question");
    }
  };

  // --- RENDER ---

  if (phase === "prefight") {
    return (
      <main className="min-h-screen flex flex-col bg-surface">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <span className="font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant/50 mb-6">
            Celebrity Deathmatch
          </span>

          <div className="flex gap-6 md:gap-12 items-start mb-6">
            <FighterDisplay
              name={fighter_a.name}
              nickname={fighter_a.nickname}
              photoKey={fighter_a.photo_key}
              photoBaseUrl={R2_BASE}
              category={fighter_a.category}
              era={fighter_a.era}
            />

            <span className="font-headline font-black text-3xl text-primary-fixed-dim mt-20">⚡</span>

            <FighterDisplay
              name={fighter_b.name}
              nickname={fighter_b.nickname}
              photoKey={fighter_b.photo_key}
              photoBaseUrl={R2_BASE}
              category={fighter_b.category}
              era={fighter_b.era}
            />
          </div>

          <p className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant/60 mb-8">
            {matchup.tagline}
          </p>

          <button
            onClick={handleStartFight}
            className="bg-primary-container text-on-primary font-label font-bold text-sm py-4 px-16 tracking-[0.1em] uppercase transition-all hover:brightness-110"
          >
            FIGHT →
          </button>
        </div>
      </main>
    );
  }

  if (phase === "question" && round) {
    return (
      <main className="min-h-screen flex flex-col bg-surface">
        <FightScore
          nameA={fighter_a.name}
          nameB={fighter_b.name}
          scoreA={scoreA}
          scoreB={scoreB}
          round={currentRound + 1}
          totalRounds={totalRounds}
        />
        <QuestionScreen
          roundNumber={currentRound + 1}
          roundLabel={round.round_label}
          questionText={round.question_text}
          fighterAName={fighter_a.name}
          fighterBName={fighter_b.name}
          onAnswer={handleAnswer}
          disabled={answering}
        />
      </main>
    );
  }

  if (phase === "reveal" && lastReveal) {
    const correctFighter = lastReveal.correct_answer === "a" ? fighter_a : fighter_b;
    return (
      <main className="min-h-screen flex flex-col bg-surface">
        <FightScore
          nameA={fighter_a.name}
          nameB={fighter_b.name}
          scoreA={scoreA}
          scoreB={scoreB}
          round={currentRound + 1}
          totalRounds={totalRounds}
        />
        <AnswerReveal
          correct={lastReveal.correct}
          correctFighterName={correctFighter.name}
          correctFighterPhotoKey={correctFighter.photo_key}
          photoBaseUrl={R2_BASE}
          explanation={lastReveal.explanation}
          funFact={lastReveal.fun_fact}
          pointFor={correctFighter.name}
          onNext={handleNextRound}
        />
      </main>
    );
  }

  if (phase === "result") {
    const finalCorrect = correctList;
    const finalAccuracy = finalCorrect.filter(Boolean).length;
    const winner = scoreA > scoreB ? "a" as const : scoreB > scoreA ? "b" as const : "draw" as const;

    const result: FightResultType = {
      accuracy: finalAccuracy,
      total: totalRounds,
      fight_score_a: scoreA,
      fight_score_b: scoreB,
      winner,
      verdict: getVerdict(finalAccuracy),
      date: new Date().toISOString().split("T")[0],
      answers,
      correct: finalCorrect,
    };

    return (
      <main className="min-h-screen flex flex-col bg-surface">
        <FightResultScreen
          fighterA={fighter_a}
          fighterB={fighter_b}
          photoBaseUrl={R2_BASE}
          result={result}
        />
      </main>
    );
  }

  return null;
}
```

**Step 7: Verify locally**

```bash
npm run dev
```

Navigate to `http://localhost:3000/deathmatch`, click a fight card, play through all 7 rounds, verify result screen renders.

**Step 8: Commit**

```bash
git add components/FighterDisplay.tsx components/FightScore.tsx components/QuestionScreen.tsx components/AnswerReveal.tsx components/FightResult.tsx app/deathmatch/
git commit -m "feat(deathmatch): add fight screen — prefight, rounds, result"
```

---

## Task 7: Hub Integration

**Files:**
- Modify: `app/page.tsx` — add Deathmatch card, change grid to 2x2

**Step 1: Update hub page**

In `app/page.tsx`, change the "Three Ways In" section:

1. Change heading from "Three Ways In" to "Four Ways In"
2. Change grid from `grid-cols-1 md:grid-cols-3` to `grid-cols-1 md:grid-cols-2`
3. Add the Deathmatch ExperienceCard after IN COLOR:

```tsx
<ExperienceCard
  label="WHO DIS? — DEATHMATCH"
  title="DEATHMATCH"
  description="Two legends. Seven rounds. Pick your answer and your knowledge decides who walks away standing. 30 showdowns. No refs. No mercy."
  ctaText="FIGHT →"
  href="/deathmatch"
/>
```

**Step 2: Verify locally**

Check that the hub now shows 4 cards in a 2x2 grid on desktop, stacked on mobile.

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat(deathmatch): integrate into hub — 4th experience card"
```

---

## Task 8: Content Authoring — First 5 Matchups

**Files:**
- Modify: `content/deathmatch-matchups.json`

**Step 1: Write 7 questions each for the first 5 matchups**

Priority matchups for initial launch:
1. Stallone vs Schwarzenegger
2. Senna vs Prost
3. Grace Jones vs Mr. T
4. Don Johnson vs Tom Selleck
5. McEnroe vs Borg

Each matchup needs:
- 7 questions with balanced correct answers (3 for A, 4 for B or vice versa)
- Each question: `question_text`, `correct_answer`, `explanation`, `fun_fact`
- 7 `round_label` values (ORIGIN STORY, THE NUMBERS, THE FLEX, THE CRAFT, OFF-SCREEN, CULTURAL IMPACT, THE LEGACY)
- All facts must be verifiable

**Step 2: Seed the database**

```bash
node scripts/seed-deathmatch.mjs
```

**Step 3: Verify end-to-end**

Play through one full matchup locally. Verify:
- Questions render correctly
- Correct/wrong answers show proper explanations
- Fight score tallies correctly
- Result screen shows verdict and share card
- localStorage persists the result
- Fight Card Wall shows ✓ for completed matchup

**Step 4: Commit**

```bash
git add content/deathmatch-matchups.json
git commit -m "feat(deathmatch): add content for first 5 matchups (35 questions)"
```

---

## Task 9: Deploy + Verify

**Step 1: Build check**

```bash
cd C:\Users\Kasutaja\Claude_Projects\whodis-screensaver
npm run build
```

Fix any TypeScript or build errors.

**Step 2: Deploy**

```bash
vercel --prod
```

**Step 3: Browser verification**

Navigate to the deployed URL via chrome-devtools MCP:
- Check `/deathmatch` renders the fight card grid
- Play through one complete matchup
- Verify result screen and share card
- Check console for errors
- Verify hub page shows 4 cards in 2x2 grid

**Step 4: Commit any fixes**

---

## Task 10: Remaining Content (25 Matchups)

**Files:**
- Modify: `content/deathmatch-matchups.json`

Write 7 questions each for the remaining 25 matchups (175 questions). Seed after each batch of 5.

This can be done incrementally — the app works with however many matchups are seeded. Ship the first 5, add the rest over time.

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | DB schema | `scripts/create-deathmatch-tables.mjs` |
| 2 | Seed script + JSON | `content/deathmatch-matchups.json`, `scripts/seed-deathmatch.mjs` |
| 3 | Types + localStorage | `lib/types.ts`, `lib/deathmatch.ts` |
| 4 | API routes | `app/api/deathmatch/` (3 routes) |
| 5 | Fight Card Wall | `components/FightCard.tsx`, `app/deathmatch/page.tsx` |
| 6 | Fight screen | 5 components + `app/deathmatch/[slug]/page.tsx` |
| 7 | Hub integration | `app/page.tsx` |
| 8 | Content (first 5) | `content/deathmatch-matchups.json` |
| 9 | Deploy + verify | Vercel + chrome-devtools |
| 10 | Content (remaining 25) | `content/deathmatch-matchups.json` |
