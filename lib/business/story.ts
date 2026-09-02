/**
 * Business logic for the Story monthly view.
 * C5: Monthly Consistency — per-habit completion vs prorated monthly target.
 * C6: Month Score     — average of weekly scores within the calendar month.
 */

import {
  buildGoalsMap,
  calcWeekScore,
  type HabitLite,
  type HabitLogLite,
  type WeeklyGoalLite,
} from "@/lib/business/now";
import { addDays, formatDateKey } from "@/lib/date";

// ─── Public types ─────────────────────────────────────────────────────────────

export type Badge = "best" | "strong" | "good" | "watch";

export interface HeatmapCell {
  weekKey: string;
  weekLabel: string;
  completed: number;
  goal: number;
  isFuture: boolean;
  status: "strong" | "partial" | "low" | "future";
}

export interface HeatmapRow {
  habitId: string;
  name: string;
  icon: string;
  cells: HeatmapCell[];
  monthCompleted: number;
  monthGoal: number;
}

export interface HabitSummaryRow {
  habitId: string;
  name: string;
  icon: string;
  completed: number;
  target: number;
  consistency: number; // 0–100
  badge: Badge;
}

export interface GoalActualRow {
  habitId: string;
  name: string;
  icon: string;
  goal: number;
  actual: number;
  ratio: number; // 0–1, capped at 1
}

