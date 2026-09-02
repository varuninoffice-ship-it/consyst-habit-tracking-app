import { nextMilestone } from "@/lib/business/now";
import type { TodayProgress } from "@/lib/business/now";

interface ScoreCardsProps {
  weekScore:     number | null;
  todayProgress: TodayProgress;
  longestStreak: number;
  activeHabits:  number;
}

interface CardProps {
  label:      string;
  value:      string;
  sublabel:   string;
  progress:   number; // 0–1
  color:      string;
  trackColor: string;
}

function ScoreCard({ label, value, sublabel, progress, color, trackColor }: CardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E7E2] flex flex-col overflow-hidden relative">
      <div className="px-4 pt-4 pb-4 flex flex-col gap-[3px]">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-dust leading-none">
          {label}
        </p>
        <p className="text-[32px] font-extrabold tracking-tight leading-none" style={{ color }}>
          {value}
        </p>
        <p className="text-[12px] text-stone leading-none">
          {sublabel}
        </p>
      </div>
      {/* 3px progress bar flush to bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: trackColor }}>
        <div
          className="h-full transition-all duration-700"
          style={{
            width: `${Math.min(Math.max(progress, 0), 1) * 100}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

export default function ScoreCards({
  weekScore,
  todayProgress,
  longestStreak,
  activeHabits,
}: ScoreCardsProps) {
  const { completed, total } = todayProgress;

  const streakProgress = longestStreak > 0
    ? longestStreak / nextMilestone(longestStreak)
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
      <ScoreCard
        label="Week score"
        value={weekScore !== null ? `${weekScore}%` : "—"}
        sublabel="this week"
        progress={weekScore !== null ? weekScore / 100 : 0}
        color="#EF9F27"
        trackColor="#FEF3DC"
      />
      <ScoreCard
        label="Today"
        value={total > 0 ? `${completed}/${total}` : "—"}
        sublabel="check-ins done"
        progress={total > 0 ? completed / total : 0}
        color="#F0997B"
        trackColor="#FEE9E0"
      />
      <ScoreCard
        label="Best streak"
        value={longestStreak > 0 ? `${longestStreak}` : "—"}
        sublabel={longestStreak === 1 ? "day" : "days"}
        progress={streakProgress}
        color="#1D9E75"
        trackColor="#E1F5EE"
      />
      <ScoreCard
        label="Active habits"
        value={activeHabits > 0 ? `${activeHabits}` : "—"}
        sublabel={activeHabits === 1 ? "habit" : "habits"}
        progress={Math.min(activeHabits / 7, 1)}
        color="#378ADD"
        trackColor="#E5F0FB"
      />
    </div>
  );
}
