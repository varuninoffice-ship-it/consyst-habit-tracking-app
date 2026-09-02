import { formatDisplayDate, getISOWeek } from "@/lib/date";

interface TopBarProps {
  today: Date;
  isNewUser: boolean;
  longestStreak: number;
}

export default function TopBar({ today, isNewUser, longestStreak }: TopBarProps) {
  const weekNum = getISOWeek(today);
  const dateStr = formatDisplayDate(today);

  return (
    <header className="h-14 border-b border-[var(--border)] bg-surface flex items-center justify-between px-4 md:px-5 shrink-0 z-10">
      <div>
        <p className="font-mono text-[9px] text-dust uppercase tracking-[0.18em] leading-none">
          {dateStr}
        </p>
        <p className="text-[15px] md:text-[17px] font-extrabold text-ink tracking-tight leading-tight mt-0.5">
          {isNewUser ? "Your system is ready — let's build it." : "Now"}
        </p>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {isNewUser ? (
          <span className="font-mono text-[9px] text-stone uppercase tracking-widest bg-chalk px-2 py-1 rounded">
            Day 1
          </span>
        ) : (
          <>
            <span className="hidden sm:inline font-mono text-[9px] text-stone uppercase tracking-widest">
              Week {weekNum}
            </span>
            {longestStreak > 0 && (
              <span className="font-mono text-[9px] text-white bg-teal px-2.5 py-1 rounded-full whitespace-nowrap">
                {longestStreak}d streak
              </span>
            )}
          </>
        )}
      </div>
    </header>
  );
}
