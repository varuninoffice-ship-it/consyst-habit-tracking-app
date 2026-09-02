import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayDate } from "@/lib/date";
import {
  calcMonthScore,
  calcMonthCheckIns,
  calcPerfectWeeks,
  buildTrendData,
  buildHabitSummary,
  getMonthBounds,
  getMonthWeekCount,
} from "@/lib/business/story";

import StoryScoreCards from "@/components/story/StoryScoreCards";
import MonthPicker from "@/components/story/MonthPicker";
import TrendChart from "@/components/story/TrendChart";
import HabitSummary from "@/components/story/HabitSummary";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

interface Props {
  searchParams: { y?: string; m?: string };
}

export default async function StoryPage({ searchParams }: Props) {
  const user = await getAppUser();
  if (!user) return null;

  const today    = getTodayDate(user.timezone);
  const maxYear  = today.getUTCFullYear();
  const maxMonth = today.getUTCMonth();

  const rawY = parseInt(searchParams.y ?? "", 10);
  const rawM = parseInt(searchParams.m ?? "", 10) - 1;

  const year  = Number.isFinite(rawY) ? Math.min(rawY, maxYear) : maxYear;
  const month = Number.isFinite(rawM) && rawM >= 0 && rawM <= 11
    ? (year === maxYear ? Math.min(rawM, maxMonth) : rawM)
    : maxMonth;

  const { firstMonday, lastSunday } = getMonthBounds(year, month);

  const trendStart = new Date(Date.UTC(year, month - 5, 1));
  const trendFirstMonday = (() => {
    const d = trendStart;
    const dow = d.getUTCDay();
    const back = dow === 0 ? 6 : dow - 1;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - back));
  })();

  const [habits, logs, goals] = await Promise.all([
    prisma.habit.findMany({
      where: { userId: user.id, archivedAt: null },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, icon: true, defaultWeeklyGoal: true, sortOrder: true },
    }),
    prisma.habitLog.findMany({
      where: { userId: user.id, logDate: { gte: trendFirstMonday, lte: lastSunday } },
      select: { habitId: true, logDate: true, completed: true },
    }),
    prisma.weeklyGoal.findMany({
      where: { userId: user.id, weekStartDate: { lte: lastSunday } },
      select: { habitId: true, weekStartDate: true, targetDays: true },
    }),
  ]);

  const monthLogs    = logs.filter((l) => l.logDate >= firstMonday && l.logDate <= lastSunday);
  const monthScore   = calcMonthScore(habits, monthLogs, goals, year, month);
  const checkIns     = calcMonthCheckIns(monthLogs, year, month);
  const totalWeeks   = getMonthWeekCount(year, month);
  const perfectWeeks = calcPerfectWeeks(habits, monthLogs, goals, year, month);
  const summary      = buildHabitSummary(habits, monthLogs, goals, year, month);
  const topConsistency = summary.length > 0 ? summary[0].consistency : null;
  const trend        = buildTrendData(habits, logs, goals, year, month, 6);

  const isCurrentMonth = year === maxYear && month === maxMonth;
  const headerSub = isCurrentMonth ? "This month" : `${MONTH_NAMES[month]} ${year}`;

  return (
    <>
      <header className="h-14 border-b border-[var(--border)] bg-surface flex items-center justify-between px-4 md:px-5 shrink-0">
        <div>
          <p className="font-mono-brand text-[9px] text-dust uppercase tracking-[0.18em] leading-none">
            {headerSub}
          </p>
          <p className="text-[15px] md:text-[17px] font-extrabold text-ink tracking-tight leading-tight mt-0.5">
            Story
          </p>
        </div>
        <MonthPicker year={year} month={month} minYear={maxYear - 2} maxYear={maxYear} maxMonth={maxMonth} />
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-5 pb-6 flex flex-col gap-4">
        <StoryScoreCards monthScore={monthScore} checkIns={checkIns} perfectWeeks={perfectWeeks} totalWeeks={totalWeeks} topConsistency={topConsistency} />
        <HabitSummary rows={summary} />
        <TrendChart points={trend} />
      </main>
    </>
  );
}
