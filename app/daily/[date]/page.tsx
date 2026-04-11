"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getTodayDateStr } from "@/lib/daily";
import { MatchupRound, FightResult as FightResultType, Fighter, AnswerResult } from "@/lib/types";
import { getVerdict, saveResult } from "@/lib/deathmatch";
import FighterDisplay from "@/components/FighterDisplay";
import FightScore from "@/components/FightScore";
import QuestionScreen from "@/components/QuestionScreen";
import AnswerReveal from "@/components/AnswerReveal";
import FightResultScreen from "@/components/FightResult";

const R2_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://pub-19f678b6a57845a7bafc5e706541ab76.r2.dev";

type Phase = "loading" | "error" | "prefight" | "question" | "reveal" | "result";

type MatchupData = {
  slug: string;
  tagline: string;
  fighter_a: Fighter & { category: string; era: string };
  fighter_b: Fighter & { category: string; era: string };
  rounds: MatchupRound[];
};

export default function DailyChallengePage() {
  const params = useParams();
  const dateParam = params.date as string;
  const today = getTodayDateStr();

  const [matchup, setMatchup] = useState<MatchupData | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorType, setErrorType] = useState("");
  const [currentRound, setCurrentRound] = useState(0);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [correctList, setCorrectList] = useState<boolean[]>([]);
  const [answersList, setAnswersList] = useState<("a" | "b")[]>([]);
  const [lastReveal, setLastReveal] = useState<AnswerResult | null>(null);
  const [answering, setAnswering] = useState(false);
  const [roundOrder, setRoundOrder] = useState<number[]>([]);
  const [finalResult, setFinalResult] = useState<FightResultType | null>(null);
  const [slug, setSlug] = useState("");

  useEffect(() => {
    if (dateParam > today) {
      setErrorType("future");
      setPhase("error");
      return;
    }

    // Fetch today's challenge
    fetch(`/api/daily/challenge?date=${dateParam}`)
      .then((res) => res.json())
      .then((challenge) => {
        if (challenge.error || !challenge.matchup_id) {
          setErrorType(challenge.error || "not available");
          setPhase("error");
          return;
        }

        // Fetch the matchup details
        fetch("/api/deathmatch")
          .then((res) => res.json())
          .then((matchups) => {
            const found = matchups.find((m: { id: number }) => m.id === challenge.matchup_id);
            if (!found) {
              setErrorType("matchup not found");
              setPhase("error");
              return;
            }
            setSlug(found.slug);

            // Fetch full matchup with rounds
            fetch(`/api/deathmatch/${found.slug}`)
              .then((res) => res.json())
              .then((data) => {
                setMatchup(data);
                const indices = data.rounds.map((_: MatchupRound, i: number) => i);
                for (let i = indices.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [indices[i], indices[j]] = [indices[j], indices[i]];
                }
                setRoundOrder(indices);
                setPhase("prefight");
              });
          });
      })
      .catch(() => {
        setErrorType("not available");
        setPhase("error");
      });
  }, [dateParam, today]);

  if (phase === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-surface">
        <span className="font-headline text-xl text-primary-fixed-dim animate-pulse">Loading...</span>
      </main>
    );
  }

  if (phase === "error") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-surface px-6">
        <span className="font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant/50 mb-4">
          THE DAILY · {dateParam}
        </span>
        <h1 className="font-headline font-black text-3xl text-primary-fixed-dim mb-4">
          {errorType === "future" ? "NOT YET" : "NOT AVAILABLE"}
        </h1>
        <p className="text-on-surface-variant font-body text-sm text-center max-w-sm">
          {errorType === "future"
            ? `This challenge hasn't dropped yet. Come back on ${dateParam}.`
            : "This daily challenge is not available."}
        </p>
        <a href="/daily" className="mt-8 bg-primary-container text-on-primary font-label font-bold text-sm py-4 px-12 tracking-[0.1em] uppercase">
          ← BACK
        </a>
      </main>
    );
  }

  if (!matchup) return null;

  const { fighter_a, fighter_b, rounds } = matchup;
  const shuffledRounds = roundOrder.map((i) => rounds[i]);
  const round = shuffledRounds[currentRound];
  const totalRounds = rounds.length;

  const handleAnswer = async (answer: "a" | "b") => {
    setAnswering(true);
    try {
      const originalRound = rounds[roundOrder[currentRound]];
      const res = await fetch(`/api/deathmatch/${slug}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ round_number: originalRound.round_number, answer }),
      });
      const data: AnswerResult = await res.json();

      setCorrectList((prev) => [...prev, data.correct]);
      setAnswersList((prev) => [...prev, answer]);

      if (data.correct_answer === "a") setScoreA((s) => s + 1);
      else setScoreB((s) => s + 1);

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
      const finalAccuracy = correctList.filter(Boolean).length;
      const winner = scoreA > scoreB ? "a" as const : scoreB > scoreA ? "b" as const : "draw" as const;

      const result: FightResultType = {
        accuracy: finalAccuracy,
        total: totalRounds,
        fight_score_a: scoreA,
        fight_score_b: scoreB,
        winner,
        verdict: getVerdict(finalAccuracy),
        date: dateParam,
        answers: answersList,
        correct: correctList,
      };

      saveResult(`daily-${dateParam}`, result);
      setFinalResult(result);
      setPhase("result");
    } else {
      setCurrentRound((r) => r + 1);
      setLastReveal(null);
      setPhase("question");
    }
  };

  // --- PREFIGHT ---
  if (phase === "prefight") {
    return (
      <main className="min-h-screen flex flex-col bg-surface">
        <div className="flex-1 flex flex-col items-center justify-center px-3 py-6 md:px-6 md:py-8">
          <span className="font-label text-[10px] uppercase tracking-[0.3em] text-primary-fixed-dim/60 mb-2">
            THE DAILY · {dateParam}
          </span>
          <span className="font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant/50 mb-8">
            Celebrity Deathmatch
          </span>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-10 items-center mb-6">
            <FighterDisplay name={fighter_a.name} nickname={fighter_a.nickname} photoKey={fighter_a.photo_key} photoBaseUrl={R2_BASE} category={fighter_a.category} era={fighter_a.era} />
            <span className="font-headline font-black text-3xl text-primary-fixed-dim sm:mt-16">⚡</span>
            <FighterDisplay name={fighter_b.name} nickname={fighter_b.nickname} photoKey={fighter_b.photo_key} photoBaseUrl={R2_BASE} category={fighter_b.category} era={fighter_b.era} />
          </div>

          <p className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant/60 mb-8">
            {matchup.tagline}
          </p>

          <button onClick={() => setPhase("question")} className="bg-primary-container text-on-primary font-label font-bold text-sm py-4 px-16 tracking-[0.1em] uppercase transition-all hover:brightness-110">
            FIGHT →
          </button>
        </div>
      </main>
    );
  }

  // --- QUESTION ---
  if (phase === "question" && round) {
    return (
      <main className="min-h-screen flex flex-col bg-surface">
        <FightScore nameA={fighter_a.name} nameB={fighter_b.name} scoreA={scoreA} scoreB={scoreB} round={currentRound + 1} totalRounds={totalRounds} />
        <QuestionScreen
          roundNumber={currentRound + 1} roundLabel={round.round_label} questionText={round.question_text}
          fighterAName={fighter_a.name} fighterBName={fighter_b.name}
          fighterAPhotoKey={fighter_a.photo_key} fighterBPhotoKey={fighter_b.photo_key}
          photoBaseUrl={R2_BASE} onAnswer={handleAnswer} disabled={answering}
        />
      </main>
    );
  }

  // --- REVEAL ---
  if (phase === "reveal" && lastReveal) {
    const correctFighter = lastReveal.correct_answer === "a" ? fighter_a : fighter_b;
    return (
      <main className="min-h-screen flex flex-col bg-surface">
        <FightScore nameA={fighter_a.name} nameB={fighter_b.name} scoreA={scoreA} scoreB={scoreB} round={currentRound + 1} totalRounds={totalRounds} />
        <AnswerReveal
          correct={lastReveal.correct} correctFighterName={correctFighter.name} correctFighterPhotoKey={correctFighter.photo_key}
          photoBaseUrl={R2_BASE} explanation={lastReveal.explanation} funFact={lastReveal.fun_fact}
          pointFor={correctFighter.name} isLastRound={currentRound + 1 >= totalRounds} onNext={handleNextRound}
        />
      </main>
    );
  }

  // --- RESULT ---
  if (phase === "result" && finalResult) {
    return (
      <main className="min-h-screen flex flex-col bg-surface">
        <FightResultScreen slug={`daily-${dateParam}`} fighterA={fighter_a} fighterB={fighter_b} photoBaseUrl={R2_BASE} result={finalResult} />
      </main>
    );
  }

  return null;
}
