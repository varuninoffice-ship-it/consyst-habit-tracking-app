import type { NeedsPush } from "@/lib/business/now";

export default function NeedsPushWidget({ needsPush }: { needsPush: NeedsPush | null }) {
  const pct = needsPush
    ? Math.round((needsPush.completed / needsPush.goal) * 100)
    : 0;

  return (
    <div className="bg-white rounded-xl border border-[#E8E7E2] flex flex-col overflow-hidden min-h-[180px]">
      {/* Header */}
      <div className="px-4 py-2.5 bg-[#F2F1EC] border-b border-[#E8E7E2] shrink-0">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-ink">
          Needs a Push
        </p>
      </div>

      <div className="px-4 pt-4 pb-4 flex flex-col">
        {needsPush ? (
          <>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] leading-none mb-2"
              style={{ color: "#EF9F27" }}>
              Behind pace
            </p>
            <p className="text-[14px] font-extrabold text-ink leading-tight mb-1">
              {needsPush.habit.icon} {needsPush.habit.name}
            </p>
            <p className="text-[36px] font-extrabold leading-none mb-1"
              style={{ color: "#EF9F27" }}>
              {needsPush.completed}/{needsPush.goal}
            </p>
            <p className="text-[11px] leading-none mb-3"
              style={{ color: "#EF9F27" }}>
              {needsPush.goal - needsPush.completed} more needed &mdash;{" "}
              {needsPush.daysLeft} day{needsPush.daysLeft !== 1 ? "s" : ""} left
            </p>
            {/* 4px progress bar */}
            <div className="h-[4px] rounded-full overflow-hidden" style={{ background: "#FEF3DC" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(pct, 100)}%`, background: "#EF9F27" }}
              />
            </div>
          </>
        ) : (
          <p className="text-[12px] text-dust leading-relaxed">
            Appears when a habit is behind its weekly pace.
          </p>
        )}
      </div>
    </div>
  );
}
