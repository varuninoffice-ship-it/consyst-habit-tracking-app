import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatDateKey } from "@/lib/date";

export async function GET(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prismaUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: {
      id: true, name: true, email: true,
      timezone: true, systemStartedAt: true,
    },
  });
  if (!prismaUser) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // ── Data fetch ────────────────────────────────────────────────────────────
  const [habits, logs, reflections] = await Promise.all([
    prisma.habit.findMany({
      where: { userId: prismaUser.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true, name: true, icon: true, category: true,
        defaultWeeklyGoal: true, archivedAt: true, createdAt: true,
      },
    }),
    prisma.habitLog.findMany({
      where: { userId: prismaUser.id },
      orderBy: { logDate: "asc" },
      select: { habitId: true, logDate: true, completed: true },
    }),
    prisma.reflection.findMany({
      where: { userId: prismaUser.id },
      orderBy: { reflectionMonth: "asc" },
      select: {
        reflectionMonth: true, wins: true, gaps: true,
        journal: true, intentions: true,
      },
    }),
  ]);

  // Build habitId → name map for log enrichment without a join
  const habitMap = new Map(habits.map((h) => [h.id, h.name]));
  const today = formatDateKey(new Date());

  // ── Format: CSV ───────────────────────────────────────────────────────────
  const format = request.nextUrl.searchParams.get("format") ?? "csv";

  if (format === "csv") {
    const rows = [
      "Date,Habit,Completed",
      ...logs.map((l) => {
        const name = (habitMap.get(l.habitId) ?? "Unknown").replace(/"/g, '""');
        return `${formatDateKey(l.logDate)},"${name}",${l.completed}`;
      }),
    ];
    return new Response(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="consyst-logs-${today}.csv"`,
      },
    });
  }

  // ── Format: TXT ───────────────────────────────────────────────────────────
  if (format === "txt") {
    const lines = [
      "CONSYST DATA EXPORT",
      `Exported: ${new Date().toLocaleDateString("en-US", { timeZone: "UTC" })}`,
      "",
      "=== Account ===",
      `Name:          ${prismaUser.name}`,
      `Email:         ${prismaUser.email}`,
      `Timezone:      ${prismaUser.timezone}`,
      `Member since:  ${formatDateKey(prismaUser.systemStartedAt)}`,
      "",
      "=== Habits ===",
      ...(habits.length > 0
        ? habits.map(
            (h) =>
              `  ${h.icon}  ${h.name}  |  ${h.category}  |  goal: ${h.defaultWeeklyGoal}/week` +
              (h.archivedAt ? `  |  archived ${formatDateKey(h.archivedAt)}` : ""),
          )
        : ["  (none)"]),
      "",
      "=== Check-in Log ===",
      ...(logs.length > 0
        ? logs.map(
            (l) =>
              `  ${formatDateKey(l.logDate)}  |  ${habitMap.get(l.habitId) ?? "Unknown"}  |  ${l.completed ? "✓" : "✗"}`,
          )
        : ["  (none)"]),
      "",
      "=== Reflections ===",
      ...(reflections.length > 0
        ? reflections.flatMap((r) => [
            `  Month: ${formatDateKey(r.reflectionMonth)}`,
            r.journal ? `  Journal: ${r.journal.slice(0, 120)}${r.journal.length > 120 ? "…" : ""}` : "",
            "",
          ]).filter(Boolean)
        : ["  (none)"]),
    ];
    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="consyst-export-${today}.txt"`,
      },
    });
  }

  // ── Format: JSON ──────────────────────────────────────────────────────────
  if (format === "json") {
    const data = {
      exportedAt: new Date().toISOString(),
      user: {
        name:           prismaUser.name,
        email:          prismaUser.email,
        timezone:       prismaUser.timezone,
        systemStartedAt: formatDateKey(prismaUser.systemStartedAt),
      },
      habits: habits.map((h) => ({
        id:                h.id,
        name:              h.name,
        icon:              h.icon,
        category:          h.category,
        defaultWeeklyGoal: h.defaultWeeklyGoal,
        createdAt:         h.createdAt.toISOString(),
        archivedAt:        h.archivedAt ? h.archivedAt.toISOString() : null,
      })),
      habitLogs: logs.map((l) => ({
        date:      formatDateKey(l.logDate),
        habitId:   l.habitId,
        habitName: habitMap.get(l.habitId) ?? "Unknown",
        completed: l.completed,
      })),
      reflections: reflections.map((r) => ({
        month:      formatDateKey(r.reflectionMonth),
        wins:       r.wins,
        gaps:       r.gaps,
        journal:    r.journal,
        intentions: r.intentions,
      })),
    };
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="consyst-data-${today}.json"`,
      },
    });
  }

  return NextResponse.json({ error: "Unknown format" }, { status: 400 });
}
