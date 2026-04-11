"use client";

import { useState, useEffect, useMemo } from "react";
import { Matchup } from "@/lib/types";
import { loadRecord, getRank } from "@/lib/deathmatch";
import FightCard from "@/components/FightCard";

const R2_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://pub-19f678b6a57845a7bafc5e706541ab76.r2.dev";

const CATEGORIES = ["all", "film", "music", "athlete", "crossover"] as const;
type Category = (typeof CATEGORIES)[number];

const DIFFICULTIES = ["all", 1, 2, 3] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

const CATEGORY_LABELS: Record<Category, string> = {
  all: "ALL FIGHTS",
  film: "FILM",
  music: "MUSIC",
  athlete: "ATHLETE",
  crossover: "CROSSOVER",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  all: "ALL LEVELS",
  "1": "★ EASY",
  "2": "★★ MEDIUM",
  "3": "★★★ HARD",
};

export default function DeathmatchPage() {
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty>("all");
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

  // Matchups filtered by difficulty (top-level filter)
  const difficultyFiltered = useMemo(() => {
    if (activeDifficulty === "all") return matchups;
    return matchups.filter((m) => m.difficulty === activeDifficulty);
  }, [matchups, activeDifficulty]);

  // Final filtered list (difficulty + category)
  const filteredMatchups = useMemo(() => {
    const list = activeCategory === "all" ? [...difficultyFiltered] : difficultyFiltered.filter((m) => m.matchup_type === activeCategory);
    // Shuffle in "all" category view
    if (activeCategory === "all") {
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
    }
    return list;
  }, [difficultyFiltered, activeCategory]);

  // Category counts — based on difficulty-filtered set
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of difficultyFiltered) {
      counts[m.matchup_type] = (counts[m.matchup_type] || 0) + 1;
    }
    return counts;
  }, [difficultyFiltered]);

  // Difficulty counts — based on full matchup set (top-level, not affected by category)
  const difficultyCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const m of matchups) {
      counts[m.difficulty] = (counts[m.difficulty] || 0) + 1;
    }
    return counts;
  }, [matchups]);

  const overallAccuracy =
    record && record.overall_total > 0 ? record.overall_correct / record.overall_total : 0;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-surface">
        <span className="font-headline text-xl text-primary-fixed-dim animate-pulse">Loading...</span>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface">
      <section className="px-4 md:px-8 pt-16 pb-6 max-w-5xl mx-auto">
        <a
          href="/"
          className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/50 hover:text-primary-fixed-dim transition-colors"
        >
          ← Back
        </a>
        <h1 className="font-headline font-black text-5xl md:text-6xl text-primary-fixed-dim tracking-tighter mt-4">
          DEATHMATCH
        </h1>
        <p className="mt-2 text-on-surface-variant font-body text-sm font-light">
          Two legends. Seven rounds. Your knowledge decides who wins.
        </p>

        {record && record.fights_played > 0 && (
          <div className="mt-4 flex flex-wrap gap-6 text-on-surface-variant/60 font-label text-[10px] uppercase tracking-[0.2em]">
            <span>{record.fights_played}/{matchups.length} fights</span>
            <span>{Math.round(overallAccuracy * 100)}% accuracy</span>
            <span>Best: {record.best_score}/7</span>
            <span>{getRank(overallAccuracy)}</span>
          </div>
        )}
      </section>

      {/* Difficulty Filter (top level) */}
      <section className="px-4 md:px-8 pb-2 max-w-5xl mx-auto">
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((diff) => {
            const isActive = activeDifficulty === diff;
            const count = diff === "all" ? matchups.length : difficultyCounts[diff as number] || 0;
            return (
              <button
                key={String(diff)}
                onClick={() => setActiveDifficulty(diff)}
                className={`font-label text-[10px] sm:text-xs font-bold uppercase tracking-[0.05em] sm:tracking-[0.1em] px-2.5 sm:px-4 py-1.5 sm:py-2 transition-all ${
                  isActive
                    ? "bg-primary-container text-on-primary"
                    : "bg-surface-container-high text-on-surface-variant/60 hover:text-on-surface-variant hover:bg-surface-bright"
                }`}
              >
                {DIFFICULTY_LABELS[String(diff)]} ({count})
              </button>
            );
          })}
        </div>
      </section>

      {/* Category Filter (second level) */}
      <section className="px-4 md:px-8 pb-6 max-w-5xl mx-auto">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const count = cat === "all" ? difficultyFiltered.length : categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`font-label text-[10px] sm:text-xs font-bold uppercase tracking-[0.05em] sm:tracking-[0.1em] px-2.5 sm:px-4 py-1.5 sm:py-2 transition-all ${
                  isActive
                    ? "bg-primary-container text-on-primary"
                    : "bg-surface-container-high text-on-surface-variant/60 hover:text-on-surface-variant hover:bg-surface-bright"
                }`}
              >
                {CATEGORY_LABELS[cat]} ({count})
              </button>
            );
          })}
        </div>
      </section>

      {/* Fight Cards Grid */}
      <section className="px-4 md:px-8 pb-16 max-w-5xl mx-auto">
        {filteredMatchups.length === 0 ? (
          <p className="text-on-surface-variant/40 font-label text-sm uppercase tracking-[0.1em] text-center py-12">
            No matchups for this combination
          </p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {filteredMatchups.map((m) => (
              <FightCard
                key={m.slug}
                matchup={m}
                photoBaseUrl={R2_BASE}
                played={!!record?.results[m.slug]}
                accuracy={record?.results[m.slug]?.accuracy}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
