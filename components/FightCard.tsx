"use client";

import Image from "next/image";
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
      className={`flex flex-col bg-surface-container-low transition-all hover:bg-surface-container-high ${played ? "opacity-60" : ""}`}
    >
      <div className="flex">
        <div className="flex-1 aspect-[3/4] overflow-hidden relative">
          <Image
            src={`${photoBaseUrl}/photos/${fighter_a.photo_key}`}
            alt={fighter_a.name}
            fill
            sizes="(max-width: 640px) 25vw, (max-width: 1024px) 20vw, 15vw"
            className="object-cover photo-filter"
          />
          <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3 bg-gradient-to-t from-black/80 to-transparent">
            <span className="font-headline font-bold text-[10px] sm:text-sm text-white tracking-tight">
              {fighter_a.name.split(" ").pop()?.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="w-[3px] bg-primary-fixed-dim flex-shrink-0" />
        <div className="flex-1 aspect-[3/4] overflow-hidden relative">
          <Image
            src={`${photoBaseUrl}/photos/${fighter_b.photo_key}`}
            alt={fighter_b.name}
            fill
            sizes="(max-width: 640px) 25vw, (max-width: 1024px) 20vw, 15vw"
            className="object-cover photo-filter"
          />
          <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3 bg-gradient-to-t from-black/80 to-transparent">
            <span className="font-headline font-bold text-[10px] sm:text-sm text-white tracking-tight">
              {fighter_b.name.split(" ").pop()?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="p-2.5 sm:p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-primary-fixed-dim">
              {stars}
            </span>
            <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 font-label text-[8px] font-bold uppercase tracking-widest">
              {matchup.matchup_type}
            </span>
          </div>
          {played && (
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
              ✓ {accuracy}/7
            </span>
          )}
        </div>
        <p className="font-label text-[9px] sm:text-xs uppercase tracking-[0.1em] sm:tracking-[0.15em] text-on-surface-variant leading-snug min-h-[2rem] sm:min-h-[2.5rem]">
          {tagline}
        </p>
        <div className="mt-auto pt-3">
          {played ? (
            <span className="block w-full bg-surface-container-high text-on-surface-variant/40 font-label font-bold text-xs sm:text-sm py-2.5 sm:py-3 tracking-[0.1em] uppercase text-center">
              REPLAY →
            </span>
          ) : (
            <span className="block w-full bg-primary-container text-on-primary font-label font-bold text-xs sm:text-sm py-2.5 sm:py-3 tracking-[0.1em] uppercase text-center">
              FIGHT →
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
