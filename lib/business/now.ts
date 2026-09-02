/**
 * Business logic for the Now dashboard.
 * All functions are pure — they take plain data, return plain data.
 * Data is fetched by the page Server Component and passed in.
 */

import { addDays, formatDateKey } from "@/lib/date";

// ─── Lightweight types (avoid importing generated Prisma client here) ──────────

export interface HabitLite {
  id: string;
  name: string;
  icon: string;
  defaultWeeklyGoal: number;
  sortOrder: number;
}

export interface HabitLogLite {
  habitId: string;
  logDate: Date;
  completed: boolean;
}

export interface WeeklyGoalLite {
  habitId: string;
  weekStartDate: Date;
  targetDays: number;
}

// ─── Goals map ────────────────────────────────────────────────────────────────

/**
 * Builds a habitId → targetDays map for the given week.
 * Uses the most recent WeeklyGoal row with weekStartDate ≤ weekMonday,
 * falling back to habit.defaultWeeklyGoal.
 */
export function buildGoalsMap(
  habits: HabitLite[],
  weekGoals: WeeklyGoalLite[],
  weekMonday: Date
): Map<string, number> {
  const mondayKey = formatDateKey(weekMonday);
  const map = new Map<string, number>();

  for (const habit of habits) {
    const goal = weekGoals
      .filter(
        (g) =>
          g.habitId === habit.id &&
          formatDateKey(g.weekStartDate) <= mondayKey
      )
      .sort((a, b) =>
        formatDateKey(b.weekStartDate).localeCompare(
          formatDateKey(a.weekStartDate)
        )
      )[0];

    map.set(habit.id, goal?.targetDays ?? habit.defaultWeeklyGoal);
  }

  return map;
}

// ─── C1: Week Score ───────────────────────────────────────────────────────────

/** Returns 0-100 integer, or null when there are no habits. */
export function calcWeekScore(
  habits: HabitLite[],
  weekLogs: HabitLogLite[],
  goalsMap: Map<string, number>
): number | null {
  if (habits.length === 0) return null;

  let totalTarget = 0;
  let totalCompleted = 0;

  for (const h of habits) {
    totalTarget += goalsMap.get(h.id) ?? h.defaultWeeklyGoal;
    totalCompleted += weekLogs.filter(
      (l) => l.habitId === h.id && l.completed
    ).length;
  }

  if (totalTarget === 0) return null;
  return Math.round((totalCompleted / totalTarget) * 100);
}

// ─── C2: Today's Progress ─────────────────────────────────────────────────────

export interface TodayProgress {
  completed: number;
  total: number;
}

export function calcTodayProgress(
  habits: HabitLite[],
  todayLogs: HabitLogLite[]
): TodayProgress {
  const total = habits.length;
  const completed = todayLogs.filter((l) => l.completed).length;
  return { completed, total };
}

// ─── C3: Longest Streak ───────────────────────────────────────────────────────

function streakForHabit(
  habitId: string,
  recentCompletedKeys: Set<string>,
  today: Date
): number {
  const todayKey = formatDateKey(today);
  const startFromToday = recentCompletedKeys.has(todayKey + "|" + habitId);

  let streak = 0;
  let check = startFromToday ? today : addDays(today, -1);

  for (let i = 0; i < 91; i++) {
    if (recentCompletedKeys.has(formatDateKey(check) + "|" + habitId)) {
      streak++;
      check = addDays(check, -1);
    } else {
      break;
    }
  }

  return streak;
}

/** Returns the highest active streak across all habits. */
export function calcLongestStreak(
  habits: HabitLite[],
  recentCompletedLogs: HabitLogLite[],
  today: Date
): number {
  if (habits.length === 0) return 0;

  // Build a set of "dateKey|habitId" for O(1) lookup
  const keys = new Set(
    recentCompletedLogs
      .filter((l) => l.completed)
      .map((l) => `${formatDateKey(l.logDate)}|${l.habitId}`)
  );

  return Math.max(...habits.map((h) => streakForHabit(h.id, keys, today)), 0);
}

