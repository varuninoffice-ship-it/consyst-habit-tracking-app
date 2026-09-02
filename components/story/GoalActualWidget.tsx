import type { GoalActualRow } from "@/lib/business/story";

interface Props {
  rows: GoalActualRow[];
}

export default function GoalActualWidget({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-[var(--border)] p-5">
        <p className="font-mono-brand text-[9px] uppercase tracking-[0.2em] text-dust mb-4">
          Goal vs Actual
        </p>
        <p className="text-[13px] text-dust text-center py-4">No habits tracked this month.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-[var(--border)] p-4 md:p-5">
      <p className="font-mono-brand text-[9px] uppercase tracking-[0.2em] text-dust mb-4 leading-none">
        Goal vs Actual
      </p>

      <div className="flex flex-col gap-3">
        {rows.map((row) => {
          const pct = Math.round(row.ratio * 100);
          const over = row.actual > row.goal;

          return (
            <div key={row.habitId}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-medium text-ink truncate max-w-[60%]">
                  {row.icon} {row.name}
                </span>
                <span className="font-mono-brand text-[11px] text-stone shrink-0 ml-2">
                  {row.actual}
                  <span className="text-dust"> / {row.goal}</span>
                </span>
              </div>

              {/* Track */}
              <div className="relative h-[6px] rounded-full bg-chalk overflow-hidden">
                {/* Actual bar */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(row.ratio, 1) * 100}%`,
                    background: over
                      ? "var(--teal)"
                      : pct >= 80
                      ? "var(--teal)"
                      : pct >= 50
                      ? "var(--amber)"
                      : "var(--coral)",
                  }}
                />
                {/* Goal marker at 100% */}
                <div
                  className="absolute inset-y-0 w-[2px] bg-border-md rounded-full"
                  style={{ left: "calc(100% - 2px)" }}
                />
              </div>

              {/* % label */}
              <p className="text-[10px] text-dust mt-0.5 text-right font-mono-brand">
                {pct}%
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
