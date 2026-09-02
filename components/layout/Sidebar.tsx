"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/now",     label: "Now",     dot: "#111111", activeBg: "#F2F1EC",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.1 3.1l1.4 1.4M13.5 13.5l1.4 1.4M14.9 3.1l-1.4 1.4M4.5 13.5l-1.4 1.4"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  { href: "/pulse",   label: "Pulse",   dot: "#EF9F27", activeBg: "#FEF3DC",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M1 9h3l2-5 3 9 2-6 2 3h4" stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  { href: "/story",   label: "Story",   dot: "#1D9E75", activeBg: "#E1F5EE",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 7h8M5 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  { href: "/habits",  label: "Habits",  dot: "#7F77DD", activeBg: "#EEEDFE",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M4 9l3.5 3.5L14 5" stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  { href: "/reflect", label: "Reflect", dot: "#378ADD", activeBg: "#E6F1FB",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 2C5.13 2 2 5.13 2 9c0 1.85.67 3.55 1.78 4.86L2 16h5.14A6.97 6.97 0 009 16c3.87 0 7-3.13 7-7s-3.13-7-7-7z"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

interface SidebarProps {
  user: { name: string; avatarUrl?: string | null };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut,  setSigningOut]  = useState(false);
  const desktopProfileRef = useRef<HTMLDivElement>(null);
  const mobileProfileRef  = useRef<HTMLDivElement>(null);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); setProfileOpen(false); }, [pathname]);

  // Close profile popover on outside click
  useEffect(() => {
    if (!profileOpen) return;
    function handler(e: MouseEvent) {
      const t = e.target as Node;
      if (
        !desktopProfileRef.current?.contains(t) &&
        !mobileProfileRef.current?.contains(t)
      ) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  async function handleSignOut() {
    setSigningOut(true);
    setProfileOpen(false);
    setDrawerOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/signin");
    router.refresh();
  }

  const initials = user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  function avatar(size: number) {
    if (user.avatarUrl) {
      return (
        <Image
          src={user.avatarUrl}
          alt={user.name}
          width={size}
          height={size}
          className="rounded-full object-cover shrink-0"
          style={{ width: size, height: size }}
        />
      );
    }
    return (
      <div
        className="rounded-full bg-chalk flex items-center justify-center font-bold text-stone shrink-0"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      >
        {initials}
      </div>
    );
  }

  // Profile popover menu
  const profileMenu = (
    <div className="absolute bottom-full mb-2 left-0 right-0 bg-surface border border-[var(--border)] rounded-xl shadow-lg overflow-hidden z-[60]">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <p className="text-[13px] font-bold text-ink truncate">{user.name}</p>
      </div>
      <Link
        href="/settings"
        onClick={() => { setProfileOpen(false); setDrawerOpen(false); }}
        className="flex items-center gap-3 px-4 py-3 hover:bg-chalk transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-stone shrink-0">
          <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M13.3 7a5.7 5.7 0 00-.1-.8l1.5-1.2-1.5-2.6-1.8.7a5.4 5.4 0 00-1.4-.8L9.7 1H6.3l-.3 1.3a5.4 5.4 0 00-1.4.8L2.8 2.4 1.3 5l1.5 1.2A5.7 5.7 0 002.7 7v.8L1.2 9l1.5 2.6 1.8-.7a5.4 5.4 0 001.4.8L6.3 13h3.4l.3-1.3a5.4 5.4 0 001.4-.8l1.8.7 1.5-2.6-1.5-1.2c.1-.3.1-.5.1-.8z"
            stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        <span className="text-[13px] text-stone font-medium">Settings</span>
      </Link>
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-chalk transition-colors border-t border-[var(--border)] disabled:opacity-50"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-coral shrink-0">
          <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10 11l3-3-3-3M13 8H6"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-[13px] font-medium" style={{ color: "var(--coral)" }}>
          {signingOut ? "Signing out…" : "Sign out"}
        </span>
      </button>
    </div>
  );

  // Profile trigger button
  function profileTrigger() {
    return (
      <button
        onClick={() => setProfileOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-3 py-[10px] rounded-lg hover:bg-chalk transition-colors"
      >
        {avatar(24)}
        <span className="text-[13px] text-stone font-medium truncate flex-1 text-left">
          {user.name.split(" ")[0]}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-dust shrink-0">
          <path d="M2 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    );
  }

  return (
    <>
      {/* ── Desktop sidebar (md+) ──────────────────────────────────── */}
      <aside className="hidden md:flex w-[196px] shrink-0 bg-surface border-r border-[var(--border)] flex-col h-screen sticky top-0 z-20">
        <div className="px-5 pt-5 pb-4 border-b border-[var(--border)]">
          <Image src="/consyst-logo-light.svg" alt="Consyst" width={104} height={23} priority />
        </div>

        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          {NAV.map(({ href, label, dot, activeBg, icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-[10px] rounded-lg mb-0.5 transition-colors"
                style={isActive ? { background: activeBg } : undefined}
              >
                <span style={{ color: isActive ? dot : "var(--stone)" }}>{icon}</span>
                <span className="text-[14px] font-semibold" style={{ color: isActive ? dot : "var(--stone)" }}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop profile footer */}
        <div className="border-t border-[var(--border)] px-2 py-3 relative" ref={desktopProfileRef}>
          {profileOpen && profileMenu}
          {profileTrigger()}
        </div>
      </aside>

      {/* ── Mobile: fixed top bar ─────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-12 bg-surface border-b border-[var(--border)] flex items-center px-4">
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-lg hover:bg-chalk transition-colors"
          aria-label="Open menu"
        >
          <span className="w-5 h-[1.5px] rounded-full bg-ink block" />
          <span className="w-5 h-[1.5px] rounded-full bg-ink block" />
          <span className="w-5 h-[1.5px] rounded-full bg-ink block" />
        </button>
        <div className="flex-1 flex justify-center">
          <Image src="/consyst-logo-light.svg" alt="Consyst" width={88} height={20} priority />
        </div>
        <div className="w-9" />
      </div>

      {/* ── Mobile: backdrop ──────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px]"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile: slide-out drawer ──────────────────────────────── */}
      <div
        className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-[68vw] max-w-[300px] bg-surface flex flex-col shadow-2xl transition-transform duration-300 ease-in-out"
        style={{ transform: drawerOpen ? "translateX(0)" : "translateX(-100%)" }}
      >
        {/* Drawer header */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-[var(--border)] shrink-0">
          <Image src="/consyst-logo-light.svg" alt="Consyst" width={88} height={20} priority />
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-chalk transition-colors text-stone"
            aria-label="Close menu"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Nav + profile — nav at top, profile pinned to bottom via mt-auto */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <nav className="py-3 px-2 shrink-0">
            {NAV.map(({ href, label, dot, activeBg, icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-[10px] rounded-lg mb-0.5 transition-colors"
                  style={isActive ? { background: activeBg } : undefined}
                >
                  <span style={{ color: isActive ? dot : "var(--stone)" }}>{icon}</span>
                  <span className="text-[14px] font-semibold" style={{ color: isActive ? dot : "var(--stone)" }}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile profile footer — mt-auto pins it to bottom of drawer */}
          <div className="mt-auto border-t border-[var(--border)] px-2 py-4 relative shrink-0" ref={mobileProfileRef}>
            {profileOpen && profileMenu}
            {profileTrigger()}
          </div>
        </div>
      </div>
    </>
  );
}
