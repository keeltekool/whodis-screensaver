# WHO DIS? — DEATHMATCH MODE

## Design Document
**Date:** 2026-04-11
**Status:** Approved
**Mode:** #5 in the Who Dis? arcade

---

## 1. Overview

Deathmatch is a versus quiz mode where two celebrities face off across 7 trivia questions. The player picks Fighter A or Fighter B for each question. Correct answers score a point for the fighter the answer is about. After 7 rounds, the fighter with more points wins the deathmatch. The player's score is their accuracy (correct answers out of 7).

This is the fifth mode in the Who Dis? ecosystem, alongside The Game, The Wall, In Color, and The Vault.

---

## 2. Game Flow

### 2.1 Fight Card Wall (`/deathmatch`)

The entry point. A grid of all 30 matchups displayed as fight promotion cards.

Each card shows:
- Both fighter photos side by side, separated by a `#ffba20` lightning bolt
- Matchup tagline below in `label-sm` uppercase
- Difficulty rating (1-3 stars)
- State: `FIGHT →` (unplayed) or `✓ DONE` with accuracy score (played)

Below the grid:
- Player's overall record: fights played, overall accuracy %, best score

### 2.2 Pre-Fight Screen (`/deathmatch/[slug]`)

Full-screen dramatic presentation of the two fighters.

- Both photos in the signature Photo Frame component (16px matte padding)
- Lightning bolt separator in `#ffba20` between them
- Fighter names in `headline-lg` Space Grotesk
- Nicknames in `label-md`, `on-surface-variant`
- Category, era, origin as `label-sm` chips beneath each name
- Matchup tagline centered below
- Single CTA: `[ START FIGHT → ]`

No fighter selection / backing mechanic. The player just plays.

### 2.3 The Fight (7 Rounds)

**Top bar (persistent):**
- Running fight score: `STALLONE 2 — 1 ARNOLD`
- Round counter: `ROUND 3 / 7`

**Question area:**
- Round number + round category label at top (`label-sm`, `primary/60`)
- Question text in `headline-sm` Space Grotesk, centered
- Two answer buttons: Fighter A name and Fighter B name, side by side, `surface-container-high` background

**After answering — correct:**
- Brief green flash
- Full photo of the relevant fighter shown
- Explanation text (2-3 sentences) with fun fact
- `POINT → [FIGHTER NAME]` displayed
- Fight score updates
- `[ NEXT ROUND → ]` button

**After answering — wrong:**
- Brief red flash (`error_container`)
- Correct answer revealed with the same explanation/fun fact
- Opponent's fight score ticks up
- `[ NEXT ROUND → ]` button

### 2.4 Result Screen

Shown after round 7.

- Both fighter photos: winner at full brightness, loser dimmed (`brightness(40%) grayscale(100%)`)
- Fight score: `STALLONE 4 — 3 ARNOLD`
- Winner announcement: `⚡ STALLONE WINS`
- Player accuracy: `You got 5/7 correct`
- Verdict tier (see section 3.2)
- Rank title (see section 3.3)
- Emoji share card
- CTAs: `[ SHARE RESULT ]` and `[ NEXT FIGHT → ]`

---

## 3. Scoring & Progression

### 3.1 Question Distribution

Each matchup has exactly 7 questions:
- 3 questions where Fighter A is the correct answer
- 4 questions where Fighter B is the correct answer
- (Alternates: half the matchups are 4-A/3-B, half are 3-A/4-B)
- Question order is shuffled randomly each play

Every question is a binary choice: "Who did X?" → Fighter A or Fighter B. No opinion rounds, no wild cards, no special round types.

### 3.2 Verdict Tiers

Based on player accuracy:

| Accuracy | Verdict |
|----------|---------|
| 7/7 | KNOCKOUT |
| 5-6/7 | DECISION |
| 3-4/7 | SPLIT DECISION |
| 0-2/7 | TKO |

### 3.3 Rank Titles

Based on cumulative accuracy across all matchups played:

| Accuracy Range | Rank |
|---------------|------|
| 90%+ | Hall of Famer |
| 80-89% | Pop Culture Surgeon |
| 70-79% | Pit Wall Analyst |
| 60-69% | Armchair Expert |
| 50-59% | Lucky Guesser |
| Below 50% | Tourist |

