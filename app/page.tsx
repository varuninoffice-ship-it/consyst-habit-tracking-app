import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Consyst — The habit system that actually keeps score",
  description:
    "Track daily habits, measure weekly progress, and build the consistency that compounds. Your personal operating system.",
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const MARQUEE = [
  "Week Score", "Daily Check-ins", "Streaks", "Habit Tracking",
  "Monthly Reflect", "Milestones", "Personal Best", "Pulse View",
  "Consistency", "Story View", "Observations", "Progress",
];

const PILLARS = [
  {
    color: "#1D9E75",
    bg: "#E1F5EE",
    label: "Track",
    body: "A 10-second daily check-in for every habit. No friction — just show up and tap.",
  },
  {
    color: "#EF9F27",
    bg: "#FEF3DC",
    label: "Score",
    body: "A weekly grade from 0–100 that tells you exactly how consistent you've been.",
  },
  {
    color: "#378ADD",
    bg: "#E6F1FB",
    label: "Reflect",
    body: "Monthly wins, gaps, and intentions. The review loop most people skip.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Add your habits",
    body: "Pick what matters. Set a weekly goal for each. Takes 60 seconds.",
  },
  {
    n: "02",
    title: "Check in daily",
    body: "Tap to log. Streaks, scores, and patterns tracked automatically.",
  },
  {
    n: "03",
    title: "Read your score",
    body: "Weekly grades. Monthly stories. No guessing whether you're winning.",
  },
];

// ─── Reusable sub-components ──────────────────────────────────────────────────

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p
      className={`font-mono text-[9px] uppercase tracking-[0.2em] mb-3 ${
        light ? "text-[#6B6A66]" : "text-dust"
      }`}
    >
      {children}
    </p>
  );
}

// ─── Marquee ──────────────────────────────────────────────────────────────────

