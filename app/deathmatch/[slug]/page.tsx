"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { MatchupRound, FightResult as FightResultType, Fighter, AnswerResult } from "@/lib/types";
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
  fighter_a: Fighter & { category: string; era: string };
  fighter_b: Fighter & { category: string; era: string };
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
  const [correctList, setCorrectList] = useState<boolean[]>([]);
  const [answersList, setAnswersList] = useState<("a" | "b")[]>([]);
  const [lastReveal, setLastReveal] = useState<AnswerResult | null>(null);
  const [answering, setAnswering] = useState(false);
  const [roundOrder, setRoundOrder] = useState<number[]>([]);
  const [finalResult, setFinalResult] = useState<FightResultType | null>(null);

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

      const newCorrectList = [...correctList, data.correct];
      const newAnswersList = [...answersList, answer];
      setCorrectList(newCorrectList);
      setAnswersList(newAnswersList);

      // Point always goes to the correct fighter
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
      // Fight over
      const finalAccuracy = correctList.filter(Boolean).length;
      const finalScoreA = scoreA;
      const finalScoreB = scoreB;
      const winner = finalScoreA > finalScoreB ? "a" as const : finalScoreB > finalScoreA ? "b" as const : "draw" as const;

      const result: FightResultType = {
        accuracy: finalAccuracy,
        total: totalRounds,
        fight_score_a: finalScoreA,
        fight_score_b: finalScoreB,
        winner,
        verdict: getVerdict(finalAccuracy),
        date: new Date().toISOString().split("T")[0],
        answers: answersList,
        correct: correctList,
      };

      saveResult(slug, result);
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
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <span className="font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant/50 mb-8">
            Celebrity Deathmatch
          </span>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-10 items-center mb-6">
            <FighterDisplay
              name={fighter_a.name}
              nickname={fighter_a.nickname}
              photoKey={fighter_a.photo_key}
              photoBaseUrl={R2_BASE}
              category={fighter_a.category}
              era={fighter_a.era}
            />

            <span className="font-headline font-black text-3xl text-primary-fixed-dim sm:mt-16">⚡</span>

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
            onClick={() => setPhase("question")}
            className="bg-primary-container text-on-primary font-label font-bold text-sm py-4 px-16 tracking-[0.1em] uppercase transition-all hover:brightness-110"
          >
            FIGHT →
          </button>

          <a
            href="/deathmatch"
            className="mt-4 font-label text-[10px] uppercase tracking-widest text-on-surface-variant/40 hover:text-primary-fixed-dim transition-colors"
          >
            ← Back to fights
          </a>
        </div>
      </main>
    );
  }

  // --- QUESTION ---
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
          fighterAPhotoKey={fighter_a.photo_key}
          fighterBPhotoKey={fighter_b.photo_key}
          photoBaseUrl={R2_BASE}
          onAnswer={handleAnswer}
          disabled={answering}
        />
      </main>
    );
  }

  // --- REVEAL ---
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
          isLastRound={currentRound + 1 >= totalRounds}
          onNext={handleNextRound}
        />
      </main>
    );
  }

  // --- RESULT ---
  if (phase === "result" && finalResult) {
    return (
      <main className="min-h-screen flex flex-col bg-surface">
        <FightResultScreen
          slug={slug}
          fighterA={fighter_a}
          fighterB={fighter_b}
          photoBaseUrl={R2_BASE}
          result={finalResult}
        />
      </main>
    );
  }

  return null;
}
