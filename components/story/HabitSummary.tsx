import type { HabitSummaryRow, Badge } from "@/lib/business/story";

const BADGE_STYLE: Record<Badge, { label: string; bg: string; color: string }> = {
  best:   { label: "Best",   bg: "var(--teal-lt)",   color: "var(--teal)"   },
  strong: { label: "Strong", bg: "var(--amber-lt)",  color: "var(--amber)"  },
  good:   { label: "Good",   bg: "var(--blue-lt)",   color: "var(--blue)"   },
  watch:  { label: "Watch",  bg: "var(--coral-lt)",  color: "var(--coral)"  },
};

interface Props {
  rows: HabitSummaryRow[];
}

export default function HabitSummary({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-[var(--border)] p-5">
        <p className="font-mono-brand text-[9px] uppercase tracking-[0.2em] text-dust mb-3">
          Monthly Habit Summary
        </p>
        <p className="text-[13px] text-dust text-center py-4">
          No habits tracked this month.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-[var(--border)] p-4 md:p-5">
      <p className="font-mono-brand text-[9px] uppercase tracking-[0.2em] text-dust mb-4 leading-none">
        Monthly Habit Summary
      </p>

      <div className="flex flex-col divide-y divide-[var(--border)]">
        {rows.map((row, idx) => {
          const badge = BADGE_STYLE[row.badge];

          return (
            <div
              key={row.habitId}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              {/* Rank */}
              <span className="font-mono-brand text-[11px] text-dust w-5 shrink-0 text-right">
                {idx + 1}
              </span>

              {/* Icon */}
              <span className="text-[18px] leading-none shrink-0">{row.icon}</span>

              {/* Name + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[13px] font-semibold text-ink truncate">
                    {row.name}
                  </span>
                  <span className="font-mono-brand text-[11px] text-stone shrink-0">
                    {row.completed}
                    <span className="text-dust">/{row.target}</span>
                  </span>
                </div>

                <div className="h-[4px] bg-chalk rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${row.consistency}%`,
                      background: badge.color,
                    }}
                  />
                </div>
              </div>

              {/* Badge */}
              <div className="shrink-0 flex items-center gap-2">
                <span className="font-mono-brand text-[10px] text-dust">
                  {row.consistency}%
                </span>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: badge.bg, color: badge.color }}
                >
                  {badge.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Badge legend */}
      <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-wrap gap-x-4 gap-y-1">
        {(Object.entries(BADGE_STYLE) as [Badge, typeof BADGE_STYLE[Badge]][]).map(
          ([key, { label, bg, color }]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: bg, color }}
              >
                {label}
              </span>
              <span className="text-[9px] text-dust font-mono-brand">
                {key === "best"   ? "≥85%"  :
                 key === "strong" ? "70–84%" :
                 key === "good"   ? "50–69%" : "<50%"}
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
