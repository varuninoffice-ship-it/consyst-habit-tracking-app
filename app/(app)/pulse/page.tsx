import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getTodayDate,
  getWeekMonday,
  addDays,
  formatDateKey,
  getISOWeek,
  formatDisplayDate,
} from "@/lib/date";
import {
  buildGoalsMap,
  calcWeekScore,
  calcLongestStreak,
} from "@/lib/business/now";
import { calcStreak } from "@/lib/business/habits";
import {
  calcGrade,
  calcGradeMessage,
  calcOnTrackCount,
  calcDaysLeft,
  buildGridData,
} from "@/lib/business/pulse";

import GradeCard from "@/components/pulse/GradeCard";
import PulseGrid from "@/components/pulse/PulseGrid";

function ScoreCard({
  label, value, sublabel, progress,
}: {
  label: string; value: string; sublabel: string; progress: number;
}) {
  return (
    <div className="bg-surface rounded-xl border border-[var(--border)] px-4 pt-4 pb-3 flex flex-col gap-1.5 relative overflow-hidden">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-dust leading-none">{label}</p>
      <p className="text-[26px] md:text-[28px] font-extrabold tracking-tight leading-none" style={{ color: "var(--amber)" }}>
        {value}
      </p>
      <p className="text-[11px] text-stone leading-none">{sublabel}</p>
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-chalk">
        <div className="h-full transition-all duration-700" style={{ width: `${Math.min(Math.max(progress, 0), 1) * 100}%`, background: "var(--amber)" }} />
      </div>
    </div>
  );
}

export default async function PulsePage() {
  const user = await getAppUser();
  if (!user) return null;

  const today      = getTodayDate(user.timezone);
  const weekMonday = getWeekMonday(today);
  const weekSunday = addDays(weekMonday, 6);
  const ninetyDaysAgo = addDays(today, -90);
  const isSunday   = today.getUTCDay() === 0;
  const weekNum    = getISOWeek(today);
  const dateStr    = formatDisplayDate(today);

  const [habits, weekLogs, recentLogs, weekGoals] = await Promise.all([
    prisma.habit.findMany({
      where: { userId: user.id, archivedAt: null },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.habitLog.findMany({
      where: { userId: user.id, logDate: { gte: weekMonday, lte: weekSunday } },
    }),
    prisma.habitLog.findMany({
      where: { userId: user.id, logDate: { gte: ninetyDaysAgo } },
      orderBy: { logDate: "desc" },
    }),
    prisma.weeklyGoal.findMany({
      where: { userId: user.id, weekStartDate: { lte: weekMonday } },
      orderBy: { weekStartDate: "desc" },
    }),
  ]);

  const goalsMap       = buildGoalsMap(habits, weekGoals, weekMonday);
  const weekScore      = calcWeekScore(habits, weekLogs, goalsMap);
  const grade          = calcGrade(weekScore);
  const daysLeft       = calcDaysLeft(today);
  const weekTarget     = habits.reduce((s, h) => s + (goalsMap.get(h.id) ?? h.defaultWeeklyGoal), 0);
  const gradeMessage   = calcGradeMessage(grade, weekScore ?? 0, weekTarget, isSunday);
  const onTrackCount   = calcOnTrackCount(habits, weekLogs, goalsMap, today);
  const totalCompleted = weekLogs.filter((l) => l.completed).length;
  const longestStreak  = calcLongestStreak(habits, recentLogs, today);

  const streaksMap = new Map<string, number>(
    habits.map((h) => [h.id, calcStreak(h.id, recentLogs, today)]),
  );
  const gridRows = buildGridData(habits, weekLogs, goalsMap, weekMonday, today, streaksMap);

  return (
    <>
      <header className="h-14 border-b border-[var(--border)] bg-surface flex items-center justify-between px-4 md:px-5 shrink-0">
        <div>
          <p className="font-mono text-[9px] text-dust uppercase tracking-[0.18em] leading-none">{dateStr}</p>
          <p className="text-[15px] md:text-[17px] font-extrabold text-ink tracking-tight leading-tight mt-0.5">Pulse</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <span className="hidden sm:inline font-mono text-[9px] text-stone uppercase tracking-widest">
            Week {weekNum}
          </span>
          {longestStreak > 0 && (
            <span className="font-mono text-[9px] text-white px-2.5 py-1 rounded-full" style={{ background: "var(--amber)" }}>
              {longestStreak}d streak
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-5 pb-5 flex flex-col gap-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 shrink-0">
          <ScoreCard label="Week score"     value={weekScore !== null ? `${weekScore}%` : "—"} sublabel="this week"                                          progress={(weekScore ?? 0) / 100} />
          <ScoreCard label="Completed"      value={String(totalCompleted)}                       sublabel={totalCompleted === 1 ? "check-in" : "check-ins"}  progress={weekTarget > 0 ? totalCompleted / weekTarget : 0} />
          <ScoreCard label="On-track habits" value={habits.length > 0 ? String(onTrackCount) : "—"} sublabel={`of ${habits.length} habit${habits.length !== 1 ? "s" : ""}`} progress={habits.length > 0 ? onTrackCount / habits.length : 0} />
          <ScoreCard label="Days left"      value={String(daysLeft)}                             sublabel={daysLeft === 1 ? "day remaining" : "days remaining"} progress={1 - daysLeft / 7} />
        </div>
        <GradeCard grade={grade} weekScore={weekScore} message={gradeMessage} />
        <PulseGrid rows={gridRows} />
      </main>
    </>
  );
}
