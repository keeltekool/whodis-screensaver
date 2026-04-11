import Image from "next/image";

interface QuestionScreenProps {
  roundNumber: number;
  roundLabel: string;
  questionText: string;
  fighterAName: string;
  fighterBName: string;
  fighterAPhotoKey: string;
  fighterBPhotoKey: string;
  photoBaseUrl: string;
  onAnswer: (answer: "a" | "b") => void;
  disabled: boolean;
}

export default function QuestionScreen({
  roundNumber, roundLabel, questionText, fighterAName, fighterBName,
  fighterAPhotoKey, fighterBPhotoKey, photoBaseUrl, onAnswer, disabled,
}: QuestionScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-3 py-6 md:px-6 md:py-8 max-w-3xl mx-auto">
      <span className="font-label text-[10px] uppercase tracking-[0.3em] text-primary-fixed-dim/60 mb-4">
        Round {roundNumber} · {roundLabel}
      </span>

      <p className="font-headline text-lg md:text-xl text-on-surface text-center leading-snug mb-4 max-w-lg">
        {questionText}
      </p>

      <span className="font-label text-[9px] uppercase tracking-[0.3em] text-on-surface-variant/30 mb-6">
        Pick your answer
      </span>

      <div className="grid grid-cols-2 gap-3 md:gap-6 w-full max-w-lg">
        <button
          onClick={() => onAnswer("a")}
          disabled={disabled}
          className="group relative bg-surface-container-low cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center hover:scale-[1.03] hover:outline hover:outline-2 hover:outline-primary-fixed-dim active:scale-[0.98]"
        >
          <div className="w-full aspect-[3/4] overflow-hidden relative">
            <Image
              src={`${photoBaseUrl}/photos/${fighterAPhotoKey}`}
              alt={fighterAName}
              fill
              sizes="(max-width: 640px) 40vw, 250px"
              className="object-cover photo-filter group-hover:brightness-125 transition-all duration-200"
            />
            <div className="absolute inset-0 bg-primary-fixed-dim/0 group-hover:bg-primary-fixed-dim/10 transition-all duration-200" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="bg-primary-fixed-dim/90 text-on-primary font-label font-bold text-xs px-4 py-2 uppercase tracking-[0.15em]">
                Select
              </span>
            </div>
          </div>
          <span className="font-label font-bold text-sm text-on-surface py-4 uppercase tracking-[0.1em] group-hover:text-primary-fixed-dim transition-colors">
            {fighterAName}
          </span>
        </button>
        <button
          onClick={() => onAnswer("b")}
          disabled={disabled}
          className="group relative bg-surface-container-low cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center hover:scale-[1.03] hover:outline hover:outline-2 hover:outline-primary-fixed-dim active:scale-[0.98]"
        >
          <div className="w-full aspect-[3/4] overflow-hidden relative">
            <Image
              src={`${photoBaseUrl}/photos/${fighterBPhotoKey}`}
              alt={fighterBName}
              fill
              sizes="(max-width: 640px) 40vw, 250px"
              className="object-cover photo-filter group-hover:brightness-125 transition-all duration-200"
            />
            <div className="absolute inset-0 bg-primary-fixed-dim/0 group-hover:bg-primary-fixed-dim/10 transition-all duration-200" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="bg-primary-fixed-dim/90 text-on-primary font-label font-bold text-xs px-4 py-2 uppercase tracking-[0.15em]">
                Select
              </span>
            </div>
          </div>
          <span className="font-label font-bold text-sm text-on-surface py-4 uppercase tracking-[0.1em] group-hover:text-primary-fixed-dim transition-colors">
            {fighterBName}
          </span>
        </button>
      </div>
    </div>
  );
}
