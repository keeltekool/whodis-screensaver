# WHO DIS? — The Master Collection (4th Experience)

**Date:** 2026-04-06
**Status:** Approved
**Projects affected:** `whodis-screensaver` (frontend + API), `who-dis` (content + seed + R2 upload)

---

## Overview

Add a 4th experience to the Who Dis? hub: **The Master Collection** — a fullscreen slideshow of every photo in the entire collection. This includes the 173 already in the database (B&W game + color gallery) PLUS ~302 previously rejected/unlabeled photos from batches 1-5 that were analyzed but never persisted.

Total target: **~475 photos** (minus any Estonians found during re-labeling).

Route: `/master`

---

## Section 1: Data Pipeline — Photo Inventory & Re-labeling

### The Diff
- **302 local photos** exist on disk but are not in the DB
  - 127 from `content/batch1/` + `content/raw-samples/`
  - 175 from `content/expansion/` (exp_001–exp_300, scanned batches 1-5)
- Programmatic diff: list all local files, subtract all `source_file` mappings from existing entry JSONs + upload script `photoMap`
- Output: ordered list of unlabeled files to process

### Re-labeling Rules
- Process in batches of ~50 photos (read image, visually identify, write metadata)
- For each photo produce: `name`, `category`, `era`, `photo_key` (kebab-case), `source_file`
- **Known celebrities (solo):** full name — e.g., `"Steve McQueen"`
- **Known celebrities (multiple):** all names — e.g., `"Travolta & Uma Thurman"`, `"Ali vs Frazier"`
- **Unknown/mood shots:** descriptive vibe label in the Who Dis? neo-noir voice — e.g., `"Smoke & Velvet — Studio 54"`, `"Courtside Heat"`, `"The Stare-Down"`
- **Categories:** existing 5 (ATHLETE, FILM, MUSIC, FASHION, CULTURAL) + new `SCENE` for mood shots
- **No hints** — `hint_1` and `hint_2` = empty strings
- **No duplicate limits** — everything goes in
- **No Estonians** — excluded across all photo types (international audience)
- **No quality gate** — if it's a photo, it's in

### Output
- New file: `content/master-entries.json` — all ~302 new entries
- Format matches existing entry files:
  ```json
  {
    "name": "Label",
    "category": "CATEGORY",
    "era": "80s",
    "hint_1": "",
    "hint_2": "",
    "photo_key": "kebab-case-label.jpg",
    "source_file": "exp_042.jpg",
    "photo_type": "master"
  }
  ```

---

## Section 2: Database & API

### Database
- No migration needed — `photo_type` is a TEXT column, not an enum
- New entries get: `photo_type = 'master'`, `active = true`, empty hints
- Existing 173 entries untouched

### Seeding
- Merge master entries into `celebrities.json` (single source of truth)
- `seed-db.mjs` continues to load from one file — no changes needed to seed logic

### New API Route (`whodis-screensaver`)
- `GET /api/master` — returns ALL entries regardless of photo_type:
  ```sql
  SELECT id, name, category, era, hint_2, photo_key, photo_type
  FROM celebrities WHERE active = true ORDER BY RANDOM()
  ```
- Returns `photo_type` in response so frontend can conditionally apply B&W filter
- `ORDER BY RANDOM()` — shuffled every load

### Existing Routes — UNTOUCHED
- `/api/celebrities` — `WHERE photo_type = 'bw'` (game + The Wall)
- `/api/color` — `WHERE photo_type = 'color'` (In Color gallery)

---

## Section 3: R2 Upload

- 302 new photos uploaded to R2 bucket `who-dis` under `photos/<photo_key>`
- New upload script reads `master-entries.json`, maps `source_file` → local path, uploads as `photo_key`
- Same pattern as existing `upload-expansion.mjs`

### Photo Rendering in Slideshow
- `photo_type = 'bw'` → CSS `photo-filter` class (grayscale + contrast + brightness)
- `photo_type = 'color'` → no filter
- `photo_type = 'master'` → no filter — render as-is (raw originals, whatever they are)

---

## Section 4: Frontend — Master Slideshow Page

### Route: `/master`
- Clone `/gallery/page.tsx` (closest match)
- Fetch from `/api/master`
- Photo filter: check `photo_type` per slide — apply `photo-filter` for `bw`, no filter for `color` and `master`
- `showFact = false` — master entries have no hints
- Settings panel: `disableFacts = true`

### Type Update
- Add `photo_type?: string` to `Celebrity` type

### No Slide Counter
- 475+ photos but no numbering — breaks the vibe

---

## Section 5: Landing Page — The 4th Card

### Layout
- Keep existing 3-column grid for Game / The Wall / In Color
- Below: a full-width "boss" card for The Master Collection
- Separate section heading above the boss card (e.g., "THE VAULT")

### Boss Card
- Label: `WHO DIS? — THE MASTER COLLECTION`
- Title: `EVERYTHING`
- Copy: Full vault energy — every shot, every legend, every frame. The rejects, the deep cuts, the ones that didn't fit the game. All of it, rolling.
- CTA: `ENTER →`
- Link: `/master`
- Uses existing `ExperienceCard` component, spans full grid width

### Heading
- Top row keeps "Three Ways In" (or adjust)
- Boss card gets its own section heading

---

## Section 6: Out of Scope

- Batch 6 photos (exp_301–exp_342) — 42 unscanned, separate task
- Remaining ~258 Google Drive photos never downloaded — separate task
- Shuffle modes — future feature
- Category/era filtering — future feature
- Hints for master entries — not needed
- Slide counter/numbering — excluded
- Any changes to the Game project (`who-dis` frontend) — this build only touches screensaver hub + shared DB/R2
