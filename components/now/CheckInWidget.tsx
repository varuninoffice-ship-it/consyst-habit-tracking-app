"use client";

import { useState, useTransition } from "react";
import { toggleHabitLog } from "@/app/now/actions";

interface Habit { id: string; name: string; icon: string; }
interface Log   { habitId: string; completed: boolean; }

interface CheckInWidgetProps {
  habits:   Habit[];
  logs:     Log[];
  todayKey: string;
}

export default function CheckInWidget({ habits, logs, todayKey }: CheckInWidgetProps) {
  const initialState = Object.fromEntries(
    habits.map((h) => {
      const log = logs.find((l) => l.habitId === h.id);
      return [h.id, log?.completed ?? false];
    })
  );

  const [checked, setChecked] = useState<Record<string, boolean>>(initialState);
  const [, startTransition]   = useTransition();

  function toggle(habitId: string) {
    const next = !checked[habitId];
    setChecked((prev) => ({ ...prev, [habitId]: next }));
    startTransition(() => toggleHabitLog(habitId, todayKey, next));
  }

  const completedCount = Object.values(checked).filter(Boolean).length;
  const total          = habits.length;

  return (
    <div className="bg-white rounded-xl border border-[#E8E7E2] flex flex-col overflow-hidden min-h-[180px]">
      {/* Header */}
      <div className="px-4 py-2.5 bg-[#F2F1EC] border-b border-[#E8E7E2] flex items-center justify-between shrink-0">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-ink">
          Today&apos;s Check-in
        </p>
        <p className="font-mono text-[11px] text-stone">
          {completedCount}/{total}
        </p>
      </div>

      {/* Habit list */}
      <div className="overflow-y-auto">
        {habits.length === 0 ? (
          <p className="text-[12px] text-dust text-center px-4 py-6 leading-relaxed">
            No active habits yet.<br />Add one in Habits to start.
          </p>
        ) : (
          <div className="flex flex-col px-4 pt-3 pb-3 gap-2">
            {habits.map((habit) => {
              const done = checked[habit.id];
              return (
                <button
                  key={habit.id}
                  onClick={() => toggle(habit.id)}
                  className="w-full flex items-center gap-2.5 hover:bg-[#FAFAF8] transition-colors text-left rounded-lg px-2"
                  style={{ minHeight: 36 }}
                >
                  {/* Checkbox — 16×16px, 4px radius */}
                  <span
                    className="shrink-0 flex items-center justify-center transition-all"
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      background: done ? "#1D9E75" : "transparent",
                      border: done ? "none" : "1.5px solid #E8E7E2",
                    }}
                  >
                    {done && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.2 5.5L8 1" stroke="white" strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  <span
                    className="text-[13px] font-semibold transition-colors"
                    style={{ color: done ? "#1D9E75" : "#6B6A66" }}
                  >
                    {habit.icon} {habit.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
