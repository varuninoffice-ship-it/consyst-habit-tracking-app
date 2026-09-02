/**
 * C7 — Milestone auto-detection (pure evaluation, no I/O).
 *
 * Each function inspects pre-loaded data and returns a MilestoneInput if the
 * condition is met, or null if it is not. The DB writing layer (lib/db/milestones.ts)
 * calls these functions and handles the idempotency guard.
 */

import { addDays, formatDateKey } from "@/lib/date";
import { calcStreak } from "@/lib/business/habits";
import type { HabitLogLite } from "@/lib/business/now";

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface MilestoneInput {
  type:
    | "streak_record"
    | "first_perfect_day"
    | "first_a_week"
    | "habit_added"
    | "habit_archived"
    | "personal_best"
    | "manual";
  title:         string;
  body:          string | null;
  habitId:       string | null;
  milestoneDate: Date;
  metadata:      Record<string, unknown> | null;
}

// ─── Streak thresholds ────────────────────────────────────────────────────────

export const STREAK_MILESTONES = [7, 14, 21, 30, 60, 90, 180, 365] as const;

// ─── Trigger 1: Streak milestone ──────────────────────────────────────────────

/**
 * Returns a MilestoneInput if `streak` is exactly at one of the defined
 * thresholds. Returns null otherwise.
 * Duplicate guard: caller must verify no existing milestone with the same
 * (habitId, type=streak_record, metadata.streak_length) before inserting.
 */
export function detectStreakMilestone(
  habitId:   string,
  habitName: string,
  habitIcon: string,
  streak:    number,
  today:     Date,
): MilestoneInput | null {
  if (!(STREAK_MILESTONES as readonly number[]).includes(streak)) return null;

  return {
    type:          "streak_record",
    title:         `${streak}-day streak — ${habitIcon} ${habitName}`,
    body:          `${habitName} completed ${streak} consecutive days.`,
    habitId,
    milestoneDate: today,
    metadata:      { streak_length: streak, habit_name: habitName },
  };
}

// ─── Trigger 2: First perfect day ─────────────────────────────────────────────

/**
 * Returns a MilestoneInput if today's completed count equals the total active
 * habit count (and there is at least one habit).
 * Duplicate guard: caller must verify no existing milestone with type=first_perfect_day.
 */
export function detectFirstPerfectDay(
  completedToday: number,
  totalHabits:    number,
  today:          Date,
): MilestoneInput | null {
  if (totalHabits === 0 || completedToday < totalHabits) return null;

  return {
    type:          "first_perfect_day",
    title:         `First perfect day — all ${totalHabits} habit${totalHabits !== 1 ? "s" : ""} completed`,
    body:          "Every active habit checked off in a single day.",
    habitId:       null,
    milestoneDate: today,
    metadata:      { habits_completed: totalHabits },
  };
}

// ─── Trigger 3: First A-grade week ────────────────────────────────────────────

/**
 * Returns a MilestoneInput if weekScore ≥ 85 (an A-grade week).
 * Duplicate guard: caller must verify no existing milestone with type=first_a_week.
 */
export function detectFirstAWeek(
  weekScore:   number,
  weekMonday:  Date,
): MilestoneInput | null {
  if (weekScore < 85) return null;

  const weekSunday = addDays(weekMonday, 6);

  return {
    type:          "first_a_week",
    title:         `First A-grade week — ${weekScore}%`,
    body:          "A week score of 85% or above. The system is working.",
    habitId:       null,
    milestoneDate: weekSunday,
    metadata:      {
      week_score:  weekScore,
      week_start:  formatDateKey(weekMonday),
    },
  };
}

// ─── Trigger 4: Personal best week score ──────────────────────────────────────

/**
 * Returns a MilestoneInput if `weekScore` strictly exceeds `previousBest`.
 * The personal_best milestone fires every time a new best is set — no
 * duplicate guard (unlike the one-off milestones).
 */
export function detectPersonalBest(
  weekScore:    number,
  previousBest: number,
  weekMonday:   Date,
): MilestoneInput | null {
  if (weekScore <= previousBest) return null;

  const weekSunday = addDays(weekMonday, 6);

  return {
    type:          "personal_best",
    title:         `Personal best week — ${weekScore}%`,
    body:          previousBest > 0
      ? `Previous best was ${previousBest}%.`
      : "Your first scored week — baseline set.",
    habitId:       null,
    milestoneDate: weekSunday,
    metadata:      {
      week_score:    weekScore,
      previous_best: previousBest,
      week_start:    formatDateKey(weekMonday),
    },
  };
}

// ─── Trigger 5: Habit added ───────────────────────────────────────────────────

export function buildHabitAddedMilestone(
  habitId:   string,
  habitName: string,
  habitIcon: string,
  today:     Date,
): MilestoneInput {
  return {
    type:          "habit_added",
    title:         `${habitIcon} ${habitName} added to your system`,
    body:          null,
    habitId,
    milestoneDate: today,
    metadata:      { habit_name: habitName },
  };
}

// ─── Trigger 6: Habit archived ────────────────────────────────────────────────

export function buildHabitArchivedMilestone(
  habitId:    string,
  habitName:  string,
  habitIcon:  string,
  createdAt:  Date,
  today:      Date,
): MilestoneInput {
  const daysActive = Math.max(
    1,
    Math.floor((today.getTime() - createdAt.getTime()) / 86_400_000) + 1,
  );

  return {
    type:          "habit_archived",
    title:         `${habitIcon} ${habitName} archived after ${daysActive} day${daysActive !== 1 ? "s" : ""}`,
    body:          null,
    habitId,
    milestoneDate: today,
    metadata:      {
      habit_name:  habitName,
      days_active: daysActive,
    },
  };
}

// ─── C9: Days running ─────────────────────────────────────────────────────────

/**
 * Returns the number of days since the user started Consyst.
 * Day 1 = the day they started, so the result is always ≥ 1.
 */
export function calcDaysRunning(systemStartedAt: Date, today: Date): number {
  return Math.max(
    1,
    Math.floor((today.getTime() - systemStartedAt.getTime()) / 86_400_000) + 1,
  );
}

// ─── Slip pattern (Pattern 5 helper) — used by observation engine ─────────────

/**
 * For a given day-of-week index (0=Sun), returns the dates of the last
 * `weekCount` occurrences of that weekday on or before `today`.
 */
export function pastWeekdayDates(
  dowTarget: number,
  today:     Date,
  weekCount  = 4,
): Date[] {
  const todayDow = today.getUTCDay();
  const daysBack = ((todayDow - dowTarget) + 7) % 7;
  const dates: Date[] = [];
  for (let i = 0; i < weekCount; i++) {
    dates.push(addDays(today, -(daysBack + i * 7)));
  }
  return dates;
}

/**
 * Calculates the slip rate for a given habit on a specific weekday,
 * looking back over the given set of past dates.
 * A day "slipped" if there is no completed log for (habitId, date).
 * Returns a value 0–1 (e.g. 0.75 = slipped 3 of 4 occurrences).
 */
export function calcSlipRate(
  habitId:    string,
  pastDates:  Date[],
  completedLogsSet: Set<string>,  // "YYYY-MM-DD|habitId"
): number {
  if (pastDates.length === 0) return 0;
  const slips = pastDates.filter(
    (d) => !completedLogsSet.has(`${formatDateKey(d)}|${habitId}`)
  ).length;
  return slips / pastDates.length;
}

// ─── Re-export calcStreak for convenience ─────────────────────────────────────
export { calcStreak };
export type { HabitLogLite };
