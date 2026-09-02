"use client";

import { useState, useTransition, useRef } from "react";

interface Props {
  title: string;
  subtitle: string;
  accent: "teal" | "amber";
  monthKey: string;
  initialItems: string[];
  placeholder: string;
  saveAction: (monthKey: string, items: string[]) => Promise<void>;
}

export default function ReflectListCard({
  title,
  subtitle,
  accent,
  monthKey,
  initialItems,
  placeholder,
  saveAction,
}: Props) {
  const [items, setItems] = useState<string[]>(
    initialItems.length > 0 ? initialItems : [""],
  );
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const color       = accent === "teal" ? "var(--teal)"    : "var(--amber)";
  const colorLt     = accent === "teal" ? "var(--teal-lt)" : "var(--amber-lt)";
  const borderColor = accent === "teal" ? "#1D9E75"        : "#EF9F27";

  const isSaved = savedAt !== null && Date.now() - savedAt < 2000;

  function update(index: number, value: string) {
    setItems((prev) => prev.map((v, i) => (i === index ? value : v)));
  }

  function remove(index: number) {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [""];
    });
  }

  function addItem() {
    setItems((prev) => [...prev, ""]);
    // Focus the new input after render
    setTimeout(() => {
      const last = inputRefs.current[items.length];
      last?.focus();
    }, 30);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (index === items.length - 1) {
        addItem();
      } else {
        inputRefs.current[index + 1]?.focus();
      }
    }
    if (e.key === "Backspace" && items[index] === "" && items.length > 1) {
      e.preventDefault();
      remove(index);
      setTimeout(() => inputRefs.current[Math.max(0, index - 1)]?.focus(), 30);
    }
  }

  function save() {
    const filtered = items.map((s) => s.trim()).filter(Boolean);
    startTransition(async () => {
      await saveAction(monthKey, filtered);
      setSavedAt(Date.now());
    });
  }

  return (
    <div
      className="bg-surface rounded-xl border flex flex-col overflow-hidden"
      style={{ borderColor }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between shrink-0"
        style={{ background: colorLt }}
      >
        <div>
          <p
            className="font-mono-brand text-[9px] uppercase tracking-[0.2em] leading-none"
            style={{ color }}
          >
            {title}
          </p>
          <p className="text-[11px] text-stone mt-0.5 leading-none">{subtitle}</p>
        </div>
        <button
          onClick={save}
          disabled={isPending}
          className="text-[11px] font-semibold px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
          style={{ background: color, color: "#fff" }}
        >
          {isPending ? "Saving…" : isSaved ? "Saved ✓" : "Save"}
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 flex flex-col gap-1 p-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 group">
            {/* Bullet */}
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0 mt-[1px]"
              style={{ background: color }}
            />
            <input
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              value={item}
              onChange={(e) => update(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              placeholder={placeholder}
              className="flex-1 text-[13px] text-ink bg-transparent outline-none placeholder:text-dust py-1 border-b border-transparent focus:border-[var(--border)] transition-colors"
            />
            {/* Remove */}
            {(items.length > 1 || item !== "") && (
              <button
                onClick={() => remove(i)}
                className="opacity-0 group-hover:opacity-100 text-dust hover:text-coral transition-opacity"
                aria-label="Remove item"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor"
                    strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        ))}

        {/* Add button */}
        <button
          onClick={addItem}
          className="mt-1 flex items-center gap-1.5 text-[11px] font-medium transition-colors self-start"
          style={{ color }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Add item
        </button>
      </div>
    </div>
  );
}
