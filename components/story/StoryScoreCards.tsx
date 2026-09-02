interface ScoreCardProps {
  label: string;
  value: string;
  sublabel: string;
  progress: number; // 0–1
}

function ScoreCard({ label, value, sublabel, progress }: ScoreCardProps) {
  return (
    <div className="bg-surface rounded-xl border border-[var(--border)] px-4 pt-4 pb-3 flex flex-col gap-1.5 relative overflow-hidden">
      <p className="font-mono-brand text-[9px] uppercase tracking-[0.2em] text-dust leading-none">
        {label}
      </p>
      <p
        className="text-[26px] md:text-[28px] font-extrabold tracking-tight leading-none"
        style={{ color: "var(--teal)" }}
      >
        {value}
      </p>
      <p className="text-[11px] text-stone leading-none">{sublabel}</p>
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-chalk">
        <div
          className="h-full transition-all duration-700"
          style={{
            width: `${Math.min(Math.max(progress, 0), 1) * 100}%`,
            background: "var(--teal)",
          }}
        />
      </div>
    </div>
  );
}

interface Props {
  monthScore: number | null;
  checkIns: number;
  perfectWeeks: number;
  totalWeeks: number;
  topConsistency: number | null; // 0–100
}

export default function StoryScoreCards({
  monthScore,
  checkIns,
  perfectWeeks,
  totalWeeks,
  topConsistency,
}: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 shrink-0">
      <ScoreCard
        label="Month score"
        value={monthScore !== null ? `${monthScore}%` : "—"}
        sublabel="avg weekly score"
        progress={(monthScore ?? 0) / 100}
      />
      <ScoreCard
        label="Check-ins"
        value={String(checkIns)}
        sublabel={checkIns === 1 ? "completion" : "completions"}
        progress={Math.min(checkIns / 90, 1)}
      />
      <ScoreCard
        label="Perfect weeks"
        value={totalWeeks > 0 ? String(perfectWeeks) : "—"}
        sublabel={`of ${totalWeeks} week${totalWeeks !== 1 ? "s" : ""}`}
        progress={totalWeeks > 0 ? perfectWeeks / totalWeeks : 0}
      />
      <ScoreCard
        label="Top consistency"
        value={topConsistency !== null ? `${topConsistency}%` : "—"}
        sublabel="best habit this month"
        progress={(topConsistency ?? 0) / 100}
      />
    </div>
  );
}