### 3.4 Player Stats (localStorage)

Tracked across all 30 matchups:
- Fights played (x/30)
- Overall accuracy (%)
- Best single-fight score
- Per-matchup results (accuracy, fight winner, date played)

---

## 4. The 30 Matchups

### Classic Rivalries (8)

| # | Fighter A | Fighter B | Tagline |
|---|-----------|-----------|---------|
| 1 | Stallone | Schwarzenegger | The Ultimate 80s Action Showdown |
| 2 | Senna | Prost | The Greatest Rivalry in Motorsport |
| 3 | McEnroe | Borg | Fire vs Ice |
| 4 | Eazy-E | Ice Cube | N.W.A. Civil War |
| 5 | Ali | Pelé | Gods of Their Game |
| 6 | Madonna | Debbie Harry | Who Owned Downtown? |
| 7 | Boris Becker | Andre Agassi | The Brat vs The Punk |
| 8 | Mick Jagger | Rod Stewart | British Rock Strutters |

### Quirky Crossovers (10)

| # | Fighter A | Fighter B | Tagline |
|---|-----------|-----------|---------|
| 9 | Grace Jones | Mr. T | Who's More Terrifying? |
| 10 | Pablo Escobar | Hugh Hefner | Empire Builders: Vice Edition |
| 11 | Steve McQueen | George Best | Who Lived Faster? |
| 12 | John Belushi | Jimi Hendrix | Burned Twice as Bright |
| 13 | Maradona | John Travolta | The Left Foot vs The Left Hip |
| 14 | Clint Eastwood | Isaac Hayes | Shaft vs The Man With No Name |
| 15 | Farrah Fawcett | Brigitte Bardot | The Poster vs The Pout |
| 16 | Eddie Murphy | LL Cool J | 80s Swagger Supremacy |
| 17 | Wilt Chamberlain | Bob Marley | 20,000 Claims: Who Lived Bigger? |
| 18 | Elton John | Freddie Mercury | Who Wore the Crown? |

### Show vs Show / Franchise (5)

| # | Fighter A | Fighter B | Tagline |
|---|-----------|-----------|---------|
| 19 | Don Johnson | Tom Selleck | Miami Vice vs Magnum P.I. |
| 20 | Bruce Lee | Chuck Norris | Enter the Dragon vs Missing in Action |
| 21 | Stallone | Dolph Lundgren | Rocky vs Drago — Who Won the Real Fight? |
| 22 | Pam Grier | Naomi Campbell | Foxy Brown vs The Supermodel |
| 23 | Jean-Claude Van Damme | Dolph Lundgren | Universal Soldier: Who's the Real One? |

### Era Wars (4)

| # | Fighter A | Fighter B | Tagline |
|---|-----------|-----------|---------|
| 24 | Diana Ross | Whitney Houston | Diva Decades: Motown vs Pop |
| 25 | Run-D.M.C. | Wu-Tang Clan | Old School vs 36 Chambers |
| 26 | Marilyn Monroe | Michelle Pfeiffer | Hollywood Blonde: Two Eras |
| 27 | Paul Newman | Keanu Reeves | Cool Across Centuries |

### Collective Battles (3)

| # | Fighter A | Fighter B | Tagline |
|---|-----------|-----------|---------|
| 28 | Beastie Boys | A Tribe Called Quest | White Noise vs Jazz Rap |
| 29 | Bee Gees | Wham! | Disco Falsetto vs Pop Falsetto |
| 30 | N.W.A. | Wu-Tang Clan | Compton vs Staten Island |

---

## 5. Data Model

### 5.1 Database Tables (Neon PostgreSQL)

```sql
CREATE TABLE matchups (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  fighter_a_id INT REFERENCES celebrities(id),
  fighter_b_id INT REFERENCES celebrities(id),
  fighter_a_nickname TEXT,
  fighter_b_nickname TEXT,
  tagline TEXT NOT NULL,
  matchup_type TEXT NOT NULL,
  difficulty INT DEFAULT 2,
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT true
);

CREATE TABLE matchup_rounds (
  id SERIAL PRIMARY KEY,
  matchup_id INT REFERENCES matchups(id),
  round_number INT NOT NULL,
  round_label TEXT NOT NULL,
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  fun_fact TEXT,
  UNIQUE(matchup_id, round_number)
);
```

