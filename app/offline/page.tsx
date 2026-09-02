import Link from "next/link";
import ReloadButton from "./ReloadButton";

export const metadata = {
  title: "You're offline — Consyst",
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="flex items-end justify-center gap-[5px] mb-8" aria-hidden>
        {[
          { h: 20, color: "#F0997B" },
          { h: 28, color: "#EF9F27" },
          { h: 38, color: "#1D9E75" },
          { h: 32, color: "#378ADD" },
        ].map((b, i) => (
          <div
            key={i}
            className="w-[10px] rounded-full opacity-30"
            style={{ height: b.h, background: b.color }}
          />
        ))}
      </div>

      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-dust mb-3">
        No connection
      </p>
      <h1 className="text-[22px] md:text-[28px] font-extrabold text-ink tracking-tight mb-3">
        You&apos;re offline.
      </h1>
      <p className="text-[14px] text-stone leading-relaxed max-w-xs mb-8">
        Check your connection and try again. Recently viewed pages may still be available.
      </p>

      <ReloadButton />

      <Link
        href="/"
        className="mt-4 text-[12px] text-stone hover:text-ink transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