export interface TrendPoint {
  monthKey: string;   // "YYYY-MM"
  monthLabel: string; // "Apr '26"
  score: number | null;
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface MonthWeek {
  monday: Date;
  weekKey: string;
  weekLabel: string;
}

const MONTH_SHORT = [
  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
];

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** All Monday-anchored weeks whose Monday falls on or before the last day of
 *  the month — i.e. every week that overlaps the calendar month. */
function getMonthWeeks(year: number, month: number): MonthWeek[] {
  const firstDay = new Date(Date.UTC(year, month, 1));
  const lastDay  = new Date(Date.UTC(year, month + 1, 0));

  const dow      = firstDay.getUTCDay(); // 0 = Sun
  const toMonday = dow === 0 ? -6 : 1 - dow;

  const weeks: MonthWeek[] = [];
  let monday = addDays(firstDay, toMonday);
  let n = 1;

  while (monday <= lastDay) {
    weeks.push({ monday, weekKey: formatDateKey(monday), weekLabel: `W${n}` });
    monday = addDays(monday, 7);
    n++;
  }
  return weeks;
}

/** "habitId|YYYY-MM-DD" set of every completed log day — O(1) lookup. */
function buildCompletedSet(logs: HabitLogLite[]): Set<string> {
  const s = new Set<string>();
  for (const l of logs) {
    if (l.completed) s.add(`${l.habitId}|${formatDateKey(l.logDate)}`);
  }
  return s;
}

// ─── Public helpers ───────────────────────────────────────────────────────────

/** Expand a calendar month outward to complete Mon–Sun weeks. */
export function getMonthBounds(year: number, month: number) {
  const firstDay = new Date(Date.UTC(year, month, 1));
  const lastDay  = new Date(Date.UTC(year, month + 1, 0));

  const dow         = firstDay.getUTCDay();
  const firstMonday = addDays(firstDay, dow === 0 ? -6 : 1 - dow);

  const ldow       = lastDay.getUTCDay();
  const lastSunday = addDays(lastDay, ldow === 0 ? 0 : 7 - ldow);

  return { firstDay, lastDay, firstMonday, lastSunday };
}

export function getMonthWeekCount(year: number, month: number): number {
  return getMonthWeeks(year, month).length;
}

/** Badge tier from a 0–100 consistency score. */
export function calcBadge(consistency: number): Badge {
  if (consistency >= 85) return "best";
  if (consistency >= 70) return "strong";
  if (consistency >= 50) return "good";
  return "watch";
}

// ─── C5: Monthly Consistency ──────────────────────────────────────────────────

/**
 * For each habit, counts how many days in the calendar month were completed
 * vs the prorated weekly goal (partial weeks are prorated by daysInMonth/7).
 */
export function calcMonthlyConsistency(
  habits: HabitLite[],
  logs: HabitLogLite[],
  goals: WeeklyGoalLite[],
  year: number,
  month: number,
): HabitSummaryRow[] {
  const weeks    = getMonthWeeks(year, month);
  const firstDay = new Date(Date.UTC(year, month, 1));
  const lastDay  = new Date(Date.UTC(year, month + 1, 0));
  const done     = buildCompletedSet(logs);

  // Accumulate per-habit stats across all weeks in one pass
  const stats = new Map<string, { target: number; completed: number }>(
    habits.map(h => [h.id, { target: 0, completed: 0 }]),
  );

  for (const { monday } of weeks) {
    const goalsMap = buildGoalsMap(habits, goals, monday);

    for (const habit of habits) {
      const weekGoal = goalsMap.get(habit.id) ?? habit.defaultWeeklyGoal;
      let daysInMonth = 0, doneInMonth = 0;

      for (let d = 0; d < 7; d++) {
        const day = addDays(monday, d);
        if (day >= firstDay && day <= lastDay) {
          daysInMonth++;
          if (done.has(`${habit.id}|${formatDateKey(day)}`)) doneInMonth++;
        }
      }

      const s = stats.get(habit.id)!;
      s.target    += Math.round(weekGoal * daysInMonth / 7);
      s.completed += doneInMonth;
    }
  }

  return habits.map(habit => {
    const { target, completed } = stats.get(habit.id)!;
    const consistency =
      target > 0 ? Math.min(Math.round((completed / target) * 100), 100) : 0;

    return {
      habitId: habit.id,
      name: habit.name,
      icon: habit.icon,
      completed,
      target,
      consistency,
      badge: calcBadge(consistency),
    };
  });
}

// ─── C6: Month Score ──────────────────────────────────────────────────────────

/**
 * Average of weekly scores for every week that overlaps the calendar month.
 * Returns null when there are no habits or no completable weeks.
 */
export function calcMonthScore(
  habits: HabitLite[],
  logs: HabitLogLite[],
  goals: WeeklyGoalLite[],
  year: number,
  month: number,
): number | null {
  if (habits.length === 0) return null;

  const weeks  = getMonthWeeks(year, month);
  const scores: number[] = [];

  for (const { monday } of weeks) {
    const sunday   = addDays(monday, 6);
    const weekLogs = logs.filter(l => l.logDate >= monday && l.logDate <= sunday);
    const goalsMap = buildGoalsMap(habits, goals, monday);
    const s = calcWeekScore(habits, weekLogs, goalsMap);
    if (s !== null) scores.push(s);
  }

  if (scores.length === 0) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// ─── Heatmap (habits × weeks) ─────────────────────────────────────────────────

export function buildHeatmapData(
  habits: HabitLite[],
  logs: HabitLogLite[],
  goals: WeeklyGoalLite[],
  year: number,
  month: number,
  today: Date,
): { weeks: { weekKey: string; weekLabel: string }[]; rows: HeatmapRow[] } {
  const rawWeeks = getMonthWeeks(year, month);
  const firstDay = new Date(Date.UTC(year, month, 1));
  const lastDay  = new Date(Date.UTC(year, month + 1, 0));
  const done     = buildCompletedSet(logs);

  // Pre-compute goalsMap once per week
  const weekData = rawWeeks.map(w => ({
    ...w,
    goalsMap: buildGoalsMap(habits, goals, w.monday),
  }));

  const rows: HeatmapRow[] = habits.map(habit => {
    let monthCompleted = 0, monthGoal = 0;

    const cells: HeatmapCell[] = weekData.map(({ monday, weekKey, weekLabel, goalsMap }) => {
      const goal     = goalsMap.get(habit.id) ?? habit.defaultWeeklyGoal;
      const isFuture = monday > today;

      // Full-week completions → drives cell status
      let completed = 0;
      for (let d = 0; d < 7; d++) {
        if (done.has(`${habit.id}|${formatDateKey(addDays(monday, d))}`)) completed++;
      }

      // Month-scoped completions + prorated goal → drives monthly totals
      let daysInMonth = 0, doneInMonth = 0;
      for (let d = 0; d < 7; d++) {
        const day = addDays(monday, d);
        if (day >= firstDay && day <= lastDay) {
          daysInMonth++;
          if (done.has(`${habit.id}|${formatDateKey(day)}`)) doneInMonth++;
        }
      }
      monthCompleted += doneInMonth;
      monthGoal      += Math.round(goal * daysInMonth / 7);

      const ratio = goal > 0 ? completed / goal : 0;
      const status: HeatmapCell["status"] =
        isFuture     ? "future"  :
        goal === 0   ? "low"     :
        ratio >= 1.0 ? "strong"  :
        ratio >= 0.5 ? "partial" : "low";

      return { weekKey, weekLabel, completed, goal, isFuture, status };
    });

    return {
      habitId: habit.id,
      name: habit.name,
      icon: habit.icon,
      cells,
      monthCompleted,
      monthGoal,
    };
  });

  return {
    weeks: weekData.map(({ weekKey, weekLabel }) => ({ weekKey, weekLabel })),
    rows,
  };
}

// ─── Goal vs Actual ───────────────────────────────────────────────────────────

export function buildGoalActual(
  habits: HabitLite[],
  logs: HabitLogLite[],
  goals: WeeklyGoalLite[],
  year: number,
  month: number,
): GoalActualRow[] {
  return calcMonthlyConsistency(habits, logs, goals, year, month).map(r => ({
    habitId: r.habitId,
    name:    r.name,
    icon:    r.icon,
    goal:    r.target,
    actual:  r.completed,
    ratio:   r.target > 0 ? Math.min(r.completed / r.target, 1) : 0,
  }));
}

// ─── Trend (N months ending at year/month) ────────────────────────────────────

export function buildTrendData(
  habits: HabitLite[],
  logs: HabitLogLite[],
  goals: WeeklyGoalLite[],
  year: number,
  month: number,
  monthCount = 6,
): TrendPoint[] {
  return Array.from({ length: monthCount }, (_, i) => {
    const offset = monthCount - 1 - i;
    // JS Date handles negative months correctly
    const d = new Date(Date.UTC(year, month - offset, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();

    return {
      monthKey:   `${y}-${String(m + 1).padStart(2, "0")}`,
      monthLabel: `${MONTH_SHORT[m]} '${String(y).slice(2)}`,
      score:      calcMonthScore(habits, logs, goals, y, m),
    };
  });
}

// ─── Summary (sorted by consistency desc) ─────────────────────────────────────

export function buildHabitSummary(
  habits: HabitLite[],
  logs: HabitLogLite[],
  goals: WeeklyGoalLite[],
  year: number,
  month: number,
): HabitSummaryRow[] {
  return [...calcMonthlyConsistency(habits, logs, goals, year, month)]
    .sort((a, b) => b.consistency - a.consistency);
}

// ─── Aggregates ───────────────────────────────────────────────────────────────

export function calcMonthCheckIns(
  logs: HabitLogLite[],
  year: number,
  month: number,
): number {
  const firstDay = new Date(Date.UTC(year, month, 1));
  const lastDay  = new Date(Date.UTC(year, month + 1, 0));
  return logs.filter(l => l.completed && l.logDate >= firstDay && l.logDate <= lastDay).length;
}

export function calcPerfectWeeks(
  habits: HabitLite[],
  logs: HabitLogLite[],
  goals: WeeklyGoalLite[],
  year: number,
  month: number,
): number {
  const weeks = getMonthWeeks(year, month);
  let count = 0;

  for (const { monday } of weeks) {
    const sunday   = addDays(monday, 6);
    const weekLogs = logs.filter(l => l.logDate >= monday && l.logDate <= sunday);
    const goalsMap = buildGoalsMap(habits, goals, monday);
    const s = calcWeekScore(habits, weekLogs, goalsMap);
    if (s !== null && s >= 85) count++;
  }

  return count;
}
