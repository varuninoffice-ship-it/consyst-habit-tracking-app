"use client";

import { useState } from "react";

interface ExportButtonProps {
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
}

function ExportButton({ label, sublabel, icon, onClick, loading }: ExportButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-surface hover:bg-chalk disabled:opacity-50 transition-colors text-left w-full"
    >
      <span className="text-stone shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-ink leading-tight">
          {loading ? "Preparing…" : label}
        </p>
        <p className="text-[11px] text-dust leading-tight mt-0.5">{sublabel}</p>
      </div>
      {!loading && (
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          className="ml-auto shrink-0 text-dust"
        >
          <path d="M7 1v8M3 6l4 4 4-4M2 12h10" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}

function download(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.click();
}

export default function ExportSection() {
  const [loading, setLoading] = useState<string | null>(null);

  async function doExport(format: string) {
    setLoading(format);
    try {
      download(`/settings/export?format=${format}`);
      // Small delay so the browser can initiate the download
      await new Promise((r) => setTimeout(r, 800));
    } finally {
      setLoading(null);
    }
  }

  function downloadAll() {
    // Stagger downloads to avoid browser blocking them as popups
    download("/settings/export?format=csv");
    setTimeout(() => download("/settings/export?format=txt"), 300);
    setTimeout(() => download("/settings/export?format=json"), 600);
  }

  return (
    <section className="bg-surface rounded-xl border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-5 py-3 bg-chalk border-b border-[var(--border)]">
        <p className="font-mono-brand text-[9px] uppercase tracking-[0.2em] text-dust leading-none">
          Export Your Data
        </p>
        <p className="text-[11px] text-stone mt-0.5 leading-none">
          Your data belongs to you — download it any time
        </p>
      </div>

      <div className="p-4 md:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ExportButton
          label="Download CSV"
          sublabel="All habit check-in logs"
          loading={loading === "csv"}
          onClick={() => doExport("csv")}
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5 6h8M5 9h8M5 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
        />

        <ExportButton
          label="Download PDF"
          sublabel="Print or save as PDF via browser"
          onClick={() => window.print()}
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 5V3h10v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="2" y="5" width="14" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5 15h8M6 9h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
        />

        <ExportButton
          label="Download TXT"
          sublabel="Human-readable summary"
          loading={loading === "txt"}
          onClick={() => doExport("txt")}
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="3" y="1" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6 5h6M6 8h6M6 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
        />

        <ExportButton
          label="Download ZIP"
          sublabel="CSV + TXT + JSON in one click"
          onClick={downloadAll}
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2v10M5 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
        />
      </div>
    </section>
  );
}
