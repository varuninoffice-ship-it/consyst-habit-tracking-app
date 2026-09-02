import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayDate, getWeekMonday, addDays } from "@/lib/date";
import {
  calcStreak,
  calcWeeklyCompletion,
  getActiveGoal,
  calcStatus,
  calcTotalWeeklyTarget,
} from "@/lib/business/habits";

import HabitsClient from "@/components/habits/HabitsClient";

export default async function HabitsPage() {
  const user = await getAppUser();
  if (!user) return null;

  const today        = getTodayDate(user.timezone);
  const weekMonday   = getWeekMonday(today);
  const weekSunday   = addDays(weekMonday, 6);
  const ninetyDaysAgo = addDays(today, -90);

  const [activeHabits, archivedCount, weekLogs, recentLogs, weekGoals] = await Promise.all([
    prisma.habit.findMany({
      where: { userId: user.id, archivedAt: null },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.habit.count({ where: { userId: user.id, archivedAt: { not: null } } }),
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

  const totalWeeklyTarget = calcTotalWeeklyTarget(activeHabits, weekGoals, weekMonday);

  const habitRows = activeHabits.map((h) => {
    const weekGoal     = getActiveGoal(h, weekGoals, weekMonday);
    const streak       = calcStreak(h.id, recentLogs, today);
    const weekCompleted = calcWeeklyCompletion(h.id, weekLogs, weekMonday);
    const status       = calcStatus(weekCompleted, weekGoal, today);
    return {
      id: h.id, name: h.name, icon: h.icon,
      category: String(h.category),
      defaultWeeklyGoal: h.defaultWeeklyGoal,
      description: h.description ?? "",
      streak, weekCompleted, weekGoal, status, sortOrder: h.sortOrder,
    };
  });

  return (
    <HabitsClient
      habits={habitRows}
      activeCount={activeHabits.length}
      totalWeeklyTarget={totalWeeklyTarget}
      archivedCount={archivedCount}
    />
  );
}