/** Next streak milestone above current streak. */
export function nextMilestone(streak: number): number {
  const milestones = [7, 14, 21, 30, 60, 90, 180, 365];
  return milestones.find((m) => m > streak) ?? 365;
}

// ─── Top Performer ────────────────────────────────────────────────────────────

export interface TopPerformer {
  habit: HabitLite;
  completed: number;
  goal: number;
  ratio: number; // completed / goal
}

/** Returns the habit with the highest completion ratio (only if ≥ 1.0). */
export function findTopPerformer(
  habits: HabitLite[],
  weekLogs: HabitLogLite[],
  goalsMap: Map<string, number>
): TopPerformer | null {
  let best: TopPerformer | null = null;

  for (const h of habits) {
    const goal = goalsMap.get(h.id) ?? h.defaultWeeklyGoal;
    const completed = weekLogs.filter(
      (l) => l.habitId === h.id && l.completed
    ).length;
    const ratio = goal > 0 ? completed / goal : 0;

    if (ratio >= 1.0 && (!best || ratio > best.ratio)) {
      best = { habit: h, completed, goal, ratio };
    }
  }

  return best;
}

// ─── Needs Push ───────────────────────────────────────────────────────────────

export interface NeedsPush {
  habit: HabitLite;
  completed: number;
  goal: number;
  daysLeft: number; // full days remaining until Sunday (exclusive of today)
}

/** Returns the most behind habit if it qualifies (ratio < 0.5 and 2+ days left). */
export function findNeedsPush(
  habits: HabitLite[],
  weekLogs: HabitLogLite[],
  goalsMap: Map<string, number>,
  today: Date
): NeedsPush | null {
  const dayOfWeek = today.getUTCDay(); // 0=Sun
  // Days from today's end until Sunday inclusive of remaining days
  const daysLeft = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

  if (daysLeft < 2) return null;

  let worst: (NeedsPush & { ratio: number }) | null = null;

  for (const h of habits) {
    const goal = goalsMap.get(h.id) ?? h.defaultWeeklyGoal;
    const completed = weekLogs.filter(
      (l) => l.habitId === h.id && l.completed
    ).length;
    const ratio = goal > 0 ? completed / goal : 1;

    if (ratio < 0.5 && (!worst || ratio < worst.ratio)) {
      worst = { habit: h, completed, goal, daysLeft, ratio };
    }
  }

  return worst;
}

// ─── Week at a Glance ─────────────────────────────────────────────────────────

export interface DayCell {
  key: string; // "YYYY-MM-DD"
  label: string; // "Mo", "Tu", etc.
  isToday: boolean;
  isFuture: boolean;
  completedCount: number;
  totalHabits: number;
  status: "strong" | "partial" | "low" | "future";
}

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function calcWeekCells(
  habits: HabitLite[],
  weekLogs: HabitLogLite[],
  weekMonday: Date,
  today: Date
): DayCell[] {
  const todayKey = formatDateKey(today);

  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekMonday, i);
    const key = formatDateKey(date);
    const isFuture = key > todayKey;
    const isToday = key === todayKey;

    const dayLogs = weekLogs.filter((l) => formatDateKey(l.logDate) === key);
    const completedCount = dayLogs.filter((l) => l.completed).length;
    const totalHabits = habits.length;

    let status: DayCell["status"];
    if (isFuture) {
      status = "future";
    } else if (totalHabits === 0) {
      status = "low";
    } else {
      const r = completedCount / totalHabits;
      status = r >= 0.8 ? "strong" : r >= 0.4 ? "partial" : "low";
    }

    return { key, label: DAY_LABELS[i], isToday, isFuture, completedCount, totalHabits, status };
  });
}

// ─── Consyst Observation ──────────────────────────────────────────────────────

