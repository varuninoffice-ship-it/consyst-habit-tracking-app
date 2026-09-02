"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

function passwordStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  if (pw.length >= 16) return 4;
  if (pw.length >= 12) return 3;
  if (pw.length >= 8) return 2;
  if (pw.length >= 4) return 1;
  return 0;
}

const STRENGTH_COLORS = ["", "#F0997B", "#F0997B", "#EF9F27", "#1D9E75"] as const;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<"verifying" | "ready" | "error">("verifying");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  // Exchange the code from the URL for a session
  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setStatus("error");
      return;
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setStatus("error");
      } else {
        setStatus("ready");
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
      } else {
        setDone(true);
        setTimeout(() => router.push("/now"), 2000);
      }
    });
  }

  const strength = passwordStrength(password);

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image src="/consyst-logo-light.svg" alt="Consyst" width={108} height={24} priority />
        </div>

        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-8">

          {/* Verifying */}
          {status === "verifying" && (
            <div className="text-center py-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-dust animate-pulse">
                Verifying link…
              </p>
            </div>
          )}

          {/* Invalid / expired link */}
          {status === "error" && (
            <div className="text-center">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-dust mb-3">
                Link expired
              </p>
              <h1 className="text-[20px] font-extrabold text-ink tracking-tight mb-3">
                This link is no longer valid.
              </h1>
              <p className="text-[13px] text-stone leading-relaxed mb-6">
                Password reset links expire after 1 hour. Request a new one from the sign-in page.
              </p>
              <a
                href="/signin"
                className="inline-flex items-center px-5 py-2.5 rounded-lg bg-ink text-white text-[13px] font-semibold hover:bg-[#222] transition-colors"
              >
                Back to sign in
              </a>
            </div>
          )}

          {/* Success */}
          {status === "ready" && done && (
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-full bg-[#E1F5EE] flex items-center justify-center mx-auto mb-4">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 9l4.5 4.5 7.5-9" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-[16px] font-bold text-ink mb-1">Password updated.</p>
              <p className="text-[13px] text-stone">Redirecting you to the app…</p>
            </div>
          )}

          {/* Reset form */}
          {status === "ready" && !done && (
            <>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-dust mb-3">
                New password
              </p>
              <h1 className="text-[22px] font-extrabold text-ink tracking-tight mb-1">
                Choose a new password.
              </h1>
              <p className="text-[13px] text-stone mb-6 leading-relaxed">
                Make it strong — at least 8 characters.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="password"
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-11 px-4 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-ink text-[14px] placeholder:text-dust focus:outline-none focus:border-[var(--teal)] transition-colors"
                  />
                  {/* Strength bars */}
                  {password.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="flex-1 h-[3px] rounded-full transition-colors duration-300"
                          style={{ background: i <= strength ? STRENGTH_COLORS[strength] : "var(--chalk)" }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="w-full h-11 px-4 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-ink text-[14px] placeholder:text-dust focus:outline-none focus:border-[var(--teal)] transition-colors"
                />

                {error && (
                  <p className="text-[12px] text-[var(--coral)]">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full h-11 rounded-lg bg-ink text-white text-[14px] font-semibold hover:bg-[#222] transition-colors disabled:opacity-60"
                >
                  {pending ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-[12px] text-dust">
          <a href="/signin" className="hover:text-stone transition-colors">← Back to sign in</a>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-dust animate-pulse">Loading…</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