Notes:
- `correct_answer` is `'a'` or `'b'` (refers to fighter_a or fighter_b)
- `round_label` is the category: ORIGIN STORY, THE NUMBERS, THE FLEX, etc.
- No new R2 uploads — matchups reference existing `celebrities.id` which has `photo_key`
- `matchup_type`: `rivalry`, `crossover`, `franchise`, `era`, `collective`

### 5.2 API Routes

```
GET /api/deathmatch
  → Returns all matchups: id, slug, tagline, difficulty, matchup_type,
    fighter_a (name, photo_key, nickname), fighter_b (name, photo_key, nickname)

GET /api/deathmatch/[slug]
  → Returns full matchup + all 7 rounds (questions, round_labels)
  → Does NOT include correct_answer or explanation (client reveals after answer)

POST /api/deathmatch/[slug]/answer
  → Body: { round_number, answer: 'a' | 'b' }
  → Returns: { correct: boolean, correct_answer, explanation, fun_fact }
```

Answer validation happens server-side to prevent cheating via inspecting API responses.

### 5.3 Client-Side Persistence (localStorage)

```json
{
  "deathmatch": {
    "results": {
      "stallone-vs-schwarzenegger": {
        "accuracy": 5,
        "total": 7,
        "fight_score_a": 3,
        "fight_score_b": 4,
        "winner": "b",
        "verdict": "DECISION",
        "date": "2026-04-11"
      }
    },
    "overall_accuracy": 0.74,
    "fights_played": 14,
    "best_score": 7
  }
}
```

---

## 6. UX & Design System

### 6.1 Design System Compliance

All Deathmatch screens follow the existing Neo-Noir Liner Note system:
- `#131313` background, `#ffba20` (Vinyl Yellow) for accents/CTAs
- 0px border-radius on everything
- Space Grotesk for headlines, Manrope for body/UI
- Photo Frame component with 16px matte padding
- Tonal layering for depth (no borders, no drop shadows)
- Ghost borders at 15% opacity where needed
- All-caps `label-sm` with 0.2em letter-spacing for meta labels

### 6.2 Hub Integration

The hub page (`/` in whodis-screensaver) changes:
- "Three Ways In" becomes a 2x2 grid (4 cards)
- New card added: DEATHMATCH
- The Vault section remains full-width below

New ExperienceCard:
```
Label:       WHO DIS? — DEATHMATCH
Title:       DEATHMATCH
Description: Two legends. Seven rounds. Pick your answer and your
             knowledge decides who walks away standing. 30 showdowns.
             No refs. No mercy.
CTA:         FIGHT →
Route:       /deathmatch
```

### 6.3 Deathmatch-Specific Visual Elements

**Lightning bolt separator:** `#ffba20`, positioned between fighter photos on all screens. Subtle pulse animation (opacity 0.8→1.0, 2s ease-in-out loop).

**Fight score display:** Boxing-style scorecard — `FIGHTER_A [score] — [score] FIGHTER_B` in `label-md` uppercase, `on-surface-variant`.

**Fight card (on the wall):** `surface-container-low` background. Two square-cropped photos side by side. Tagline below. Completed cards get `opacity: 0.6` treatment with a `✓` overlay.

**Answer buttons:** Full-width within their column. `surface-container-high` background. Fighter name in `label-md` bold uppercase. On hover: `surface-bright` background. On select: brief `#ffba20` border flash.

**Correct answer reveal:** Fighter photo animates from small to center-frame, 300ms ease-in-out. Green `#4CAF50` accent for the `✓ CORRECT` label (does not replace brand yellow elsewhere).

**Wrong answer reveal:** Screen border flashes `error_container` for 150ms. Red accent for `✗ WRONG` label.

**Result screen — winner vs loser treatment:**
- Winner: full Photo Frame, normal brightness
- Loser: same size frame, CSS `brightness(0.4) grayscale(1)`

