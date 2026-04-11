interface FightScoreProps {
  nameA: string;
  nameB: string;
  scoreA: number;
  scoreB: number;
  round: number;
  totalRounds: number;
}

export default function FightScore({ nameA, nameB, scoreA, scoreB, round, totalRounds }: FightScoreProps) {
  const lastNameA = nameA.split(" ").pop();
  const lastNameB = nameB.split(" ").pop();

  return (
    <div className="flex flex-col items-center py-3 sm:py-4 bg-surface-container-low">
      <div className="flex items-center gap-2 sm:gap-4 px-4">
        <span className="font-label text-[10px] sm:text-sm uppercase tracking-[0.05em] sm:tracking-[0.1em] text-on-surface-variant text-right min-w-0 sm:min-w-[120px] truncate max-w-[80px] sm:max-w-none">
          {lastNameA}
        </span>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <span className="font-headline font-black text-xl sm:text-2xl text-primary-fixed-dim w-6 sm:w-8 text-center">{scoreA}</span>
          <span className="font-headline font-black text-base sm:text-lg text-on-surface-variant/30">—</span>
          <span className="font-headline font-black text-xl sm:text-2xl text-primary-fixed-dim w-6 sm:w-8 text-center">{scoreB}</span>
        </div>
        <span className="font-label text-[10px] sm:text-sm uppercase tracking-[0.05em] sm:tracking-[0.1em] text-on-surface-variant text-left min-w-0 sm:min-w-[120px] truncate max-w-[80px] sm:max-w-none">
          {lastNameB}
        </span>
      </div>
      <span className="font-label text-[8px] sm:text-[9px] uppercase tracking-[0.3em] text-on-surface-variant/40 mt-1">
        Round {round} of {totalRounds}
      </span>
    </div>
  );
}
