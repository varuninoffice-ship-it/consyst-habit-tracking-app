import type { Grade } from "@/lib/business/pulse";

// ─── Grade color map ──────────────────────────────────────────────────────────

const GRADE_COLOR: Record<Grade, string> = {
  A: "var(--teal)",
  B: "var(--amber)",
  C: "var(--coral)",
};

const GRADE_BG: Record<Grade, string> = {
  A: "var(--teal-lt)",
  B: "var(--amber-lt)",
  C: "var(--coral-lt)",
};

// ─── Threshold bar ────────────────────────────────────────────────────────────

function ThresholdBar({ weekScore }: { weekScore: number | null }) {
  const score = weekScore ?? 0;
  const clampedScore = Math.min(Math.max(score, 0), 100);

  return (
    <div className="mt-4">
      {/* Zone labels */}
      <div className="flex text-[9px] font-mono uppercase tracking-widest text-dust mb-1 select-none">
        <span style={{ width: "70%" }}>C</span>
        <span style={{ width: "15%" }}>B</span>
        <span style={{ width: "15%", textAlign: "right" }}>A</span>
      </div>

      {/* Bar */}
      <div className="relative h-2 rounded-full overflow-visible">
        {/* C zone — 0–70% */}
        <div
          className="absolute top-0 left-0 h-full rounded-l-full"
          style={{ width: "70%", background: "var(--coral-lt)" }}
        />
        {/* B zone — 70–85% */}
        <div
          className="absolute top-0 h-full"
          style={{
            left: "70%",
            width: "15%",
            background: "var(--amber-lt)",
          }}
        />
        {/* A zone — 85–100% */}
        <div
          className="absolute top-0 h-full rounded-r-full"
          style={{
            left: "85%",
            width: "15%",
            background: "var(--teal-lt)",
          }}
        />

        {/* Boundary lines */}
        {[70, 85].map((pct) => (
          <div
            key={pct}
            className="absolute top-0 h-full w-px bg-[var(--border-md)]"
            style={{ left: `${pct}%` }}
          />
        ))}

        {/* Score indicator */}
        {weekScore !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-surface shadow-sm z-10 transition-all duration-500"
            style={{
              left: `${clampedScore}%`,
              background: "var(--amber)",
            }}
          />
        )}
      </div>

      {/* Threshold numeric labels */}
      <div className="relative mt-1.5 h-3 select-none">
        {[70, 85].map((pct) => (
          <span
            key={pct}
            className="absolute font-mono text-[8px] text-dust -translate-x-1/2"
            style={{ left: `${pct}%` }}
          >
            {pct}%
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Grade card ───────────────────────────────────────────────────────────────

interface GradeCardProps {
  grade: Grade | null;
  weekScore: number | null;
  message: string;
}

export default function GradeCard({ grade, weekScore, message }: GradeCardProps) {
  const color = grade ? GRADE_COLOR[grade] : "var(--dust)";
  const bg    = grade ? GRADE_BG[grade]   : "var(--chalk)";

  return (
    <div className="bg-surface rounded-xl border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-chalk border-b border-[var(--border)]">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-dust">
          Week grade
        </p>
      </div>

      <div className="px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Grade letter */}
        <div
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shrink-0 self-start sm:self-auto"
          style={{ background: bg }}
        >
          <span
            className="text-[32px] sm:text-[36px] font-extrabold leading-none"
            style={{ color }}
          >
            {grade ?? "—"}
          </span>
        </div>

        {/* Message + bar */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] sm:text-[14px] font-semibold text-ink leading-snug">
            {message}
          </p>
          <ThresholdBar weekScore={weekScore} />
        </div>
      </div>
    </div>
  );
}
