import Link from "next/link";
import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getTodayDate,
  getWeekMonday,
  addDays,
  formatDateKey,
} from "@/lib/date";
import {
  buildGoalsMap,
  calcWeekScore,
  calcTodayProgress,
  calcLongestStreak,
  findTopPerformer,
  findNeedsPush,
  calcWeekCells,
  getObservation,
} from "@/lib/business/now";

import TopBar from "@/components/layout/TopBar";
import ScoreCards from "@/components/now/ScoreCards";
import CheckInWidget from "@/components/now/CheckInWidget";
import TopPerformerWidget from "@/components/now/TopPerformerWidget";
import NeedsPushWidget from "@/components/now/NeedsPushWidget";
import WeekAtAGlance from "@/components/now/WeekAtAGlance";
import ConsystNotice from "@/components/now/ConsystNotice";

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Ghost score cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-5 shrink-0">
        {["Week score", "Today", "Best streak", "Active habits"].map((label) => (
          <div
            key={label}
            className="rounded-xl border-2 border-dashed border-[var(--border)] px-4 pt-4 pb-3"
            style={{ opacity: 0.32 }}
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-dust">
              {label}
            </p>
            <div className="mt-2 h-7 w-12 rounded bg-chalk" />
          </div>
        ))}
      </div>

      {/* Center callout */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-xs px-4">
          <div className="flex items-end justify-center gap-[4px] mb-6" aria-hidden>
            {[
              { h: 16, color: "#F0997B", delay: "bar-rise-1" },
              { h: 22, color: "#EF9F27", delay: "bar-rise-2" },
              { h: 30, color: "#1D9E75", delay: "bar-rise-3" },
              { h: 24, color: "#378ADD", delay: "bar-rise-4" },
            ].map((b, i) => (
              <div
                key={i}
                className={`w-[8px] rounded-full bar-rise ${b.delay}`}
                style={{ height: b.h, background: b.color }}
              />
            ))}
          </div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-dust mb-3">
            Day 1 · Nothing tracked yet
          </p>
          <h2 className="text-[20px] md:text-[22px] font-extrabold text-ink tracking-tight mb-2">
            Your dashboard fills up as you show up.
          </h2>
          <p className="font-serif text-[14px] text-stone leading-relaxed italic mb-6">
            Score cards and insights appear once your habits are running. Add a habit to begin.
          </p>
          <Link
            href="/habits"
            className="inline-flex items-center px-5 py-2.5 rounded-lg bg-teal text-white text-[13px] font-semibold hover:bg-[#178a64] transition-colors"
          >
            Add your first habit →
          </Link>
        </div>
      </div>

      <div className="mt-4 shrink-0">
        <ConsystNotice observation={null} isNewUser />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function NowPage() {
  const user = await getAppUser();
  if (!user) return null; // layout already redirects; satisfies TypeScript

  const today         = getTodayDate(user.timezone);
  const weekMonday    = getWeekMonday(today);
  const weekSunday    = addDays(weekMonday, 6);
  const lastMonday    = addDays(weekMonday, -7);
  const lastSunday    = addDays(weekMonday, -1);
  const ninetyDaysAgo = addDays(today, -90);

  const [habits, todayLogs, weekLogs, lastWeekLogs, recentLogs, weekGoals] = await Promise.all([
    prisma.habit.findMany({
      where: { userId: user.id, archivedAt: null },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.habitLog.findMany({ where: { userId: user.id, logDate: today } }),
    prisma.habitLog.findMany({
      where: { userId: user.id, logDate: { gte: weekMonday, lte: weekSunday } },
    }),
    // Last week's logs for Pattern 4 (week score improvement)
    prisma.habitLog.findMany({
      where: { userId: user.id, logDate: { gte: lastMonday, lte: lastSunday } },
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

  const isNewUser     = habits.length === 0;
  const goalsMap      = buildGoalsMap(habits, weekGoals, weekMonday);
  const lastGoalsMap  = buildGoalsMap(habits, weekGoals, lastMonday);
  const weekScore     = calcWeekScore(habits, weekLogs, goalsMap);
  const lastWeekScore = calcWeekScore(habits, lastWeekLogs, lastGoalsMap);
  const todayProgress = calcTodayProgress(habits, todayLogs);
  const longestStreak = calcLongestStreak(habits, recentLogs, today);
  const topPerformer  = findTopPerformer(habits, weekLogs, goalsMap);
  const needsPush     = findNeedsPush(habits, weekLogs, goalsMap, today);
  const weekCells     = calcWeekCells(habits, weekLogs, weekMonday, today);
  const observation   = getObservation(habits, weekLogs, goalsMap, recentLogs, today, lastWeekScore);

  const habitsForClient = habits.map((h) => ({ id: h.id, name: h.name, icon: h.icon }));
  const logsForClient   = todayLogs.map((l) => ({ habitId: l.habitId, completed: l.completed }));
  const todayKey        = formatDateKey(today);

  return (
    <>
      <TopBar today={today} isNewUser={isNewUser} longestStreak={longestStreak} />

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-5 pb-5 flex flex-col gap-4 md:gap-4">
        {isNewUser ? (
          <EmptyState />
        ) : (
          <>
            <ScoreCards
              weekScore={weekScore}
              todayProgress={todayProgress}
              longestStreak={longestStreak}
              activeHabits={habits.length}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              <CheckInWidget habits={habitsForClient} logs={logsForClient} todayKey={todayKey} />
              <TopPerformerWidget performer={topPerformer} />
              <NeedsPushWidget needsPush={needsPush} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WeekAtAGlance cells={weekCells} weekScore={weekScore} />
              <ConsystNotice observation={observation} />
            </div>
          </>
        )}
      </main>
    </>
  );
}
