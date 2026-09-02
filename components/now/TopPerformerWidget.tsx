import type { TopPerformer } from "@/lib/business/now";

export default function TopPerformerWidget({ performer }: { performer: TopPerformer | null }) {
  const pct = performer ? Math.round(Math.min(performer.ratio, 1.5) / 1.5 * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-[#E8E7E2] flex flex-col overflow-hidden min-h-[180px]">
      {/* Header */}
      <div className="px-4 py-2.5 bg-[#F2F1EC] border-b border-[#E8E7E2] shrink-0">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-ink">
          Top Performer
        </p>
      </div>

      <div className="px-4 pt-4 pb-4 flex flex-col">
        {performer ? (
          <>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] leading-none mb-2"
              style={{ color: "#1D9E75" }}>
              Leading this week
            </p>
            <p className="text-[14px] font-extrabold text-ink leading-tight mb-1">
              {performer.habit.icon} {performer.habit.name}
            </p>
            <p className="text-[36px] font-extrabold leading-none mb-1"
              style={{ color: "#1D9E75" }}>
              {Math.round(performer.ratio * 100)}%
            </p>
            <p className="text-[11px] text-stone leading-none mb-3">
              {performer.completed}/{performer.goal} days hit
            </p>
            {/* 4px progress bar */}
            <div className="h-[4px] rounded-full overflow-hidden" style={{ background: "#E1F5EE" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(pct, 100)}%`, background: "#1D9E75" }}
              />
            </div>
          </>
        ) : (
          <p className="text-[12px] text-dust leading-relaxed">
            Appears when a habit hits its weekly goal.
          </p>
        )}
      </div>
    </div>
  );
}
