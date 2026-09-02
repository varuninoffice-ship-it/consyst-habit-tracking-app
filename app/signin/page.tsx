"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn, signUp, signInWithGoogle, sendPasswordReset } from "@/app/auth/actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "signin" | "create";
type ButtonState = "idle" | "loading" | "success";

// ─── Password strength ────────────────────────────────────────────────────────

function passwordStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  if (pw.length >= 16) return 4;
  if (pw.length >= 12) return 3;
  if (pw.length >= 8) return 2;
  if (pw.length >= 4) return 1;
  return 0;
}

const STRENGTH_COLORS = ["", "#F0997B", "#F0997B", "#EF9F27", "#1D9E75", "#1D9E75"] as const;

function StrengthBars({ password }: { password: string }) {
  const level = passwordStrength(password);
  return (
    <div className="flex gap-1 mt-2" aria-hidden>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex-1 h-[3px] rounded-full transition-colors duration-300"
          style={{ background: i <= level ? STRENGTH_COLORS[level] : "var(--chalk)" }}
        />
      ))}
    </div>
  );
}

// ─── Google button ────────────────────────────────────────────────────────────

function GoogleButton({ label }: { label: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => { await signInWithGoogle(); })}
      className="w-full flex items-center justify-center gap-3 h-11 rounded-lg border border-[var(--border-md)] bg-surface text-ink text-[14px] font-semibold hover:bg-chalk transition-colors disabled:opacity-60"
    >
      {/* Google G SVG */}
      <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
        <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </svg>
      {pending ? "Redirecting…" : label}
    </button>
  );
}

