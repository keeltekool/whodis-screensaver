"use client";

import { useState } from "react";
import { FightResult as FightResultType, Fighter } from "@/lib/types";
import { generateShareCard, getRank, loadRecord } from "@/lib/deathmatch";
import FighterDisplay from "./FighterDisplay";

interface FightResultProps {
  slug: string;
  fighterA: Fighter;
  fighterB: Fighter;
  photoBaseUrl: string;
  result: FightResultType;
}

export default function FightResult({ slug, fighterA, fighterB, photoBaseUrl, result }: FightResultProps) {
  const [copied, setCopied] = useState(false);
  const winnerName = result.winner === "a" ? fighterA.name : result.winner === "b" ? fighterB.name : null;
  const record = loadRecord();
  const overallAccuracy = record.overall_total > 0 ? record.overall_correct / record.overall_total : 0;
  const shareText = generateShareCard(fighterA.name, fighterB.name, result);
  const pastAttempts = record.history?.[slug] || [];
  const attemptNumber = pastAttempts.length + 1;
  const bestEver = pastAttempts.length > 0 ? Math.max(result.accuracy, ...pastAttempts.map(a => a.accuracy)) : result.accuracy;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const lastNameA = fighterA.name.split(" ").pop();
  const lastNameB = fighterB.name.split(" ").pop();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-2xl mx-auto">
      <span className="font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant/50 mb-6">
        Deathmatch Result
      </span>

      <div className="flex gap-4 md:gap-8 mb-6">
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

      <p className="font-headline font-bold text-2xl text-on-surface mb-1">
        {lastNameA} {result.fight_score_a} — {result.fight_score_b} {lastNameB}
      </p>

      <p className="font-headline font-bold text-lg text-primary-fixed-dim mb-6">
        ⚡ {winnerName ? `${winnerName.toUpperCase()} WINS` : "DRAW"}
      </p>

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
          {attemptNumber > 1 && (
            <p className="font-label text-xs uppercase tracking-[0.15em] text-on-surface-variant/60">
              Attempt #{attemptNumber} · Best: {bestEver}/7
            </p>
          )}
        </div>

        <p className="text-center text-xl mt-3 tracking-widest">
          {result.correct.map((c, i) => (
            <span key={i}>{c ? "🟨" : "⬛"}</span>
          ))}
        </p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleShare}
          className="bg-surface-container-high text-on-surface font-label font-bold text-sm py-4 px-8 tracking-[0.1em] uppercase transition-all hover:bg-surface-bright"
        >
          {copied ? "COPIED ✓" : "SHARE"}
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
