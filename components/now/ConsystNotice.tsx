interface ConsystNoticeProps {
  observation: string | null;
  isNewUser?:  boolean;
}

function LogoMark({ size = 10 }: { size?: number }) {
  const bars = [
    { h: 0.45, c: "#F0997B" },
    { h: 0.65, c: "#EF9F27" },
    { h: 1.00, c: "#1D9E75" },
    { h: 0.80, c: "#378ADD" },
  ];
  const w = Math.round(size * 0.32);
  const gap = Math.round(size * 0.1);
  return (
    <div className="flex items-end shrink-0" style={{ gap }} aria-hidden>
      {bars.map((b, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{ width: w, height: Math.round(size * b.h), background: b.c }}
        />
      ))}
    </div>
  );
}

export default function ConsystNotice({ observation, isNewUser }: ConsystNoticeProps) {
  const text = isNewUser
    ? "Start with 2 or 3 habits — not ten. The system earns your trust through consistency, not ambition."
    : observation;

  return (
    <div className="bg-white rounded-xl border border-[#E8E7E2] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 bg-[#F2F1EC] border-b border-[#E8E7E2] flex items-center gap-2 shrink-0">
        <LogoMark size={12} />
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-ink">
          Consyst
        </p>
      </div>

      {/* Body */}
      <div className="px-4 py-4 flex flex-col gap-3">
        {text ? (
          <p
            className="text-[12px] font-semibold text-ink"
            style={{ fontFamily: "var(--font-jakarta, sans-serif)", lineHeight: 1.65 }}
          >
            {text}
          </p>
        ) : (
          <p className="text-[12px] text-dust" style={{ lineHeight: 1.65 }}>
            Observations appear once your habits are running for a few days.
          </p>
        )}

        {/* Divider */}
        <div className="h-px bg-[#E8E7E2]" />

        {/* Footer row */}
        <div className="flex items-center gap-1.5">
          <LogoMark size={10} />
          <p className="font-mono text-[10px] text-dust uppercase tracking-[0.15em]">
            Consyst · now
          </p>
        </div>
      </div>
    </div>
  );
}
