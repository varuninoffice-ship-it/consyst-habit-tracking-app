/**
 * Business logic for the Pulse weekly view.
 * Imports shared types/helpers from now.ts — no duplication.
 */

import {
  buildGoalsMap,
  calcWeekScore,
  type HabitLite,
  type HabitLogLite,
  type WeeklyGoalLite,
} from "@/lib/business/now";
import { addDays, formatDateKey } from "@/lib/date";

export { buildGoalsMap, calcWeekScore };

// ─── Grade ────────────────────────────────────────────────────────────────────

export type Grade = "A" | "B" | "C";

export function calcGrade(weekScore: number | null): Grade | null {
  if (weekScore === null) return null;
  if (weekScore >= 85) return "A";
  if (weekScore >= 70) return "B";
  return "C";
}

// ─── Grade message ────────────────────────────────────────────────────────────

/**
 * Returns a forward-looking message.
 * isSunday: last day of the week — no actionable nudge possible.
 * weekTarget: denominator (total possible completions this week).
 */
export function calcGradeMessage(
  grade: Grade | null,
  weekScore: number,
  weekTarget: number,
  isSunday: boolean
): string {
  if (grade === null) return "Add habits to start tracking your week.";

  if (grade === "A") {
    return "Excellent week. Your system is running well.";
  }

  if (grade === "B") {
    if (isSunday) {
      return "Solid week. Finishing strong is what consistency looks like.";
    }
    const pointsToA = Math.ceil(((85 - weekScore) / 100) * weekTarget);
    const unit = pointsToA === 1 ? "check-in" : "check-ins";
    return `You're doing well — ${pointsToA} more ${unit} needed to reach an A.`;
  }

  // grade === "C"
  if (isSunday) {
    return "A tough week. Note what made it hard — that's useful data.";
  }
  const pointsToB = Math.ceil(((70 - weekScore) / 100) * weekTarget);
  const unit = pointsToB === 1 ? "check-in" : "check-ins";
  return `Behind pace — ${pointsToB} more ${unit} needed to reach a B.`;
}

// ─── On-track habits count ────────────────────────────────────────────────────

/**
 * A habit is on-track if its completion ratio ≥ 80% of the expected
 * pace given how far through the week we are.
 */
export function calcOnTrackCount(
  habits: HabitLite[],
  weekLogs: HabitLogLite[],
  goalsMap: Map<string, number>,
  today: Date
): number {
  const dayOfWeek = today.getUTCDay(); // 0=Sun
  const daysPassed = dayOfWeek === 0 ? 7 : dayOfWeek;

  return habits.filter((h) => {
    const goal = goalsMap.get(h.id) ?? h.defaultWeeklyGoal;
    const completed = weekLogs.filter(
      (l) => l.habitId === h.id && l.completed
    ).length;
    const expectedPace = (goal / 7) * daysPassed;
    return completed >= expectedPace * 0.8;
  }).length;
}

// ─── Days left (including today) ─────────────────────────────────────────────

export function calcDaysLeft(today: Date): number {
  const dow = today.getUTCDay(); // 0=Sun
  return dow === 0 ? 1 : 8 - dow;
}

// ─── Grid data ────────────────────────────────────────────────────────────────

export interface GridCell {
  dateKey: string;       // "YYYY-MM-DD"
  dayLabel: string;      // "Mon" … "Sun"
  isToday: boolean;
  isFuture: boolean;
  completed: boolean;
}

export interface PulseGridRow {
  habitId: string;
  habitName: string;
  habitIcon: string;
  cells: GridCell[];
  weekCompleted: number;
  weekGoal: number;
  streak: number;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function buildGridData(
  habits: HabitLite[],
  weekLogs: HabitLogLite[],
  goalsMap: Map<string, number>,
  weekMonday: Date,
  today: Date,
  streaksMap: Map<string, number>
): PulseGridRow[] {
  const todayKey = formatDateKey(today);

  return habits.map((h) => {
    const weekGoal = goalsMap.get(h.id) ?? h.defaultWeeklyGoal;

    const cells: GridCell[] = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekMonday, i);
      const dateKey = formatDateKey(date);
      const isFuture = dateKey > todayKey;
      const isToday = dateKey === todayKey;
      const log = weekLogs.find(
        (l) => l.habitId === h.id && formatDateKey(l.logDate) === dateKey
      );
      return {
        dateKey,
        dayLabel: DAY_LABELS[i],
        isToday,
        isFuture,
        completed: log?.completed ?? false,
      };
    });

    const weekCompleted = cells.filter((c) => !c.isFuture && c.completed).length;

    return {
      habitId: h.id,
      habitName: h.name,
      habitIcon: h.icon,
      cells,
      weekCompleted,
      weekGoal,
      streak: streaksMap.get(h.id) ?? 0,
    };
  });
}