### 6.4 Share Card Format

```
WHO DIS? DEATHMATCH ⚡
[Fighter A] vs [Fighter B]
[Verdict]: [Fighter] wins [score]–[score]
[accuracy]/7 correct
🟨🟨⬛🟨🟨⬛🟨
```

Emoji key: 🟨 = correct, ⬛ = wrong

---

## 7. Animations & Transitions

All within design system constraints (linear or ease-in-out only, no bounce):

| Moment | Animation |
|--------|-----------|
| Enter fight from card wall | Page transition, no special effect |
| Start fight (tap CTA) | Quick `#ffba20` flash (200ms), cut to Round 1 |
| Correct answer | Green flash (150ms), fighter photo scales to center (300ms ease-in-out) |
| Wrong answer | Red border flash (150ms) |
| Fight score update | Number ticks up with slight scale pulse (1.0→1.1→1.0, 200ms) |
| Round transition | Tap next → crossfade to new question (200ms) |
| Result screen | Winner photo fades in at full brightness, loser dims (500ms) |
| Verdict text | Fades in with slight upward translate (300ms) |

---

## 8. Content Requirements

### 8.1 Per Matchup
- 7 researched questions with definitive correct answers
- 7 explanation texts (2-3 sentences each)
- 7 fun facts (1-2 sentences, optional but recommended)
- 7 round labels (ORIGIN STORY, THE NUMBERS, THE FLEX, THE CRAFT, OFF-SCREEN, CULTURAL IMPACT, THE LEGACY — or variations)
- Fighter nicknames for both
- Tagline

### 8.2 Total Content
- 30 matchups × 7 questions = **210 questions**
- 30 taglines + 60 nicknames
- Each question must be factually accurate and verifiable

### 8.3 Question Quality Rules
- Every question must have ONE definitive correct answer (no ambiguity)
- Questions should reveal something interesting about the fighters
- Explanations should teach, not just confirm — the fun fact is the reward for playing
- Mix question types: career stats, origin stories, cultural impact, off-screen life, quotes/catchphrases, timeline/chronology
- Avoid questions that require obscure specialist knowledge — the game should be challenging but fair

---

## 9. What's NOT in MVP

- No health bars or confidence betting system
- No user accounts or authentication
- No global leaderboards
- No daily deathmatch rotation
- No opinion/poll rounds
- No sound effects or music
- No multiplayer or challenge-a-friend
- No tournament brackets

These are all valid future additions but out of scope for the initial build.

---

## 10. Route & File Structure

```
whodis-screensaver/
├── app/
│   ├── deathmatch/
│   │   ├── page.tsx              # Fight Card Wall
│   │   └── [slug]/
│   │       └── page.tsx          # Pre-fight + Fight + Result
│   ├── api/
│   │   └── deathmatch/
│   │       ├── route.ts          # GET all matchups
│   │       └── [slug]/
│   │           ├── route.ts      # GET matchup detail
│   │           └── answer/
│   │               └── route.ts  # POST answer validation
├── components/
│   ├── FightCard.tsx             # Matchup card for the wall
│   ├── FighterDisplay.tsx        # Fighter photo + name + nickname
│   ├── FightScore.tsx            # Running score display
│   ├── QuestionScreen.tsx        # Question + answer buttons
│   ├── AnswerReveal.tsx          # Correct/wrong result + explanation
│   └── FightResult.tsx           # End screen with verdict + share
├── hooks/
│   ├── useDeathmatch.ts          # Fight state machine
│   └── useDeathmatchRecord.ts    # localStorage persistence
├── lib/
│   └── deathmatch.ts             # Verdict logic, share card generation
```

---

## 11. Build Estimate

| Phase | Scope |
|-------|-------|
| DB schema + migrations | 2 tables, seed script |
| API routes | 3 routes (list, detail, answer) |
| Fight Card Wall page | Grid layout, localStorage state |
| Fight screen | Question display, answer flow, score tracking |
| Result screen | Verdict logic, share card, stats |
| Hub integration | ExperienceCard + grid layout change |
| Content authoring | 30 × 7 = 210 questions (the heavy lift) |
