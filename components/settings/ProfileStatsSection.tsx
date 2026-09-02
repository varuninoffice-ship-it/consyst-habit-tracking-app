interface StatCardProps {
  label: string;
  value: string;
  sublabel: string;
  progress: number; // 0–1
}

function StatCard({ label, value, sublabel, progress }: StatCardProps) {
  return (
    <div className="bg-surface rounded-xl border border-[var(--border)] px-4 pt-4 pb-3 flex flex-col gap-1.5 relative overflow-hidden">
      <p className="font-mono-brand text-[9px] uppercase tracking-[0.2em] text-dust leading-none">
        {label}
      </p>
      <p
        className="text-[26px] md:text-[28px] font-extrabold tracking-tight leading-none"
        style={{ color: "var(--blue)" }}
      >
        {value}
      </p>
      <p className="text-[11px] text-stone leading-none">{sublabel}</p>
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-chalk">
        <div
          className="h-full transition-all duration-700"
          style={{
            width: `${Math.min(Math.max(progress, 0), 1) * 100}%`,
            background: "var(--blue)",
          }}
        />
      </div>
    </div>
  );
}

interface HistoryEvent {
  dateStr: string;
  text: string;
  type: "system" | "habit" | "archived";
}

interface Props {
  daysActive: number;
  totalHabits: number;
  totalCheckIns: number;
  totalReflections: number;
  history: HistoryEvent[];
}

const EVENT_DOT: Record<HistoryEvent["type"], string> = {
  system:   "var(--blue)",
  habit:    "var(--teal)",
  archived: "var(--dust)",
};

export default function ProfileStatsSection({
  daysActive,
  totalHabits,
  totalCheckIns,
  totalReflections,
  history,
}: Props) {
  return (
    <section className="flex flex-col gap-4">
      {/* Stat cards — 2-col on mobile, 4-col on lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Days active"
          value={String(daysActive)}
          sublabel="since system started"
          progress={Math.min(daysActive / 365, 1)}
        />
        <StatCard
          label="Habits created"
          value={String(totalHabits)}
          sublabel={totalHabits === 1 ? "habit" : "habits total"}
          progress={Math.min(totalHabits / 10, 1)}
        />
        <StatCard
          label="Total check-ins"
          value={totalCheckIns >= 1000
            ? `${(totalCheckIns / 1000).toFixed(1)}k`
            : String(totalCheckIns)}
          sublabel="completed log entries"
          progress={Math.min(totalCheckIns / 500, 1)}
        />
        <StatCard
          label="Reflections"
          value={String(totalReflections)}
          sublabel={totalReflections === 1 ? "month reflected" : "months reflected"}
          progress={Math.min(totalReflections / 12, 1)}
        />
      </div>

      {/* History log */}
      {history.length > 0 && (
        <div className="bg-surface rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="px-4 md:px-5 py-3 bg-chalk border-b border-[var(--border)]">
            <p className="font-mono-brand text-[9px] uppercase tracking-[0.2em] text-dust leading-none">
              System History
            </p>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {history.map((event, i) => (
              <li key={i} className="flex items-center gap-3 px-4 md:px-5 py-3">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: EVENT_DOT[event.type] }}
                />
                <span className="flex-1 text-[13px] text-ink">{event.text}</span>
                <span className="font-mono-brand text-[10px] text-dust shrink-0">
                  {event.dateStr}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
