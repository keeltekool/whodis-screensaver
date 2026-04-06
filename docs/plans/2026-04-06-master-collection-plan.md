# Master Collection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a 4th "Master Collection" experience to the Who Dis? hub — a fullscreen slideshow of ALL ~475 photos (173 existing + ~302 re-labeled rejects).

**Architecture:** Programmatic diff identifies 302 unlabeled photos across `batch1/`, `raw-samples/`, and `expansion/` dirs. Each is visually analyzed and labeled. New entries go into `master-entries.json`, get uploaded to R2, merged into `celebrities.json`, and seeded to Neon. A new `/api/master` route returns all photos. The `/master` page clones the gallery slideshow. The landing page gets a full-width "boss" card.

**Tech Stack:** Next.js (whodis-screensaver), Neon Postgres, Cloudflare R2, Node.js scripts

**Projects:**
- `C:\Users\Kasutaja\Claude_Projects\who-dis` — content, DB seed, R2 upload scripts
- `C:\Users\Kasutaja\Claude_Projects\whodis-screensaver` — frontend, API routes

---

## Phase 1: Data Pipeline (who-dis project)

### Task 1: Generate Unlabeled Photo Inventory

**Files:**
- Create: `who-dis/scripts/diff-unlabeled.mjs`

**Step 1: Write the diff script**

```js
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";

const contentDir = resolve(process.cwd(), "content");

// 1. All source files that ARE mapped (accepted into DB)
const usedSources = new Set();

// From upload-to-r2.mjs photoMap (batch1 + raw-samples originals)
const uploadScript = readFileSync(resolve(process.cwd(), "scripts/upload-to-r2.mjs"), "utf-8");
const batch1Matches = uploadScript.matchAll(/file: "([^"]+)"/g);
for (const m of batch1Matches) usedSources.add(m[1]);

// From expansion entry files (source_file field)
for (const entryFile of ["expansion-entries.json", "expansion-batch4-entries.json", "expansion-batch5-entries.json", "color-entries.json"]) {
  const entries = JSON.parse(readFileSync(resolve(contentDir, entryFile), "utf-8"));
  for (const e of entries) {
    if (e.source_file) usedSources.add(e.source_file);
  }
}

console.log(`Known/used source files: ${usedSources.size}`);

// 2. All local files on disk
const batch1Files = readdirSync(resolve(contentDir, "batch1")).filter(f => f.endsWith(".jpg"));
const rawFiles = readdirSync(resolve(contentDir, "raw-samples")).filter(f => f.endsWith(".jpg"));
const expFiles = readdirSync(resolve(contentDir, "expansion")).filter(f => f.endsWith(".jpg"));

// 3. Filter: only scanned batches (exp_001–exp_300), exclude batch 6 (exp_301+)
const scannedExpFiles = expFiles.filter(f => {
  const num = parseInt(f.replace("exp_", "").replace(".jpg", ""));
  return num <= 300;
});

// 4. Diff
const unlabeledBatch1 = batch1Files.filter(f => !usedSources.has(f));
const unlabeledRaw = rawFiles.filter(f => !usedSources.has(f));
const unlabeledExp = scannedExpFiles.filter(f => !usedSources.has(f));

console.log(`\n=== UNLABELED PHOTOS ===`);
console.log(`batch1/: ${unlabeledBatch1.length} unlabeled (of ${batch1Files.length})`);
console.log(`raw-samples/: ${unlabeledRaw.length} unlabeled (of ${rawFiles.length})`);
console.log(`expansion/ (1-300): ${unlabeledExp.length} unlabeled (of ${scannedExpFiles.length})`);
console.log(`TOTAL TO LABEL: ${unlabeledBatch1.length + unlabeledRaw.length + unlabeledExp.length}`);

// 5. Output as JSON for batch processing
const unlabeled = [
  ...unlabeledBatch1.sort().map(f => ({ file: f, source: "batch1" })),
  ...unlabeledRaw.sort().map(f => ({ file: f, source: "raw-samples" })),
  ...unlabeledExp.sort((a, b) => {
    const na = parseInt(a.replace("exp_", "").replace(".jpg", ""));
    const nb = parseInt(b.replace("exp_", "").replace(".jpg", ""));
    return na - nb;
  }).map(f => ({ file: f, source: "expansion" })),
];

// Write manifest
const outPath = resolve(contentDir, "unlabeled-manifest.json");
const { writeFileSync } = await import("fs");
writeFileSync(outPath, JSON.stringify(unlabeled, null, 2));
console.log(`\nManifest written: ${outPath} (${unlabeled.length} entries)`);
```

