export type Celebrity = {
  id: number;
  name: string;
  category: string;
  era: string;
  hint_2: string;
  photo_key: string;
  photo_type?: string;
};

// --- Deathmatch types ---

export type Fighter = {
  id: number;
  name: string;
  photo_key: string;
  nickname: string;
  category?: string;
  era?: string;
};

export type Matchup = {
  id: number;
  slug: string;
  fighter_a: Fighter;
  fighter_b: Fighter;
  tagline: string;
  matchup_type: string;
  difficulty: number;
};

export type MatchupRound = {
  round_number: number;
  round_label: string;
  question_text: string;
};

export type AnswerResult = {
  correct: boolean;
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