function MarqueeStrip() {
  const doubled = [...MARQUEE, ...MARQUEE];
  return (
    <div className="overflow-hidden border-y border-[var(--border)] py-3 bg-surface">
      <div className="marquee-track flex whitespace-nowrap gap-0">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-6 px-6 font-mono text-[10px] uppercase tracking-[0.18em] text-dust"
          >
            {item}
            <span className="w-1 h-1 rounded-full bg-[var(--border-md)] shrink-0" />
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Product showcase — browser mockup ───────────────────────────────────────

const MOCK_HABITS = [
  { icon: "🏃", name: "Morning run",  checked: true  },
  { icon: "📖", name: "Read 20 min",  checked: true  },
  { icon: "🧘", name: "Meditate",     checked: true  },
  { icon: "✍️", name: "Journal",       checked: false },
];

const MOCK_CARDS = [
  { label: "Week score", value: "74%",  color: "#EF9F27" },
  { label: "Today",      value: "3/4",  color: "#1D9E75" },
  { label: "Best streak",value: "12d",  color: "#F0997B" },
  { label: "Active",     value: "4",    color: "#378ADD" },
];

function BrowserMockup() {
  return (
    <div
      className="w-full rounded-2xl overflow-hidden shadow-2xl border border-[var(--border)] bg-[#FAFAF8]"
      style={{ boxShadow: "0 24px 64px 0 rgba(0,0,0,0.13), 0 4px 16px 0 rgba(0,0,0,0.07)" }}
    >
      {/* Chrome bar */}
      <div className="bg-[#F2F1EC] border-b border-[var(--border)] px-4 py-2.5 flex items-center gap-3">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FC5E57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FDBC2C]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#33C948]" />
        </div>
        <div className="flex-1 max-w-[200px] mx-auto bg-white rounded-md px-3 py-1 border border-[var(--border)]">
          <p className="font-mono text-[10px] text-stone text-center">consyst.app/now</p>
        </div>
      </div>

      {/* App content */}
      <div className="flex min-h-0">
        {/* Sidebar — hidden on small mockup, visible on md+ */}
        <div className="hidden sm:flex flex-col w-12 bg-[#111] shrink-0 items-center py-3 gap-4">
          <div className="w-6 h-6 rounded-full bg-teal flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">C</span>
          </div>
          {["▣","◎","▤","◈","⚙"].map((icon, i) => (
            <span key={i} className={`text-[12px] ${i === 0 ? "text-white" : "text-[#555]"}`}>{icon}</span>
          ))}
        </div>

        {/* Main */}
        <div className="flex-1 p-3 md:p-4 flex flex-col gap-3 min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[8px] text-dust uppercase tracking-widest">Wed, Apr 2</p>
              <p className="text-[13px] font-extrabold text-ink tracking-tight">Now</p>
            </div>
            <span className="font-mono text-[9px] text-white px-2 py-1 rounded-full" style={{ background: "#F0997B" }}>
              12d streak
            </span>
          </div>

          {/* Score cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {MOCK_CARDS.map((c) => (
              <div
                key={c.label}
                className="rounded-lg border border-[var(--border)] bg-white px-2.5 pt-2.5 pb-2 relative overflow-hidden"
              >
                <p className="font-mono text-[7px] uppercase tracking-widest text-dust leading-none">{c.label}</p>
                <p className="text-[18px] font-extrabold tracking-tight leading-tight mt-1" style={{ color: c.color }}>
                  {c.value}
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: c.color, opacity: 0.3 }} />
              </div>
            ))}
          </div>

          {/* Check-in list */}
          <div className="bg-white rounded-lg border border-[var(--border)] p-3">
            <p className="font-mono text-[8px] uppercase tracking-widest text-dust mb-2">Check In Today</p>
            <div className="flex flex-col gap-1.5">
              {MOCK_HABITS.map((h) => (
                <div key={h.name} className="flex items-center gap-2.5">
                  <span
                    className="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center text-[8px] text-white"
                    style={{
                      borderColor: h.checked ? "#1D9E75" : "#D4D3CE",
                      background: h.checked ? "#1D9E75" : "transparent",
                    }}
                  >
                    {h.checked ? "✓" : ""}
                  </span>
                  <span className={`text-[11px] font-medium ${h.checked ? "text-stone line-through" : "text-ink"}`}>
                    {h.icon} {h.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Observation */}
          <div className="rounded-lg bg-[#E1F5EE] border border-[#1D9E75]/20 px-3 py-2">
            <p className="text-[10px] text-[#1D9E75] font-medium leading-snug">
              🏃 Morning run is 12 days in — 2 more days to a 14-day milestone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[#FAFAF8]/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/consyst-icon.svg" alt="Consyst" width={24} height={24} />
            <span className="font-extrabold text-[15px] tracking-tight text-ink">Consyst</span>
          </Link>
          <Link
            href="/signin"
            className="text-[13px] font-semibold text-stone hover:text-ink transition-colors"
          >
            Sign in →
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="pt-16 pb-12 md:pt-24 md:pb-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <Eyebrow>Your personal operating system</Eyebrow>
          <h1 className="text-[36px] md:text-[52px] font-extrabold tracking-tight text-ink leading-[1.1] text-balance mb-5">
            The habit system that{" "}
            <span style={{ color: "var(--teal)" }}>actually keeps score.</span>
          </h1>
          <p className="text-[15px] md:text-[17px] text-stone leading-relaxed max-w-xl mx-auto mb-8 text-balance">
            Track daily habits, measure weekly progress, and build the consistency
            that compounds. Not another streak app — a system with a grade.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signin"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl bg-teal text-white text-[14px] font-semibold hover:bg-[#178a64] transition-colors"
            >
              Get started free →
            </Link>
            <a
              href="#how"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl border border-[var(--border)] text-[14px] font-semibold text-stone hover:border-[var(--border-md)] hover:text-ink transition-colors"
            >
              See how it works
            </a>
          </div>
          <p className="mt-4 font-mono text-[10px] text-dust uppercase tracking-widest">
            Free to start · No credit card
          </p>
        </div>
      </section>

      {/* ── Marquee ─────────────────────────────────────────────────────── */}
      <MarqueeStrip />

      {/* ── Problem ─────────────────────────────────────────────────────── */}
      <section className="py-14 md:py-20 px-4" style={{ background: "#111111" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <Eyebrow light>The problem</Eyebrow>
            <h2 className="text-[26px] md:text-[36px] font-extrabold tracking-tight text-white leading-tight text-balance">
              Most apps track.<br className="hidden md:block" /> None of them score.
            </h2>
            <p className="mt-4 text-[14px] md:text-[16px] text-[#9999A0] leading-relaxed max-w-lg mx-auto">
              You know you should be consistent. But you never know if you actually are.
              Consyst changes that.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: "≈",
                color: "#F0997B",
                title: "Vague progress",
                body: "Streaks tell you how long, not how well. You can streak and still underperform.",
              },
              {
                icon: "↯",
                color: "#EF9F27",
                title: "No weekly view",
                body: "Most apps show today. None show your week as a grade you can actually improve.",
              },
              {
                icon: "○",
                color: "#378ADD",
                title: "No big picture",
                body: "What happened in January? No idea. Consyst builds your story month by month.",
              },
            ].map((p) => (
              <div
                key={p.title}
                className="rounded-xl border border-white/10 p-5"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <span
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[16px] font-bold mb-3"
                  style={{ background: p.color + "22", color: p.color }}
                >
                  {p.icon}
                </span>
                <p className="text-[13px] font-bold text-white mb-1">{p.title}</p>
                <p className="text-[12px] text-[#9999A0] leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Three pillars ────────────────────────────────────────────────── */}
      <section className="py-14 md:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <Eyebrow>How Consyst works</Eyebrow>
            <h2 className="text-[26px] md:text-[34px] font-extrabold tracking-tight text-ink text-balance">
              One system. Three loops.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PILLARS.map((p) => (
              <div
                key={p.label}
                className="rounded-2xl border border-[var(--border)] p-6"
                style={{ background: p.bg }}
              >
                <p
                  className="font-mono text-[9px] uppercase tracking-[0.2em] mb-3"
                  style={{ color: p.color }}
                >
                  {p.label}
                </p>
                <p className="text-[14px] text-ink leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product showcase ─────────────────────────────────────────────── */}
      <section className="py-14 md:py-20 px-4 bg-chalk">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <Eyebrow>See it in action</Eyebrow>
            <h2 className="text-[26px] md:text-[34px] font-extrabold tracking-tight text-ink text-balance">
              Your dashboard, live.
            </h2>
            <p className="mt-3 text-[14px] text-stone max-w-sm mx-auto leading-relaxed">
              Every check-in updates your score in real time. Every Sunday, you get a grade.
            </p>
          </div>
          <BrowserMockup />
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how" className="py-14 md:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <Eyebrow>Getting started</Eyebrow>
            <h2 className="text-[26px] md:text-[34px] font-extrabold tracking-tight text-ink text-balance">
              Three steps. That&apos;s the whole system.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="flex flex-col gap-3">
                <p className="font-mono text-[32px] font-bold text-chalk leading-none">{s.n}</p>
                <p className="text-[15px] font-bold text-ink">{s.title}</p>
                <p className="text-[13px] text-stone leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 text-center" style={{ background: "#111111" }}>
        <div className="max-w-xl mx-auto">
          <p className="font-serif text-[15px] md:text-[17px] text-[#9999A0] italic leading-relaxed mb-2">
            &ldquo;The system works if you do.&rdquo;
          </p>
          <h2 className="text-[28px] md:text-[38px] font-extrabold tracking-tight text-white leading-tight text-balance mb-6">
            Ready to build something that lasts?
          </h2>
          <Link
            href="/signin"
            className="inline-flex items-center px-8 py-3.5 rounded-xl text-[14px] font-semibold text-white transition-colors hover:bg-[#178a64]"
            style={{ background: "var(--teal)" }}
          >
            Get started free →
          </Link>
          <p className="mt-4 font-mono text-[10px] text-[#6B6A66] uppercase tracking-widest">
            Free to start · No credit card
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/consyst-icon.svg" alt="Consyst" width={18} height={18} />
            <span className="font-bold text-[13px] text-ink">Consyst</span>
          </Link>
          <p className="font-mono text-[10px] text-dust uppercase tracking-widest">
            © 2026 Consyst
          </p>
          <Link href="/signin" className="text-[12px] text-stone hover:text-ink transition-colors font-medium">
            Sign in →
          </Link>
        </div>
      </footer>

    </div>
  );
}