**Step 2: Run the diff script**

Run: `cd C:\Users\Kasutaja\Claude_Projects\who-dis && node scripts/diff-unlabeled.mjs`
Expected: Creates `content/unlabeled-manifest.json` with ~302 entries, each `{ file, source }`

**Step 3: Commit**

```bash
cd C:\Users\Kasutaja\Claude_Projects\who-dis
git add scripts/diff-unlabeled.mjs content/unlabeled-manifest.json
git commit -m "feat: diff script to identify 302 unlabeled photos for master collection"
```

---

### Task 2: Re-label Batch 1 — batch1/ photos (first 50)

**Files:**
- Create: `who-dis/content/master-entries.json` (start building)

**Step 1: Read unlabeled-manifest.json, get first 50 entries from batch1/ source**

**Step 2: For each photo, read the image file visually and produce metadata:**
```json
{
  "name": "Label or Celebrity Name",
  "category": "ATHLETE|FILM|MUSIC|FASHION|CULTURAL|SCENE",
  "era": "60s|70s|80s|90s|00s",
  "hint_1": "",
  "hint_2": "",
  "photo_key": "kebab-case-label.jpg",
  "source_file": "photo_XX.jpg",
  "photo_type": "master"
}
```

**Labeling rules:**
- Known celebrity (solo): full name, e.g., `"Clint Eastwood"`
- Known celebrities (multiple): all names, e.g., `"Ali & Frazier"`, `"Travolta & Uma Thurman"`
- Unknown/mood: neo-noir vibe label, e.g., `"Smoke & Velvet — Studio 54"`, `"Courtside Heat"`
- Category `SCENE` for mood shots with no identifiable celebrity
- **Skip Estonians** — do not include, note in log
- No duplicate limits, no quality gate, no hints
- photo_key: kebab-case of the name + `.jpg`. For multi-person: `"ali-and-frazier.jpg"`. For mood: `"smoke-and-velvet-studio-54.jpg"`
- If a celebrity already exists in celebrities.json with same name, add `-master.jpg` suffix to avoid photo_key collision

**Step 3: Write entries to `content/master-entries.json`**

**Step 4: Commit progress**
```bash
git add content/master-entries.json
git commit -m "feat: master entries batch 1 — first 50 batch1/ photos labeled"
```

---

### Task 3: Re-label Batch 2 — batch1/ photos (remaining ~77)

Same process as Task 2 for remaining batch1/ unlabeled files.

**Step 1:** Read next batch of batch1/ files from unlabeled-manifest.json
**Step 2:** Visually analyze each, produce metadata entries
**Step 3:** Append to `content/master-entries.json`
**Step 4:** Commit
```bash
git add content/master-entries.json
git commit -m "feat: master entries batch 2 — remaining batch1/ photos labeled"
```

---

### Task 4: Re-label Batch 3 — expansion/ photos (exp_001–exp_060 unlabeled subset)

Same process for first chunk of unlabeled expansion/ files.

**Step 1:** Read expansion/ unlabeled files from manifest (first ~60)
**Step 2:** Visually analyze each, produce metadata entries
**Step 3:** Append to `content/master-entries.json`
**Step 4:** Commit
```bash
git add content/master-entries.json
git commit -m "feat: master entries batch 3 — expansion photos part 1"
```

---

### Task 5: Re-label Batch 4 — expansion/ photos (next ~60 unlabeled)

**Step 1–4:** Same process, next chunk of expansion/ unlabeled files.
```bash
git commit -m "feat: master entries batch 4 — expansion photos part 2"
```

---

### Task 6: Re-label Batch 5 — expansion/ photos (next ~55 unlabeled)

**Step 1–4:** Same process, next chunk.
```bash
git commit -m "feat: master entries batch 5 — expansion photos part 3"
```

---

### Task 7: Re-label Batch 6 — raw-samples/ + any remaining expansion/ unlabeled

**Step 1–4:** Same process, final batch of remaining unlabeled files.
```bash
git commit -m "feat: master entries batch 6 — final unlabeled photos"
```

---

### CHECKPOINT 1: Data Labeling Complete

**Verify:**
- `content/master-entries.json` has ~302 entries (minus any skipped Estonians)
- Every entry has: name, category, era, hint_1="", hint_2="", photo_key, source_file, photo_type="master"
- No duplicate photo_keys (check programmatically)
- No photo_key collisions with existing celebrities.json entries
- All source_files point to real files on disk

