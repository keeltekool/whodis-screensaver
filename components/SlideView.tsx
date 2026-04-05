"use client";

import { Celebrity } from "@/lib/types";

interface SlideViewProps {
  celebrity: Celebrity;
  photoBaseUrl: string;
  showFact: boolean;
}

export default function SlideView({ celebrity, photoBaseUrl, showFact }: SlideViewProps) {
  const photoUrl = `${photoBaseUrl}/photos/${celebrity.photo_key}`;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-4">
      <div className="w-full max-w-2xl photo-matte relative overflow-hidden" style={{ maxHeight: "calc(100vh - 80px)" }}>
        <div className="relative aspect-[3/4] h-full">
          <img
            src={photoUrl}
            alt={celebrity.name}
            className="w-full h-full object-cover photo-filter"
          />
          <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black via-black/40 to-transparent">
            <h2 className="font-headline font-black text-4xl md:text-5xl text-white tracking-tighter leading-[0.85] mb-2">
              {celebrity.name.toUpperCase()}
            </h2>
            {showFact && (
              <p className="font-body text-sm text-on-surface-variant font-light leading-relaxed max-w-[90%]">
                {celebrity.hint_2}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <span className="bg-secondary-container text-on-secondary-container px-3 py-1 font-label text-[10px] font-bold uppercase tracking-widest">
          {celebrity.category}
        </span>
        <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 font-label text-[10px] font-bold uppercase tracking-widest">
          {celebrity.era}
        </span>
      </div>
    </div>
  );
}
