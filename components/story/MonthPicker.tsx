"use client";

import { useRouter } from "next/navigation";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

interface Props {
  year: number;
  month: number; // 0-based
  minYear: number;
  maxYear: number;
  maxMonth: number; // 0-based, inclusive upper bound
}

export default function MonthPicker({ year, month, minYear, maxYear, maxMonth }: Props) {
  const router = useRouter();

  function navigate(y: number, m: number) {
    router.push(`/story?y=${y}&m=${m + 1}`);
  }

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear  = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear  = month === 11 ? year + 1 : year;

  const canPrev = prevYear > minYear || (prevYear === minYear && prevMonth >= 0);
  const canNext =
    nextYear < maxYear || (nextYear === maxYear && nextMonth <= maxMonth);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => canPrev && navigate(prevYear, prevMonth)}
        disabled={!canPrev}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-stone hover:bg-chalk disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous month"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <span className="text-[14px] font-semibold text-ink min-w-[110px] text-center">
        {MONTH_NAMES[month]} {year}
      </span>

      <button
        onClick={() => canNext && navigate(nextYear, nextMonth)}
        disabled={!canNext}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-stone hover:bg-chalk disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Next month"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5 11l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}
