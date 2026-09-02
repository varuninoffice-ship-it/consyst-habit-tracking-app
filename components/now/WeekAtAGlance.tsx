import type { DayCell } from "@/lib/business/now";

function weekGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  return "F";
}

export default function WeekAtAGlance({
  cells,
  weekScore,
}: {
  cells:     DayCell[];
  weekScore: number | null;
}) {
  // Max habits across all days — used to size the column height consistently
  const maxHabits = Math.max(...cells.map((c) => c.totalHabits), 1);

  return (
    <div className="bg-white rounded-xl border border-[#E8E7E2] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 bg-[#F2F1EC] border-b border-[#E8E7E2] flex items-center shrink-0">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-ink">
          This Week
        </p>
      </div>

      <div className="flex flex-col px-4 pt-4 pb-4 gap-3">
        {/* Day columns — full width */}
        <div className="flex items-end justify-between">
          {cells.map((cell) => {
            const squares = Array.from({ length: maxHabits }, (_, idx) => {
              const filled = idx < cell.completedCount;
              return { filled };
            }).reverse(); // reverse so filled squares appear at top

            return (
              <div key={cell.key} className="flex flex-col items-center gap-1.5">
                {/* Stack of squares */}
                <div className="flex flex-col gap-[3px]">
                  {squares.map((sq, idx) => {
                    let bg: string;
                    let border: string | undefined;

                    if (cell.isFuture) {
                      bg = "#F2F1EC";
                      border = "1px dashed #D4D3CE";
                    } else if (sq.filled) {
                      bg = cell.isToday ? "#EF9F27" : "#1D9E75";
                      border = undefined;
                    } else {
                      bg = "#F2F1EC";
                      border = undefined;
                    }

                    return (
                      <div
                        key={idx}
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 3,
                          background: bg,
                          border,
                        }}
                      />
                    );
                  })}
                </div>

                {/* Day label */}
                <p
                  className="font-mono text-[8px] uppercase leading-none"
                  style={{
                    color: cell.isToday ? "#EF9F27" : "#B4B3AE",
                    fontWeight: cell.isToday ? 700 : 400,
                  }}
                >
                  {cell.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Week score label row */}
        {weekScore !== null && (
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] text-stone">
              Week score: {weekScore}%
            </p>
            <p className="font-mono text-[10px] font-bold text-ink">
              {weekGrade(weekScore)}
            </p>
          </div>
        )}

        {/* 4px teal progress bar */}
        <div className="h-[4px] rounded-full overflow-hidden -mt-1" style={{ background: "#E1F5EE" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${weekScore ?? 0}%`, background: "#1D9E75" }}
          />
        </div>
      </div>
    </div>
  );
}
