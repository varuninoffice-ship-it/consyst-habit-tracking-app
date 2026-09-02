import Link from "next/link";
import Image from "next/image";

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <Image src="/consyst-logo-light.svg" alt="Consyst" width={120} height={27} className="mx-auto" />
        <div className="flex justify-center gap-[3px] items-end" aria-hidden>
          {[
            { h: 14, color: "#F0997B" },
            { h: 18, color: "#EF9F27" },
            { h: 24, color: "#1D9E75" },
            { h: 20, color: "#378ADD" },
          ].map((b, i) => (
            <div key={i} className={`w-[7px] rounded-full bar-rise bar-rise-${i + 1}`} style={{ height: b.h, background: b.color }} />
          ))}
        </div>
        <div>
          <h1 className="text-[26px] font-extrabold text-ink tracking-tight">Check your email</h1>
          <p className="mt-2 text-[14px] text-stone leading-relaxed">
            We sent a confirmation link to your inbox. Click it to activate your account and start your system.
          </p>
        </div>
        <Link
          href="/signin"
          className="inline-block text-[13px] font-mono-brand text-stone hover:text-ink transition-colors tracking-wide"
        >
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
