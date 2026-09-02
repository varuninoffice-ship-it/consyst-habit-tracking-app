"use client";

import { useState, useTransition } from "react";
import { toggleHabitLog } from "@/app/pulse/actions";
import type { PulseGridRow } from "@/lib/business/pulse";

// ─── Cell ─────────────────────────────────────────────────────────────────────

function Cell({
  completed,
  isToday,
  isFuture,
  onClick,
}: {
  completed: boolean;
  isToday: boolean;
  isFuture: boolean;
  onClick: () => void;
}) {
  const base =
    "w-9 h-9 rounded-lg flex items-center justify-center transition-all shrink-0";

  if (isFuture) {
    return (
      <div
        className={`${base} cursor-default`}
        style={{ background: "var(--chalk)", border: "1.5px dashed var(--border)" }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${!completed ? "hover:bg-chalk" : ""}`}
      style={
        completed
          ? { background: "var(--teal)", border: "none" }
          : {
              background: isToday ? "var(--amber-lt)" : "transparent",
              border: `1.5px solid ${isToday ? "var(--amber)" : "var(--border-md)"}`,
            }
      }
    >
      {completed && (
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path
            d="M1 5L4.5 8.5L11 1"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ completed, goal }: { completed: number; goal: number }) {
  const pct = goal > 0 ? Math.min(completed / goal, 1) : 0;
  return (
    <div className="w-16 h-[3px] rounded-full bg-chalk overflow-hidden shrink-0">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct * 100}%`, background: "var(--amber)" }}
      />
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      {/* Ghost grid preview */}
      <div className="mb-8 opacity-30 w-full max-w-md overflow-hidden">
        <div className="flex gap-2 mb-2 pl-32">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div
              key={d}
              className="w-9 h-5 rounded bg-chalk font-mono text-[8px] flex items-center justify-center text-dust"
            >
              {d}
            </div>
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-chalk shrink-0" />
            <div className="w-24 h-4 rounded bg-chalk shrink-0" />
            <div className="flex gap-2 ml-auto">
              {Array.from({ length: 7 }, (_, j) => (
                <div
                  key={j}
                  className="w-9 h-9 rounded-lg border border-dashed border-[var(--border)] bg-chalk"
                  style={{ opacity: j === 2 ? 0.6 : 0.3 }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-[18px] sm:text-[20px] font-extrabold text-ink tracking-tight mb-2">
        Your weekly rhythm starts today.
      </h2>
      <p className="text-[13px] text-stone leading-relaxed mb-6 max-w-sm">
        Pulse shows each week habit by habit, day by day. The grid fills in as
        you check off in Now.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <a
          href="/now"
          className="inline-flex items-center px-5 py-2.5 rounded-lg text-white text-[13px] font-semibold transition-colors hover:opacity-90"
          style={{ background: "var(--amber)" }}
        >
          Go check in today →
        </a>
        <a
          href="/habits"
          className="text-[13px] text-stone hover:text-ink transition-colors"
        >
          or add your habits first
        </a>
      </div>

      {/* Consyst note */}
      <div className="mt-8 bg-surface border border-[var(--border)] rounded-xl px-5 py-4 max-w-sm text-left">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-end gap-[2px]" aria-hidden>
            {[
              { h: 6, c: "#F0997B" }, { h: 8, c: "#EF9F27" },
              { h: 10, c: "#1D9E75" }, { h: 8, c: "#378ADD" },
            ].map((b, i) => (
              <div key={i} className="w-[3px] rounded-full" style={{ height: b.h, background: b.c }} />
            ))}
          </div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-dust">Consyst</p>
        </div>
        <p className="font-serif text-[13px] text-stone leading-relaxed italic">
          "Pulse is most useful mid-week — when there's still time to
          course-correct. Come back Wednesday or Thursday."
        </p>
      </div>
    </div>
  );
}

// ─── Main grid component ──────────────────────────────────────────────────────

interface PulseGridProps {
  rows: PulseGridRow[];
}

export default function PulseGrid({ rows }: PulseGridProps) {
  // Optimistic checked state keyed by "habitId|dateKey"
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const row of rows) {
      for (const cell of row.cells) {
        init[`${row.habitId}|${cell.dateKey}`] = cell.completed;
      }
    }
    return init;
  });

  const [, startTransition] = useTransition();

  function toggle(habitId: string, dateKey: string) {
    const key = `${habitId}|${dateKey}`;
    const next = !checked[key];
    setChecked((prev) => ({ ...prev, [key]: next }));
    startTransition(() => toggleHabitLog(habitId, dateKey, next));
  }

  if (rows.length === 0) return <EmptyState />;

  // Derive day labels from first row
  const dayLabels = rows[0].cells.map((c) => ({
    label: c.dayLabel,
    isToday: c.isToday,
  }));

  return (
    /*
     * Outer wrapper: overflow-x-auto so the grid scrolls horizontally on mobile.
     * The habit-name column is sticky left-0 so it stays visible while scrolling.
     */
    <div className="bg-surface rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: 580 }}>
          {/* Column headers */}
          <thead>
            <tr className="bg-chalk border-b border-[var(--border)]">
              {/* Sticky habit name header */}
              <th
                className="sticky left-0 z-10 bg-chalk px-4 py-2.5 text-left w-[160px] sm:w-[200px] shrink-0"
                style={{ minWidth: 140 }}
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-dust">
                  Habit
                </p>
              </th>

              {/* Day columns */}
              {dayLabels.map(({ label, isToday }) => (
                <th
                  key={label + isToday}
                  className="px-1.5 py-2.5 w-12 text-center"
                >
                  <p
                    className="font-mono text-[9px] uppercase tracking-widest"
                    style={{
                      color: isToday ? "var(--amber)" : "var(--dust)",
                      fontWeight: isToday ? 700 : 400,
                    }}
                  >
                    {label}
                  </p>
                </th>
              ))}

              {/* Progress header */}
              <th className="px-3 py-2.5 w-20 text-right">
                <p className="font-mono text-[9px] uppercase tracking-widest text-dust">
                  Goal
                </p>
              </th>

              {/* Streak header */}
              <th className="px-3 py-2.5 w-16 text-right">
                <p className="font-mono text-[9px] uppercase tracking-widest text-dust">
                  Streak
                </p>
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, rowIdx) => {
              const rowCompleted = row.cells.filter(
                (c) => checked[`${row.habitId}|${c.dateKey}`]
              ).length;

              return (
                <tr
                  key={row.habitId}
                  className="border-b border-[var(--border)] last:border-b-0 hover:bg-bg transition-colors"
                >
                  {/* Sticky habit name */}
                  <td
                    className="sticky left-0 z-10 bg-surface px-4 py-3 group-hover:bg-bg"
                    style={{ minWidth: 140 }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[18px] shrink-0">{row.habitIcon}</span>
                      <span className="text-[13px] font-semibold text-ink truncate">
                        {row.habitName}
                      </span>
                    </div>
                  </td>

                  {/* Day cells */}
                  {row.cells.map((cell) => {
                    const key = `${row.habitId}|${cell.dateKey}`;
                    const isComplete = checked[key] ?? false;
                    return (
                      <td key={cell.dateKey} className="px-1.5 py-3 text-center">
                        <div className="flex justify-center">
                          <Cell
                            completed={isComplete}
                            isToday={cell.isToday}
                            isFuture={cell.isFuture}
                            onClick={() =>
                              !cell.isFuture && toggle(row.habitId, cell.dateKey)
                            }
                          />
                        </div>
                      </td>
                    );
                  })}

                  {/* Progress bar + fraction */}
                  <td className="px-3 py-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <ProgressBar
                        completed={rowCompleted}
                        goal={row.weekGoal}
                      />
                      <p className="font-mono text-[9px] text-stone">
                        {rowCompleted}/{row.weekGoal}
                      </p>
                    </div>
                  </td>

                  {/* Streak */}
                  <td className="px-3 py-3 text-right">
                    <p
                      className="font-mono text-[13px] font-semibold"
                      style={{
                        color:
                          row.streak > 0 ? "var(--amber)" : "var(--dust)",
                      }}
                    >
                      {row.streak > 0 ? `${row.streak}d` : "—"}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer: week total */}
      <div className="px-4 py-2.5 border-t border-[var(--border)] bg-chalk flex items-center justify-between">
        <p className="font-mono text-[9px] uppercase tracking-widest text-dust">
          Week total
        </p>
        <p className="font-mono text-[11px] text-stone">
          {rows.reduce(
            (sum, r) =>
              sum +
              r.cells.filter((c) => checked[`${r.habitId}|${c.dateKey}`]).length,
            0
          )}
          {" / "}
          {rows.reduce((sum, r) => sum + r.weekGoal, 0)} check-ins
        </p>
      </div>
    </div>
  );
}
