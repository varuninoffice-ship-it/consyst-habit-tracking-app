/**
 * C7 DB layer — milestone writing orchestration.
 *
 * Each exported function is called from a server action at the appropriate hook
 * point. Functions fetch only the data they need, evaluate using the pure
 * functions in lib/business/milestones.ts, and insert idempotently.
 *
 * PgBouncer note: no $transaction — all writes are individual statements.
 */

import { prisma } from "@/lib/prisma";
import { addDays, formatDateKey, getWeekMonday } from "@/lib/date";
import { buildGoalsMap, calcWeekScore } from "@/lib/business/now";
import { calcStreak } from "@/lib/business/habits";
import {
  type MilestoneInput,
  detectStreakMilestone,
  detectFirstPerfectDay,
  detectFirstAWeek,
  detectPersonalBest,
  buildHabitAddedMilestone,
  buildHabitArchivedMilestone,
} from "@/lib/business/milestones";

// ─── Internal write helper ────────────────────────────────────────────────────

async function writeMilestone(userId: string, m: MilestoneInput): Promise<void> {
  await prisma.milestone.create({
    data: {
      userId,
      habitId:       m.habitId,
      type:          m.type,
      title:         m.title,
      body:          m.body,
      milestoneDate: m.milestoneDate,
      isManual:      false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata:      (m.metadata ?? undefined) as any,
    },
  });
}

// ─── Trigger 1 + 2: Post check-in milestones ─────────────────────────────────

/**
 * Called after every habitLog upsert (toggleHabitLog action).
 * Evaluates: streak milestone (T1) + first perfect day (T2).
 * Only runs when `completed = true` — no milestones for unchecks.
 */
export async function runPostCheckInMilestones(
  userId:  string,
  habitId: string,
  today:   Date,
): Promise<void> {
  // Fetch habit info + 91-day logs needed for streak, plus today's logs for T2
  const [habit, recentLogs, activeHabits, todayLogs] = await Promise.all([
    prisma.habit.findUnique({
      where: { id: habitId },
      select: { id: true, name: true, icon: true },
    }),
    prisma.habitLog.findMany({
      where: {
        userId,
        logDate: { gte: addDays(today, -91) },
        completed: true,
      },
      select: { habitId: true, logDate: true, completed: true },
    }),
    prisma.habit.findMany({
      where: { userId, archivedAt: null },
      select: { id: true },
    }),
    prisma.habitLog.findMany({
      where: { userId, logDate: today, completed: true },
      select: { habitId: true },
    }),
  ]);

  if (!habit) return;

  // ── Trigger 1: Streak milestone ──────────────────────────────────────────
  const streak = calcStreak(habitId, recentLogs, today);
  const streakMilestone = detectStreakMilestone(
    habitId, habit.name, habit.icon, streak, today,
  );

  if (streakMilestone) {
    // Idempotency: skip if a milestone already exists for this exact streak length
    const existing = await prisma.milestone.findFirst({
      where: {
        userId,
        habitId,
        type: "streak_record",
        metadata: { path: ["streak_length"], equals: streak },
      },
    });
    if (!existing) {
      await writeMilestone(userId, streakMilestone);
    }
  }

  // ── Trigger 2: First perfect day ─────────────────────────────────────────
  const completedToday = todayLogs.length;
  const totalHabits    = activeHabits.length;
  const perfectDay     = detectFirstPerfectDay(completedToday, totalHabits, today);

  if (perfectDay) {
    const existing = await prisma.milestone.findFirst({
      where: { userId, type: "first_perfect_day" },
    });
    if (!existing) {
      await writeMilestone(userId, perfectDay);
    }
  }
}

// ─── Trigger 3 + 4: Week-close milestones ────────────────────────────────────

/**
 * Called lazily on page load — checks the most recently completed week.
 * Safe to call on every load because all three creates are idempotent or
 * "always allowed" (personal_best fires every time a new record is set).
 *
 * `today` must be in the user's timezone-resolved date.
 */