/** Returns the highest-priority observation text, or null if none qualify. */
export function getObservation(
  habits: HabitLite[],
  weekLogs: HabitLogLite[],
  goalsMap: Map<string, number>,
  recentCompletedLogs: HabitLogLite[],
  today: Date,
  lastWeekScore: number | null = null,
): string | null {
  if (habits.length === 0) return null;

  const keys = new Set(
    recentCompletedLogs
      .filter((l) => l.completed)
      .map((l) => `${formatDateKey(l.logDate)}|${l.habitId}`)
  );

  // Priority 1: streak approaching a milestone
  for (const h of habits) {
    const streak = streakForHabit(h.id, keys, today);
    if (streak < 3) continue;
    const next = nextMilestone(streak);
    const gap = next - streak;
    if (gap <= 2) {
      const unit = gap === 1 ? "day" : "days";
      return `${h.icon} ${h.name} is ${streak} days in — ${gap} more ${unit} to a ${next}-day milestone.`;
    }
  }

  // Priority 2a: habit behind pace
  const push = findNeedsPush(habits, weekLogs, goalsMap, today);
  if (push && push.daysLeft >= 3) {
    const remaining = push.goal - push.completed;
    const unit = remaining === 1 ? "check-in" : "check-ins";
    return `${push.habit.icon} ${push.habit.name} needs ${remaining} more ${unit} to hit its goal — ${push.daysLeft} days left.`;
  }

  // Priority 2b (C8 Pattern 5): Day-of-week slip pattern (requires 4+ weeks of data)
  // Counts unique weeks in recentCompletedLogs to gate the check
  const allDates = recentCompletedLogs.map((l) => formatDateKey(l.logDate));
  const weekKeys = new Set(allDates.map((k) => k.slice(0, 7))); // "YYYY-MM"
  if (weekKeys.size >= 4) {
    const todayDow = today.getUTCDay(); // 0 = Sun
    // Collect the last 4 occurrences of today's weekday (including today)
    const pastDates: Date[] = [];
    for (let i = 0; i < 4; i++) {
      pastDates.push(addDays(today, -(i * 7)));
    }

    let worstHabit: HabitLite | null = null;
    let worstSlipRate = 0;

    for (const h of habits) {
      const slips = pastDates.filter(
        (d) => !keys.has(`${formatDateKey(d)}|${h.id}`)
      ).length;
      const slipRate = slips / pastDates.length;
      if (slipRate >= 0.75 && slipRate > worstSlipRate) {
        worstSlipRate = slipRate;
        worstHabit = h;
      }
    }

    if (worstHabit) {
      const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      const dayName = DAY_NAMES[todayDow];
      return `${worstHabit.icon} ${worstHabit.name} tends to slip on ${dayName}s. Good day to break that.`;
    }
  }

  // Priority 3: top performer
  const top = findTopPerformer(habits, weekLogs, goalsMap);
  if (top) {
    if (top.ratio >= 1.5) {
      return `${top.habit.icon} ${top.habit.name} has already exceeded its weekly goal. Strong week.`;
    }
    return `${top.habit.icon} ${top.habit.name} has hit its weekly goal. That's the system working.`;
  }

  // Priority 3 (C8 Pattern 4): Week score improvement vs last week (≥8 point jump)
  if (lastWeekScore !== null) {
    const thisWeekScore = calcWeekScore(habits, weekLogs, goalsMap);
    if (
      thisWeekScore !== null &&
      thisWeekScore > lastWeekScore &&
      thisWeekScore - lastWeekScore >= 8
    ) {
      const delta = thisWeekScore - lastWeekScore;
      return `Up ${delta} points on last week. The system is working.`;
    }
  }

  return null;
}

// ─── C9: Days running ─────────────────────────────────────────────────────────

/**
 * Returns the number of days since the user started Consyst (day 1 = start day).
 */
export function calcDaysRunning(systemStartedAt: Date, today: Date): number {
  return Math.max(
    1,
    Math.floor((today.getTime() - systemStartedAt.getTime()) / 86_400_000) + 1,
  );
}
