import React from "react";
import type { HeatmapRow } from "@/lib/business/story";

// status → background colour
const CELL_BG: Record<string, string> = {
  strong:  "var(--teal)",
  partial: "var(--amber)",
  low:     "var(--chalk)",
  future:  "transparent",
};
const CELL_BORDER: Record<string, string> = {
  strong:  "var(--teal)",
  partial: "var(--amber)",
  low:     "var(--border)",
  future:  "var(--border)",
};

interface Props {
  weeks: { weekKey: string; weekLabel: string }[];
  rows: HeatmapRow[];
}

export default function Heatmap({ weeks, rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-[var(--border)] p-5">
        <p className="font-mono-brand text-[9px] uppercase tracking-[0.2em] text-dust mb-3">
          Intensity Heatmap
        </p>
        <p className="text-[13px] text-dust text-center py-4">No habits tracked this month.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-[var(--border)] p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono-brand text-[9px] uppercase tracking-[0.2em] text-dust leading-none">
          Intensity Heatmap
        </p>
        {/* Legend */}
        <div className="flex items-center gap-2.5">
          {(["strong", "partial", "low"] as const).map((s) => (
            <div key={s} className="flex items-center gap-1">
              <div
                className="w-2.5 h-2.5 rounded-sm border"
                style={{
                  background: CELL_BG[s],
                  borderColor: CELL_BORDER[s],
                }}
              />
              <span className="text-[9px] font-mono-brand text-dust capitalize">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: sticky habit column + week columns */}
      <div className="overflow-x-auto -mx-1">
        <div
          className="grid gap-x-2 gap-y-2 min-w-fit px-1"
          style={{
            gridTemplateColumns: `minmax(110px,1fr) ${weeks.map(() => "36px").join(" ")}`,
          }}
        >
          {/* Header row */}
          <div /> {/* empty corner */}
          {weeks.map((w) => (
            <div
              key={w.weekKey}
              className="text-center font-mono-brand text-[9px] text-dust uppercase tracking-[0.1em]"
            >
              {w.weekLabel}
            </div>
          ))}

          {/* Habit rows */}
          {rows.map((row) => (
            <React.Fragment key={row.habitId}>
              <div className="flex items-center gap-1.5 py-0.5">
                <span className="text-[14px] leading-none">{row.icon}</span>
                <span className="text-[12px] font-medium text-ink truncate leading-tight">
                  {row.name}
                </span>
              </div>

              {row.cells.map((cell) => (
                <div
                  key={`${row.habitId}-${cell.weekKey}`}
                  className="h-7 rounded-md border flex items-center justify-center"
                  style={{
                    background:   CELL_BG[cell.status],
                    borderColor:  CELL_BORDER[cell.status],
                    borderStyle:  cell.status === "future" ? "dashed" : "solid",
                    borderWidth:  "1px",
                  }}
                  title={
                    cell.status === "future"
                      ? "Future"
                      : `${cell.completed}/${cell.goal} days`
                  }
                >
                  {cell.status !== "future" && (
                    <span
                      className="font-mono-brand text-[9px] font-bold leading-none"
                      style={{
                        color:
                          cell.status === "strong" ? "#fff" :
                          cell.status === "partial" ? "#fff" :
                          "var(--border-md)",
                      }}
                    >
                      {cell.completed}
                    </span>
                  )}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Month totals bar */}
      <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-col gap-2">
        {rows.map((row) => {
          const pct = row.monthGoal > 0
            ? Math.min(Math.round((row.monthCompleted / row.monthGoal) * 100), 100)
            : 0;
          return (
            <div key={`tot-${row.habitId}`} className="flex items-center gap-2">
              <span className="text-[11px] text-stone w-[110px] truncate shrink-0">
                {row.icon} {row.name}
              </span>
              <div className="flex-1 h-[4px] bg-chalk rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 85 ? "var(--teal)" : pct >= 50 ? "var(--amber)" : "var(--coral)",
                  }}
                />
              </div>
              <span className="font-mono-brand text-[10px] text-dust w-8 text-right shrink-0">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
