// Timezone-aware date helpers for Consyst.
// All dates passed to Prisma are midnight UTC on the target calendar date,
// which Postgres stores correctly in DATE columns.

export function getTodayDate(timezone: string): Date {
  // Returns midnight UTC for "today" in the given timezone.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // "YYYY-MM-DD"

  const [y, m, d] = parts.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

export function addDays(date: Date, days: number): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + days,
      0,
      0,
      0
    )
  );
}

/** Returns the Monday of the ISO week containing `today`. */
export function getWeekMonday(today: Date): Date {
  const day = today.getUTCDay(); // 0 = Sun, 1 = Mon, …
  const daysBack = (day + 6) % 7; // Sun→6, Mon→0, Tue→1, …
  return addDays(today, -daysBack);
}

/** "2026-04-01" — safe UTC-based key for any date at any time. */
export function formatDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** ISO week number (1-53). */
export function getISOWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const dayNum = d.getUTCDay() || 7; // Sun → 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // nearest Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(
    (((d.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7
  );
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "Wed, Apr 1" */
export function formatDisplayDate(date: Date): string {
  return `${DAY_NAMES[date.getUTCDay()]}, ${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}`;
}