Run verification:
```bash
node -e "
const m = require('./content/master-entries.json');
const c = require('./content/celebrities.json');
const mKeys = new Set(m.map(e => e.photo_key));
const cKeys = new Set(c.map(e => e.photo_key));
const overlap = [...mKeys].filter(k => cKeys.has(k));
console.log('Master entries:', m.length);
console.log('Unique photo_keys:', mKeys.size);
console.log('Collisions with existing DB:', overlap.length, overlap);
console.log('Duplicates within master:', m.length - mKeys.size);
"
```

Expected: 0 collisions, 0 duplicates.

---

## Phase 2: R2 Upload & DB Seed (who-dis project)

### Task 8: Create Master Upload Script

**Files:**
- Create: `who-dis/scripts/upload-master.mjs`

**Step 1: Write the upload script**

```js
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.local") });

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const entries = JSON.parse(
  readFileSync(resolve(process.cwd(), "content/master-entries.json"), "utf-8")
);

const contentDir = resolve(process.cwd(), "content");
let uploaded = 0;
let skipped = 0;
let failed = 0;

for (const entry of entries) {
  const srcPath = resolve(contentDir, entry.source_file.startsWith("exp_") ? "expansion" :
    entry.source_file.startsWith("sample") ? "raw-samples" : "batch1", entry.source_file);

  if (!existsSync(srcPath)) {
    console.error(`MISSING: ${srcPath}`);
    failed++;
    continue;
  }

  const body = readFileSync(srcPath);

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: `photos/${entry.photo_key}`,
        Body: body,
        ContentType: "image/jpeg",
      })
    );
    console.log(`OK: photos/${entry.photo_key} (${(body.length / 1024).toFixed(0)}KB)`);
    uploaded++;
  } catch (err) {
    console.error(`FAIL: ${entry.photo_key} — ${err.message}`);
    failed++;
  }
}

console.log(`\nDone: ${uploaded} uploaded, ${failed} failed out of ${entries.length}`);
```

**Step 2: Run the upload**
Run: `cd C:\Users\Kasutaja\Claude_Projects\who-dis && node scripts/upload-master.mjs`
Expected: ~302 uploads, 0 failures

**Step 3: Commit**
```bash
git add scripts/upload-master.mjs
git commit -m "feat: R2 upload script for master collection photos"
```

---

### Task 9: Merge Master Entries into celebrities.json & Re-seed DB

**Files:**
- Modify: `who-dis/content/celebrities.json` (append master entries)
- Modify: `who-dis/scripts/seed-db.mjs` (update verification logging)

**Step 1: Write a merge script (one-time use)**

```bash
node -e "
const { readFileSync, writeFileSync } = require('fs');
const existing = JSON.parse(readFileSync('content/celebrities.json', 'utf-8'));
const master = JSON.parse(readFileSync('content/master-entries.json', 'utf-8'));
// Strip source_file and type fields (not in DB schema)
const cleaned = master.map(({ source_file, type, ...rest }) => rest);
const merged = [...existing, ...cleaned];
writeFileSync('content/celebrities.json', JSON.stringify(merged, null, 2));
console.log('Merged:', existing.length, '+', cleaned.length, '=', merged.length);
"
```

**Step 2: Update seed-db.mjs verification to count master type**

Add after the existing color count line:
```js
const [{ master }] = await sql`SELECT count(*) as master FROM celebrities WHERE photo_type = 'master'`;
console.log(`B&W: ${bw}, Color: ${color}, Master: ${master}`);
```

**Step 3: Run the seed**
Run: `cd C:\Users\Kasutaja\Claude_Projects\who-dis && node scripts/seed-db.mjs`
Expected: ~475 total rows (143 bw + 30 color + ~302 master)

**Step 4: Commit**
```bash
git add content/celebrities.json scripts/seed-db.mjs
git commit -m "feat: merge master entries into celebrities.json, re-seed DB with ~475 entries"
```

---

### CHECKPOINT 2: Data Pipeline Complete

**Verify:**
- R2 bucket has ~475 photos under `photos/`
- Neon DB `celebrities` table has ~475 rows
- Query check: `SELECT photo_type, count(*) FROM celebrities GROUP BY photo_type` → bw: 143, color: 30, master: ~302
- Spot-check 5 random master entries: photo loads from R2 URL `https://pub-19f678b6a57845a7bafc5e706541ab76.r2.dev/photos/<photo_key>`
- Existing game still works (test `/api/session` on who-dis app)

