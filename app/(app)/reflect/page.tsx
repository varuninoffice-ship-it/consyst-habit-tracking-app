import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayDate } from "@/lib/date";
import { saveWins, saveGaps } from "@/app/reflect/actions";

import ReflectMonthPicker from "@/components/reflect/ReflectMonthPicker";
import ReflectListCard from "@/components/reflect/ReflectListCard";
import JournalCard from "@/components/reflect/JournalCard";
import IntentionsCard from "@/components/reflect/IntentionsCard";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

interface Props {
  searchParams: { y?: string; m?: string };
}

export default async function ReflectPage({ searchParams }: Props) {
  const user = await getAppUser();
  if (!user) return null;

  const today    = getTodayDate(user.timezone);
  const maxYear  = today.getUTCFullYear();
  const maxMonth = today.getUTCMonth();

  const rawY = parseInt(searchParams.y ?? "", 10);
  const rawM = parseInt(searchParams.m ?? "", 10) - 1;

  const year  = Number.isFinite(rawY) ? Math.min(rawY, maxYear) : maxYear;
  const month =
    Number.isFinite(rawM) && rawM >= 0 && rawM <= 11
      ? year === maxYear ? Math.min(rawM, maxMonth) : rawM
      : maxMonth;

  const monthKey        = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const reflectionMonth = new Date(Date.UTC(year, month, 1));

  const reflection = await prisma.reflection.findUnique({
    where: { userId_reflectionMonth: { userId: user.id, reflectionMonth } },
    select: { wins: true, gaps: true, journal: true, intentions: true },
  });

  function toStringArray(json: unknown): string[] {
    if (!Array.isArray(json)) return [];
    return json.filter((v) => typeof v === "string") as string[];
  }

  const wins       = toStringArray(reflection?.wins);
  const gaps       = toStringArray(reflection?.gaps);
  const journal    = reflection?.journal ?? "";
  const intentions = toStringArray(reflection?.intentions);

  const isCurrentMonth = year === maxYear && month === maxMonth;
  const headerSub = isCurrentMonth ? "This month" : `${MONTH_NAMES[month]} ${year}`;

  return (
    <>
      <header className="h-14 border-b border-[var(--border)] bg-surface flex items-center justify-between px-4 md:px-5 shrink-0">
        <div>
          <p className="font-mono-brand text-[9px] text-dust uppercase tracking-[0.18em] leading-none">
            {headerSub}
          </p>
          <p className="text-[15px] md:text-[17px] font-extrabold text-ink tracking-tight leading-tight mt-0.5">
            Reflect
          </p>
        </div>
        <ReflectMonthPicker year={year} month={month} maxYear={maxYear} maxMonth={maxMonth} />
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-5 pb-6 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReflectListCard
            title="Monthly Wins"
            subtitle="What went well this month?"
            accent="teal"
            monthKey={monthKey}
            initialItems={wins}
            placeholder="Something that went well…"
            saveAction={saveWins}
          />
          <ReflectListCard
            title="Gaps & Risks"
            subtitle="What slipped or felt difficult?"
            accent="amber"
            monthKey={monthKey}
            initialItems={gaps}
            placeholder="Something to improve…"
            saveAction={saveGaps}
          />
        </div>
        <JournalCard monthKey={monthKey} initialText={journal} />
        <IntentionsCard monthKey={monthKey} initialItems={intentions} />
      </main>
    </>
  );
}