// ─── Forgot password modal ────────────────────────────────────────────────────

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const fd = new FormData();
    fd.set("email", email);
    startTransition(async () => {
      const res = await sendPasswordReset(fd);
      if (res?.error) setErr(res.error);
      else setSent(true);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface rounded-2xl p-8 w-full max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {sent ? (
          <>
            <p className="text-[22px] font-bold text-ink mb-2">Check your inbox</p>
            <p className="text-[14px] text-stone leading-relaxed">We sent a reset link to <strong>{email}</strong>. It expires in an hour.</p>
            <button onClick={onClose} className="mt-6 w-full h-11 rounded-lg bg-chalk text-ink font-semibold text-[14px] hover:bg-border transition-colors">Done</button>
          </>
        ) : (
          <>
            <p className="text-[22px] font-bold text-ink mb-1">Reset password</p>
            <p className="text-[13px] text-stone mb-6">Enter your email and we'll send a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-ink text-[14px] placeholder:text-dust focus:outline-none focus:border-[var(--teal)] transition-colors"
              />
              {err && <p className="text-[12px] text-[var(--coral)]">{err}</p>}
              <button
                type="submit"
                disabled={pending}
                className="w-full h-11 rounded-lg bg-teal text-white font-semibold text-[14px] hover:bg-[#178a64] transition-colors disabled:opacity-60"
              >
                {pending ? "Sending…" : "Send reset link"}
              </button>
            </form>
            <button onClick={onClose} className="mt-3 w-full text-center text-[13px] text-stone hover:text-ink transition-colors">Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Sign In form ─────────────────────────────────────────────────────────────

function SignInForm() {
  const [btnState, setBtnState] = useState<ButtonState>("idle");
  const [err, setErr] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr("");
    setBtnState("loading");
    const fd = new FormData(formRef.current!);
    const res = await signIn(fd);
    if (res?.error) {
      setErr(res.error);
      setBtnState("idle");
    } else {
      setBtnState("success");
    }
  };

  const btnLabel =
    btnState === "loading" ? "Signing in…" :
    btnState === "success" ? "Welcome back ✓" :
    "Enter Consyst →";

  return (
    <>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Email address"
          className="w-full h-11 px-4 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-ink text-[14px] placeholder:text-dust focus:outline-none focus:border-[var(--teal)] transition-colors"
        />
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Password"
          className="w-full h-11 px-4 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-ink text-[14px] placeholder:text-dust focus:outline-none focus:border-[var(--teal)] transition-colors"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowForgot(true)}
            className="text-[13px] text-stone hover:text-ink transition-colors"
          >
            Forgot password?
          </button>
        </div>
        {err && <p className="text-[12px] text-[var(--coral)] -mt-1">{err}</p>}
        <button
          type="submit"
          disabled={btnState === "loading"}
          className="w-full h-11 rounded-lg bg-teal text-white font-semibold text-[14px] hover:bg-[#178a64] transition-colors disabled:opacity-70 mt-1"
        >
          {btnLabel}
        </button>
      </form>
      <Divider />
      <GoogleButton label="Continue with Google" />
    </>
  );
}

// ─── Create Account form ──────────────────────────────────────────────────────

function CreateAccountForm() {
  const [btnState, setBtnState] = useState<ButtonState>("idle");
  const [err, setErr] = useState("");
  const [password, setPassword] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr("");
    setBtnState("loading");
    const fd = new FormData(formRef.current!);
    const res = await signUp(fd);
    if (res?.error) {
      setErr(res.error);
      setBtnState("idle");
    } else {
      setBtnState("success");
    }
  };

  const btnLabel =
    btnState === "loading" ? "Setting up…" :
    btnState === "success" ? "System ready ✓" :
    "Start your system →";

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <input
            name="firstName"
            type="text"
            required
            autoComplete="given-name"
            placeholder="First name"
            className="w-full h-11 px-4 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-ink text-[14px] placeholder:text-dust focus:outline-none focus:border-[var(--teal)] transition-colors"
          />
          <input
            name="lastName"
            type="text"
            required
            autoComplete="family-name"
            placeholder="Last name"
            className="w-full h-11 px-4 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-ink text-[14px] placeholder:text-dust focus:outline-none focus:border-[var(--teal)] transition-colors"
          />
        </div>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Email address"
          className="w-full h-11 px-4 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-ink text-[14px] placeholder:text-dust focus:outline-none focus:border-[var(--teal)] transition-colors"
        />
        <div>
          <input
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 px-4 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-ink text-[14px] placeholder:text-dust focus:outline-none focus:border-[var(--teal)] transition-colors"
          />
          <StrengthBars password={password} />
        </div>
        {err && <p className="text-[12px] text-[var(--coral)]">{err}</p>}
        <button
          type="submit"
          disabled={btnState === "loading"}
          className="w-full h-11 rounded-lg bg-teal text-white font-semibold text-[14px] hover:bg-[#178a64] transition-colors disabled:opacity-70 mt-1"
        >
          {btnLabel}
        </button>
      </form>
      <Divider />
      <GoogleButton label="Sign up with Google" />
    </>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-[var(--border)]" />
      <span className="text-[11px] font-mono-brand text-dust tracking-widest uppercase">or</span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

// ─── Left panel (brand) ───────────────────────────────────────────────────────

function BrandPanel() {
  return (
    <div className="hidden md:flex flex-col justify-between bg-ink text-white w-[480px] shrink-0 p-10 relative overflow-hidden">
      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Logo */}
      <div className="relative z-10">
        <Image
          src="/consyst-logo-dark.svg"
          alt="Consyst"
          width={160}
          height={35}
          priority
        />
      </div>

      {/* Quote + description */}
      <div className="relative z-10 space-y-6">
        <blockquote className="font-serif-brand text-[22px] leading-[1.5] text-[#F5F5F3]">
          "The system is already running.{" "}
          <em>You just need to step back in.</em>"
        </blockquote>
        <p className="text-[14px] text-[#9E9C98] leading-relaxed max-w-xs">
          Your habits, streaks, and weekly pulse are waiting exactly where you left them.
        </p>

        {/* Mini preview card */}
        <div className="rounded-xl bg-white/[0.06] border border-white/10 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-brand text-[#9E9C98] tracking-widest uppercase">This week</span>
            <span className="text-[11px] font-mono-brand text-[var(--teal)]">5 / 7 days</span>
          </div>
          <div className="space-y-2">
            {[
              { label: "Morning pages", done: true },
              { label: "Exercise", done: true },
              { label: "Read 30 min", done: false },
            ].map((h) => (
              <div key={h.label} className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-[4px] shrink-0 flex items-center justify-center"
                  style={{ background: h.done ? "var(--teal)" : "rgba(255,255,255,0.08)", border: h.done ? "none" : "1.5px solid rgba(255,255,255,0.18)" }}
                >
                  {h.done && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="text-[13px] text-[#C8C7C3]">{h.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pulse mark + tagline */}
        <div className="flex items-center gap-4">
          <div className="flex items-end gap-[3px]" aria-hidden>
            {[
              { h: 14, color: "#F0997B", delay: "bar-rise-1" },
              { h: 18, color: "#EF9F27", delay: "bar-rise-2" },
              { h: 24, color: "#1D9E75", delay: "bar-rise-3" },
              { h: 20, color: "#378ADD", delay: "bar-rise-4" },
            ].map((b, i) => (
              <div
                key={i}
                className={`w-[6px] rounded-full bar-rise ${b.delay}`}
                style={{ height: b.h, background: b.color }}
              />
            ))}
          </div>
          <span className="text-[11px] font-mono-brand text-[#9E9C98] tracking-widest uppercase">Personal operating system</span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignInPage() {
  const [tab, setTab] = useState<Tab>("signin");

  const heading = tab === "signin" ? "Sign in to Consyst" : "Start your system";
  const subheading =
    tab === "signin"
      ? "Your streak is intact. Welcome back."
      : "Build your personal operating system.";

  return (
    <div className="flex min-h-screen bg-bg md:overflow-hidden">
      <BrandPanel />

      {/* Right panel — full-width on mobile, flex-1 on md+ */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 sm:px-8 sm:py-12 relative min-h-screen md:min-h-0 overflow-y-auto">
        {/* Back link */}
        <Link
          href="/"
          className="absolute top-4 right-4 sm:top-6 sm:right-6 text-[12px] sm:text-[13px] font-mono-brand text-stone hover:text-ink transition-colors tracking-wide"
        >
          ← consyst.app
        </Link>

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex justify-center mb-6 sm:mb-8 md:hidden">
            <Image src="/consyst-logo-light.svg" alt="Consyst" width={110} height={25} priority />
          </div>

          {/* Tab switcher */}
          <div className="flex bg-chalk rounded-xl p-1 mb-6 sm:mb-8">
            {(["signin", "create"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 h-9 rounded-lg text-[13px] font-semibold transition-all ${
                  tab === t
                    ? "bg-surface text-ink shadow-sm"
                    : "text-stone hover:text-ink"
                }`}
              >
                {t === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div className="mb-5 sm:mb-6">
            <h1 className="text-[24px] sm:text-[28px] font-extrabold text-ink tracking-tight leading-tight">
              {heading}
            </h1>
            <p className="mt-1 text-[13px] sm:text-[14px] text-stone">{subheading}</p>
          </div>

          {/* Forms */}
          {tab === "signin" ? <SignInForm /> : <CreateAccountForm />}
        </div>
      </div>
    </div>
  );
}