---

## Phase 3: Frontend — API & Slideshow (whodis-screensaver project)

### Task 10: Add /api/master Route

**Files:**
- Create: `whodis-screensaver/app/api/master/route.ts`

**Step 1: Create the API route**

```ts
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sql = getDb();
    const celebrities = await sql`
      SELECT id, name, category, era, hint_2, photo_key, photo_type
      FROM celebrities
      WHERE active = true
      ORDER BY RANDOM()
    `;
    return NextResponse.json(celebrities);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Master API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 2: Commit**
```bash
cd C:\Users\Kasutaja\Claude_Projects\whodis-screensaver
git add app/api/master/route.ts
git commit -m "feat: add /api/master route — returns all photos regardless of type"
```

---

### Task 11: Update Celebrity Type & SlideView

**Files:**
- Modify: `whodis-screensaver/lib/types.ts`
- Modify: `whodis-screensaver/components/SlideView.tsx`

**Step 1: Add photo_type to Celebrity type**

```ts
export type Celebrity = {
  id: number;
  name: string;
  category: string;
  era: string;
  hint_2: string;
  photo_key: string;
  photo_type?: string;
};
```

**Step 2: Update SlideView to conditionally apply B&W filter based on photo_type**

Change the `img` className logic:
```tsx
// Old:
className={`w-full h-full object-cover ${colorMode ? "" : "photo-filter"}`}

// New:
className={`w-full h-full object-cover ${colorMode || celebrity.photo_type === 'color' || celebrity.photo_type === 'master' ? "" : "photo-filter"}`}
```

This means:
- `colorMode` prop = true → no filter (gallery page behavior, unchanged)
- `photo_type = 'color'` or `'master'` → no filter (render as-is)
- `photo_type = 'bw'` (or undefined) → `photo-filter` applied (existing behavior)

**Important:** The existing screensaver page (`/screensaver`) and gallery page (`/gallery`) are NOT affected because:
- `/screensaver` fetches only `photo_type = 'bw'` entries → all get `photo-filter` (no `colorMode` prop)
- `/gallery` fetches only `photo_type = 'color'` entries → `colorMode` prop is `true` → no filter
- Neither page returns `photo_type` from the API currently, so `celebrity.photo_type` is `undefined` → falls through to existing behavior

**Step 3: Commit**
```bash
git add lib/types.ts components/SlideView.tsx
git commit -m "feat: add photo_type to Celebrity type, conditional B&W filter in SlideView"
```

---

### Task 12: Update SettingsPanel to Accept Extended Categories

**Files:**
- Modify: `whodis-screensaver/components/SettingsPanel.tsx`

**Step 1: Make categories a prop with default**

Change the interface and constant:
```tsx
interface SettingsPanelProps {
  settings: ScreensaverSettings;
  onUpdate: (patch: Partial<ScreensaverSettings>) => void;
  onClose: () => void;
  disableFacts?: boolean;
  availableCategories?: string[];
}

