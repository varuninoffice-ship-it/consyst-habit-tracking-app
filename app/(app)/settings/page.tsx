import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayDate } from "@/lib/date";

import AccountSection from "@/components/settings/AccountSection";
import ReminderSection from "@/components/settings/ReminderSection";
import ProfileStatsSection from "@/components/settings/ProfileStatsSection";
import ExportSection from "@/components/settings/ExportSection";
import DangerZone from "@/components/settings/DangerZone";

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDate(date: Date): string {
  return `${MONTH_SHORT[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export default async function SettingsPage() {
  const user = await getAppUser();
  if (!user) return null;

  const today   = getTodayDate(user.timezone);
  const startMs = user.systemStartedAt.getTime();
  const daysActive = Math.max(1, Math.floor((today.getTime() - startMs) / 86_400_000) + 1);
  const todayLabel = `${MONTH_SHORT[today.getUTCMonth()]} ${today.getUTCFullYear()}`;

  const [allHabits, checkInCount, reflectionCount] = await Promise.all([
    prisma.habit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, icon: true, archivedAt: true, createdAt: true },
    }),
    prisma.habitLog.count({ where: { userId: user.id, completed: true } }),
    prisma.reflection.count({ where: { userId: user.id } }),
  ]);

  type RawEvent = { date: Date; text: string; type: "system" | "habit" | "archived" };

  const rawEvents: RawEvent[] = [
    { date: user.systemStartedAt, text: "Consyst started", type: "system" },
    ...allHabits.map<RawEvent>((h) => ({
      date: h.createdAt,
      text: `Added habit "${h.icon} ${h.name}"`,
      type: "habit",
    })),
    ...allHabits
      .filter((h) => h.archivedAt !== null)
      .map<RawEvent>((h) => ({
        date: h.archivedAt!,
        text: `Archived "${h.icon} ${h.name}"`,
        type: "archived",
      })),
  ];

  const history = rawEvents
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 12)
    .map((e) => ({ dateStr: fmtDate(e.date), text: e.text, type: e.type }));

  return (
    <>
      <header className="h-14 border-b border-[var(--border)] bg-surface flex items-center px-4 md:px-5 shrink-0">
        <div>
          <p className="font-mono-brand text-[9px] text-dust uppercase tracking-[0.18em] leading-none">
            {todayLabel}
          </p>
          <p className="text-[15px] md:text-[17px] font-extrabold text-ink tracking-tight leading-tight mt-0.5">
            Settings
          </p>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-12">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
          <AccountSection
            initialName={user.name}
            email={user.email}
            initialTimezone={user.timezone}
          />
          <ReminderSection />
          <ProfileStatsSection
            daysActive={daysActive}
            totalHabits={allHabits.length}
            totalCheckIns={checkInCount}
            totalReflections={reflectionCount}
            history={history}
          />
          <ExportSection />
          <DangerZone />
        </div>
      </main>
    </>
  );
}
