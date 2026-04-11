interface FighterDisplayProps {
  name: string;
  nickname: string;
  photoKey: string;
  photoBaseUrl: string;
  category?: string;
  era?: string;
  dimmed?: boolean;
}

export default function FighterDisplay({ name, nickname, photoKey, photoBaseUrl, category, era, dimmed }: FighterDisplayProps) {
  return (
    <div className={`flex flex-col items-center w-[140px] sm:w-[200px] ${dimmed ? "opacity-40 grayscale" : ""} transition-all duration-500`}>
      <div className="photo-matte w-full">
        <div className="aspect-[3/4] overflow-hidden">
          <img
            src={`${photoBaseUrl}/photos/${photoKey}`}
            alt={name}
            className="w-full h-full object-cover photo-filter"
          />
        </div>
      </div>
      <h3 className="font-headline font-bold text-sm sm:text-lg md:text-xl text-on-surface mt-2 sm:mt-3 text-center tracking-tight">
        {name.toUpperCase()}
      </h3>
      <p className="font-body text-[10px] sm:text-xs text-on-surface-variant/60 italic text-center">
        &ldquo;{nickname}&rdquo;
      </p>
      {category && era && (
        <div className="mt-1 sm:mt-2 flex gap-1 sm:gap-2">
          <span className="bg-secondary-container text-on-secondary-container px-1.5 sm:px-2 py-0.5 font-label text-[8px] sm:text-[9px] font-bold uppercase tracking-widest">
            {category}
          </span>
          <span className="bg-surface-container-high text-on-surface-variant px-1.5 sm:px-2 py-0.5 font-label text-[8px] sm:text-[9px] font-bold uppercase tracking-widest">
            {era}
          </span>
        </div>
      )}
    </div>
  );
}