export async function runWeekCloseMilestones(
  userId: string,
  today:  Date,
): Promise<void> {
  // We evaluate the week that ended most recently.
  // If today is Monday, "last week" ended yesterday (Sunday).
  // If today is any other day, "last week" ended last Sunday.
  const todayDow      = today.getUTCDay();            // 0 = Sun
  const daysToLastSun = todayDow === 0 ? 7 : todayDow; // days since last Sunday
  const lastSunday    = addDays(today, -daysToLastSun);
  const lastMonday    = addDays(lastSunday, -6);

  // Don't evaluate the current (incomplete) week
  if (lastSunday >= today) return;

  const [habits, weekLogs, weekGoals, allPastScores] = await Promise.all([
    prisma.habit.findMany({
      where: { userId, archivedAt: null },
      select: { id: true, name: true, icon: true, defaultWeeklyGoal: true, sortOrder: true },
    }),
    prisma.habitLog.findMany({
      where: { userId, logDate: { gte: lastMonday, lte: lastSunday } },
      select: { habitId: true, logDate: true, completed: true },
    }),
    prisma.weeklyGoal.findMany({
      where: { userId, weekStartDate: { lte: lastMonday } },
      select: { habitId: true, weekStartDate: true, targetDays: true },
    }),
    // For personal best: fetch all weekly scores we need to compare against
    prisma.habitLog.findMany({
      where: {
        userId,
        logDate: { lt: lastMonday },
      },
      select: { habitId: true, logDate: true, completed: true },
    }),
  ]);

  if (habits.length === 0) return;

  const goalsMap = buildGoalsMap(habits, weekGoals, lastMonday);
  const weekScore = calcWeekScore(habits, weekLogs, goalsMap);
  if (weekScore === null) return;

  // ── Trigger 3: First A-grade week ────────────────────────────────────────
  const aWeekMilestone = detectFirstAWeek(weekScore, lastMonday);
  if (aWeekMilestone) {
    const existing = await prisma.milestone.findFirst({
      where: { userId, type: "first_a_week" },
    });
    if (!existing) {
      await writeMilestone(userId, aWeekMilestone);
    }
  }

  // ── Trigger 4: Personal best ──────────────────────────────────────────────
  // Calculate week scores for all prior completed weeks to find the previous best.
  // We walk back week by week over the past 52 weeks.
  let previousBest = 0;
  for (let w = 1; w <= 52; w++) {
    const wMonday  = addDays(lastMonday, -(w * 7));
    const wSunday  = addDays(wMonday, 6);
    const wLogs    = allPastScores.filter(
      (l) => l.logDate >= wMonday && l.logDate <= wSunday,
    );
    const wGoals   = buildGoalsMap(habits, weekGoals, wMonday);
    const wScore   = calcWeekScore(habits, wLogs, wGoals);
    if (wScore !== null && wScore > previousBest) previousBest = wScore;
  }

  const pbMilestone = detectPersonalBest(weekScore, previousBest, lastMonday);
  if (pbMilestone) {
    await writeMilestone(userId, pbMilestone);
  }
}

// ─── Trigger 5: Habit added ───────────────────────────────────────────────────

export async function runHabitAddedMilestone(
  userId:    string,
  habitId:   string,
  habitName: string,
  habitIcon: string,
  today:     Date,
): Promise<void> {
  const m = buildHabitAddedMilestone(habitId, habitName, habitIcon, today);
  await writeMilestone(userId, m);
}

// ─── Trigger 6: Habit archived ────────────────────────────────────────────────

export async function runHabitArchivedMilestone(
  userId:    string,
  habitId:   string,
  habitName: string,
  habitIcon: string,
  createdAt: Date,
  today:     Date,
): Promise<void> {
  const m = buildHabitArchivedMilestone(habitId, habitName, habitIcon, createdAt, today);
  await writeMilestone(userId, m);
}
