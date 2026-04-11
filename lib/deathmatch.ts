import { FightResult, DeathmatchRecord } from "./types";

const STORAGE_KEY = "whodis-deathmatch";

const EMPTY_RECORD: DeathmatchRecord = {
  results: {},
  fights_played: 0,
  overall_correct: 0,
  overall_total: 0,
  best_score: 0,
};

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
  const winnerName =
    result.winner === "a" ? fighterA : result.winner === "b" ? fighterB : "DRAW";
  const score =
    result.winner === "draw"
      ? `${result.fight_score_a}–${result.fight_score_b}`
      : `${result.fight_score_a}–${result.fight_score_b}`;
  return [
    "WHO DIS? DEATHMATCH ⚡",
    `${fighterA} vs ${fighterB}`,
    `${result.verdict}: ${winnerName} wins ${score}`,
    `${result.accuracy}/${result.total} correct`,
    emojis,
  ].join("\n");
}

// --- localStorage ---

export function loadRecord(): DeathmatchRecord {
  if (typeof window === "undefined") return EMPTY_RECORD;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_RECORD;
    return JSON.parse(raw);
  } catch {
    return EMPTY_RECORD;
  }
}

export function saveResult(slug: string, result: FightResult): DeathmatchRecord {
  const record = loadRecord();
  record.results[slug] = result;

  // Recalculate totals from all results
  let correct = 0;
  let total = 0;
  let best = 0;
  for (const r of Object.values(record.results)) {
    correct += r.accuracy;
    total += r.total;
    if (r.accuracy > best) best = r.accuracy;
  }

  record.fights_played = Object.keys(record.results).length;
  record.overall_correct = correct;
  record.overall_total = total;
  record.best_score = best;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  return record;
}
