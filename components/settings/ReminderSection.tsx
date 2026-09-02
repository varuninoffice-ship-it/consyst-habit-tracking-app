"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "consyst_reminders";

interface ReminderState {
  dailyEnabled: boolean;
  dailyTime: string;     // "HH:MM" 24h
  weeklyEnabled: boolean;
  weeklyDay: string;     // "0"–"6" (Sun–Sat)
  weeklyTime: string;    // "HH:MM" 24h
}

const DEFAULT: ReminderState = {
  dailyEnabled:  false,
  dailyTime:     "20:00",
  weeklyEnabled: false,
  weeklyDay:     "0",    // Sunday
  weeklyTime:    "18:00",
};

const DAY_OPTIONS = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative w-10 h-5 rounded-full transition-colors shrink-0"
      style={{ background: checked ? "var(--teal)" : "var(--border-md)" }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
      />
    </button>
  );
}

export default function ReminderSection() {
  const [state, setState] = useState<ReminderState>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...DEFAULT, ...JSON.parse(raw) });
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  function update(patch: Partial<ReminderState>) {
    setState((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  const selectCls =
    "text-[13px] text-ink bg-chalk rounded-lg px-2.5 py-1.5 outline-none " +
    "focus:ring-2 focus:ring-[var(--teal)] focus:ring-opacity-30 transition-shadow cursor-pointer";

  if (!hydrated) return null;

  return (
    <section className="bg-surface rounded-xl border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-5 py-3 bg-chalk border-b border-[var(--border)]">
        <p className="font-mono-brand text-[9px] uppercase tracking-[0.2em] text-dust leading-none">
          Reminders
        </p>
        <p className="text-[11px] text-stone mt-0.5 leading-none">
          Stored locally — browser notifications require permission
        </p>
      </div>

      <div className="p-4 md:p-5 flex flex-col gap-5">
        {/* Daily reminder */}
        <div className="flex items-start gap-4">
          <Toggle
            checked={state.dailyEnabled}
            onChange={(v) => update({ dailyEnabled: v })}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-ink leading-tight">
              Daily check-in reminder
            </p>
            <p className="text-[12px] text-stone mt-0.5 mb-3">
              Nudge yourself to log your habits each day.
            </p>
            {state.dailyEnabled && (
              <div className="flex items-center gap-2">
                <label className="font-mono-brand text-[9px] uppercase tracking-[0.15em] text-dust">
                  Time
                </label>
                <input
                  type="time"
                  value={state.dailyTime}
                  onChange={(e) => update({ dailyTime: e.target.value })}
                  className={selectCls}
                />
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[var(--border)]" />

        {/* Weekly reminder */}
        <div className="flex items-start gap-4">
          <Toggle
            checked={state.weeklyEnabled}
            onChange={(v) => update({ weeklyEnabled: v })}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-ink leading-tight">
              Weekly review reminder
            </p>
            <p className="text-[12px] text-stone mt-0.5 mb-3">
              Block time to review your Pulse and Reflect.
            </p>
            {state.weeklyEnabled && (
              <div className="flex flex-wrap items-center gap-2">
                <label className="font-mono-brand text-[9px] uppercase tracking-[0.15em] text-dust">
                  Day
                </label>
                <select
                  value={state.weeklyDay}
                  onChange={(e) => update({ weeklyDay: e.target.value })}
                  className={selectCls}
                >
                  {DAY_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <label className="font-mono-brand text-[9px] uppercase tracking-[0.15em] text-dust">
                  Time
                </label>
                <input
                  type="time"
                  value={state.weeklyTime}
                  onChange={(e) => update({ weeklyTime: e.target.value })}
                  className={selectCls}
                />
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-[11px] text-dust leading-relaxed border-t border-[var(--border)] pt-4">
          Reminder preferences are saved in your browser. Actual push notifications
          require browser permission and a service worker — coming in a future update.
        </p>
      </div>
    </section>
  );
}
