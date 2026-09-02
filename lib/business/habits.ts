/**
 * Business logic for the Habits screen.
 * Pure functions — no I/O.
 */

import { addDays, formatDateKey, getWeekMonday } from "@/lib/date";

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

export interface HabitLite {
  id: string;
  defaultWeeklyGoal: number;
}

// ─── Streak ───────────────────────────────────────────────────────────────────

export function calcStreak(
  habitId: string,
  logs: HabitLogLite[],
  today: Date
): number {
  const completedKeys = new Set(
    logs
      .filter((l) => l.habitId === habitId && l.completed)
      .map((l) => formatDateKey(l.logDate))
  );

  const todayKey = formatDateKey(today);
  const startFromToday = completedKeys.has(todayKey);
  let check = startFromToday ? today : addDays(today, -1);
  let streak = 0;

  for (let i = 0; i < 91; i++) {
    if (completedKeys.has(formatDateKey(check))) {
      streak++;
      check = addDays(check, -1);
    } else {
      break;
    }
  }
  return streak;
}

// ─── This-week completion ─────────────────────────────────────────────────────

export function calcWeeklyCompletion(
  habitId: string,
  logs: HabitLogLite[],
  weekMonday: Date
): number {
  const weekKeys = Array.from({ length: 7 }, (_, i) =>
    formatDateKey(addDays(weekMonday, i))
  );
  return logs.filter(
    (l) => l.habitId === habitId && l.completed && weekKeys.includes(formatDateKey(l.logDate))
  ).length;
}

// ─── Active goal for the week ─────────────────────────────────────────────────

export function getActiveGoal(
  habit: HabitLite,
  weekGoals: WeeklyGoalLite[],
  weekMonday: Date
): number {
  const mondayKey = formatDateKey(weekMonday);
  const match = weekGoals
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
  return match?.targetDays ?? habit.defaultWeeklyGoal;
}

// ─── Status ───────────────────────────────────────────────────────────────────

export type HabitStatus = "on-track" | "at-risk" | "behind" | "no-data";

export function calcStatus(
  completed: number,
  goal: number,
  today: Date
): HabitStatus {
  if (goal === 0) return "no-data";
  const dayOfWeek = today.getUTCDay(); // 0 = Sun
  const daysPassed = dayOfWeek === 0 ? 7 : dayOfWeek; // Mon=1…Sun=7
  const expectedPace = (goal / 7) * daysPassed;

  const ratio = completed / goal;
  if (ratio >= 1) return "on-track";
  if (completed >= expectedPace * 0.8) return "on-track";
  if (completed >= expectedPace * 0.5) return "at-risk";
  return "behind";
}

// ─── Total weekly target across all active habits ────────────────────────────

export function calcTotalWeeklyTarget(
  habits: HabitLite[],
  weekGoals: WeeklyGoalLite[],
  weekMonday: Date
): number {
  return habits.reduce(
    (sum, h) => sum + getActiveGoal(h, weekGoals, weekMonday),
    0
  );
}