// Keep as fallback default
const DEFAULT_CATEGORIES = ["FILM", "MUSIC", "ATHLETE"];
```

Update the component signature:
```tsx
export default function SettingsPanel({ settings, onUpdate, onClose, disableFacts, availableCategories }: SettingsPanelProps) {
  const categories = availableCategories || DEFAULT_CATEGORIES;
```

Replace `ALL_CATEGORIES` reference in the JSX with `categories`:
```tsx
{categories.map((cat) => (
```

**Step 2: Commit**
```bash
git add components/SettingsPanel.tsx
git commit -m "feat: SettingsPanel accepts availableCategories prop for master collection"
```

---

### Task 13: Update Settings Defaults for Extended Categories

**Files:**
- Modify: `whodis-screensaver/lib/settings.ts`

**Step 1: Add FASHION, CULTURAL, SCENE to default categories**

```ts
export const DEFAULT_SETTINGS: ScreensaverSettings = {
  duration: 10,
  transition: "crossfade",
  categories: ["FILM", "MUSIC", "ATHLETE", "FASHION", "CULTURAL", "SCENE"],
  eras: ["60s", "70s", "80s", "90s", "00s"],
  shuffle: true,
  showFacts: true,
};
```

**Note:** This expands defaults so the master page shows everything by default. The Wall and Gallery pages are unaffected because they filter by `photo_type` at the API level — category filtering in settings only applies to what the API already returned.

**Step 2: Commit**
```bash
git add lib/settings.ts
git commit -m "feat: add FASHION, CULTURAL, SCENE to default settings categories"
```

---

### Task 14: Build /master Slideshow Page

**Files:**
- Create: `whodis-screensaver/app/master/page.tsx`

**Step 1: Clone gallery page with master-specific changes**

```tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Celebrity } from "@/lib/types";
import { useSettings } from "@/hooks/useSettings";
import { useSlideshow } from "@/hooks/useSlideshow";
import SlideView from "@/components/SlideView";
import SettingsPanel from "@/components/SettingsPanel";

const R2_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://pub-19f678b6a57845a7bafc5e706541ab76.r2.dev";
const ALL_MASTER_CATEGORIES = ["FILM", "MUSIC", "ATHLETE", "FASHION", "CULTURAL", "SCENE"];

export default function MasterPage() {
  const [celebrities, setCelebrities] = useState<Celebrity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { settings, update } = useSettings();
  const { current, paused, next, prev, togglePause } = useSlideshow(celebrities, settings, R2_BASE);

  // Fetch ALL celebrities
  useEffect(() => {
    fetch("/api/master")
      .then((res) => res.json())
      .then((data) => {
        setCelebrities(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch master collection:", err);
        setLoading(false);
      });
  }, []);

  // Auto-hide controls + cursor after 3s
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (!showSettings) {
      hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [showSettings]);

  useEffect(() => {
    const handler = () => resetHideTimer();
    window.addEventListener("mousemove", handler);
    resetHideTimer();
    return () => window.removeEventListener("mousemove", handler);
  }, [resetHideTimer]);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showSettings) return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePause();
          break;
        case "ArrowRight":
          next();
          break;
        case "ArrowLeft":
          prev();
          break;
        case "Escape":
          window.location.href = "/";
          break;
        case "f":
        case "F":
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, togglePause, showSettings]);

  if (loading || !current) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-surface">
        <span className="font-headline text-xl text-primary-fixed-dim animate-pulse">Loading...</span>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex flex-col bg-surface relative overflow-hidden"
      style={{ cursor: showControls ? "default" : "none" }}
    >
      {/* Slide — no colorMode, let SlideView handle per photo_type */}
      <div className={`flex-1 flex transition-opacity ${settings.transition === "crossfade" ? "duration-1000" : "duration-0"}`}>
        <SlideView celebrity={current} photoBaseUrl={R2_BASE} showFact={false} />
      </div>

      {/* Overlay controls */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
        {/* Bottom bar */}
        <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-6 p-6 pointer-events-auto">
          <button onClick={prev} className="text-on-surface-variant hover:text-primary-fixed-dim transition-colors">
            <span className="font-headline text-2xl">&#9664;</span>
          </button>
          <button onClick={togglePause} className="text-on-surface-variant hover:text-primary-fixed-dim transition-colors">
            <span className="font-headline text-2xl">{paused ? "\u25B6" : "\u23F8"}</span>
          </button>
          <button onClick={next} className="text-on-surface-variant hover:text-primary-fixed-dim transition-colors">
            <span className="font-headline text-2xl">&#9654;</span>
          </button>
        </div>

        {/* Top-right gear icon */}
        <button
          onClick={() => setShowSettings(true)}
          className="absolute top-4 right-4 pointer-events-auto text-on-surface-variant/50 hover:text-primary-fixed-dim transition-colors"
        >
          <span className="font-headline text-2xl">&#9881;</span>
        </button>

        {/* Top-left back link */}
        <a
          href="/"
          className="absolute top-4 left-4 pointer-events-auto text-on-surface-variant/50 hover:text-primary-fixed-dim transition-colors font-label text-[10px] uppercase tracking-widest"
        >
          &#8592; Back
        </a>

        {/* Bottom-right ESC hint */}
        <span className="absolute bottom-6 right-6 text-on-surface-variant/30 font-label text-[10px] uppercase tracking-widest pointer-events-none">
          ESC to exit &middot; F fullscreen
        </span>
      </div>

      {/* Settings panel — with all master categories */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onUpdate={update}
          onClose={() => setShowSettings(false)}
          disableFacts
          availableCategories={ALL_MASTER_CATEGORIES}
        />
      )}
    </main>
  );
}
```

**Key differences from gallery:**
- Fetches `/api/master` (all photos)
- No `colorMode` prop on SlideView — relies on `photo_type` field per entry
- `disableFacts` = true
- Passes `availableCategories` with all 6 categories to SettingsPanel

**Step 2: Commit**
```bash
git add app/master/page.tsx
git commit -m "feat: /master slideshow page — fullscreen master collection experience"
```

---

### CHECKPOINT 3: Slideshow Functional

**Verify locally:**
- `cd C:\Users\Kasutaja\Claude_Projects\whodis-screensaver && npm run dev`
- Navigate to `http://localhost:3000/api/master` — returns ~475 entries with `photo_type` field
- Navigate to `http://localhost:3000/master` — slideshow loads, cycles through photos
- B&W photos render with grayscale filter, color/master photos render as-is
- Settings panel shows 6 categories (FILM, MUSIC, ATHLETE, FASHION, CULTURAL, SCENE)
- Keyboard controls work (space, arrows, ESC, F)
- **Existing pages unbroken:**
  - `/screensaver` still shows only B&W with filter
  - `/gallery` still shows only color without filter
  - `/` hub page still loads (4th card not added yet)

