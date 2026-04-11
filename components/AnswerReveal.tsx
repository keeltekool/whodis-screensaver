import Image from "next/image";

interface AnswerRevealProps {
  correct: boolean;
  correctFighterName: string;
  correctFighterPhotoKey: string;
  photoBaseUrl: string;
  explanation: string;
  funFact: string | null;
  pointFor: string;
  isLastRound: boolean;
  onNext: () => void;
}

export default function AnswerReveal({
  correct, correctFighterName, correctFighterPhotoKey, photoBaseUrl, explanation, funFact, pointFor, isLastRound, onNext,
}: AnswerRevealProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-3 py-6 md:px-6 md:py-8 max-w-2xl mx-auto">
      <span className={`font-headline font-bold text-xl sm:text-2xl mb-3 sm:mb-4 ${correct ? "text-green-400" : "text-red-400"}`}>
        {correct ? "✓ CORRECT" : "✗ WRONG"}
      </span>

      <div className="photo-matte w-full max-w-[60vw] sm:max-w-[320px] mb-3 sm:mb-4">
        <div className="aspect-[3/4] overflow-hidden relative">
          <Image
            src={`${photoBaseUrl}/photos/${correctFighterPhotoKey}`}
            alt={correctFighterName}
            fill
            sizes="(max-width: 640px) 180px, 320px"
            className="object-cover photo-filter"
          />
        </div>
      </div>

      <p className="font-label text-[10px] sm:text-xs uppercase tracking-[0.15em] text-primary-fixed-dim mb-2 sm:mb-3">
        Point → {pointFor}
      </p>

      <p className="font-body text-xs sm:text-sm text-on-surface-variant font-light leading-relaxed text-center max-w-md mb-2">
        {explanation}
      </p>

      {funFact && (
        <p className="font-body text-[11px] sm:text-xs text-on-surface-variant/50 italic text-center max-w-md mb-4 sm:mb-6">
          {funFact}
        </p>
      )}

      <button
        onClick={onNext}
        className="bg-primary-container text-on-primary font-label font-bold text-sm py-4 px-12 tracking-[0.1em] uppercase transition-all hover:brightness-110"
      >
        {isLastRound ? "SEE RESULTS →" : "NEXT ROUND →"}
      </button>
    </div>
  );
}