---

## Phase 4: Landing Page Update (whodis-screensaver project)

### Task 15: Add Boss Card to Landing Page

**Files:**
- Modify: `whodis-screensaver/app/page.tsx`

**Step 1: Update the hub page**

Add the vault section after the existing 3-card grid. The changes:

1. Keep "Three Ways In" heading and existing 3-column grid unchanged
2. Add new section below with heading "THE VAULT" and a full-width boss card

```tsx
// After the existing </section> for "Three Ways In", add:

{/* THE VAULT — Master Collection */}
<section className="px-8 pb-16 max-w-5xl mx-auto w-full">
  <h2 className="font-label text-xs font-extrabold uppercase tracking-[0.2em] text-on-surface-variant mb-6">
    The Vault
  </h2>
  <ExperienceCard
    label="WHO DIS? — THE MASTER COLLECTION"
    title="EVERYTHING"
    description="Every frame. Every legend. Every reject, deep cut, and mood shot that didn't make the game. The ones you know. The ones you forgot. The ones nobody asked about. All of it — black and white, color, raw — rolling on a loop with zero apologies."
    ctaText="ENTER →"
    href="/master"
  />
</section>
```

**Step 2: Commit**
```bash
git add app/page.tsx
git commit -m "feat: add THE VAULT section with master collection boss card on landing page"
```

---

### CHECKPOINT 4: Full Feature Complete (Pre-Deploy)

**Verify locally (full E2E):**
- Landing page shows 3 cards + THE VAULT boss card below
- Boss card links to `/master`
- `/master` slideshow loads all ~475 photos
- `/screensaver` unchanged — B&W only
- `/gallery` unchanged — color only
- Game app (`app-zeta-nine-52.vercel.app`) still works (it reads from same DB, unaffected)

---

## Phase 5: Deploy & Verify

### Task 16: Deploy whodis-screensaver

**Step 1: Deploy to Vercel**
```bash
cd C:\Users\Kasutaja\Claude_Projects\whodis-screensaver
vercel --prod
```

**Step 2: Wait 30s for CDN propagation**

**Step 3: Browser verification via chrome-devtools MCP**
- Navigate to `https://whodis-screensaver.vercel.app`
- Verify landing page has THE VAULT boss card
- Click ENTER → verify `/master` slideshow loads
- Check console for errors, network tab for 4xx/5xx
- Verify photos load from R2 CDN
- Verify `/screensaver` and `/gallery` still work unchanged
- Verify game at `app-zeta-nine-52.vercel.app` still works

**Step 4: Commit any deploy fixes if needed**

---

### Task 17: Push Both Repos to GitHub

**Step 1: Push who-dis**
```bash
cd C:\Users\Kasutaja\Claude_Projects\who-dis
git push origin master
```

**Step 2: Push whodis-screensaver**
```bash
cd C:\Users\Kasutaja\Claude_Projects\whodis-screensaver
git push origin master
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1: Data Pipeline | 1-7 | Diff script + 6 batches of photo re-labeling (~302 photos) |
| 2: R2 & DB | 8-9 | Upload to R2, merge into celebrities.json, re-seed Neon |
| 3: Frontend | 10-14 | API route, type update, SlideView filter, SettingsPanel, /master page |
| 4: Landing Page | 15 | THE VAULT boss card |
| 5: Deploy | 16-17 | Vercel deploy + browser verify + git push |

**Checkpoints:** After tasks 7, 9, 14, 15 — verify before proceeding.
