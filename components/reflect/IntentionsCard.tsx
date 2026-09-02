"use client";

import { useState, useTransition, useRef } from "react";
import { saveIntentions } from "@/app/reflect/actions";

interface Props {
  monthKey: string;
  initialItems: string[];
}

export default function IntentionsCard({ monthKey, initialItems }: Props) {
  const [items, setItems] = useState<string[]>(
    initialItems.length > 0 ? initialItems : [""],
  );
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
    setTimeout(() => {
      inputRefs.current[items.length]?.focus();
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
      await saveIntentions(monthKey, filtered);
      setSavedAt(Date.now());
    });
  }

  return (
    <div className="bg-surface rounded-xl border border-[var(--border)] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 md:px-5 py-3 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-chalk">
        <div>
          <p className="font-mono-brand text-[9px] uppercase tracking-[0.2em] text-dust leading-none">
            Next Month Intentions
          </p>
          <p className="text-[11px] text-stone mt-0.5 leading-none">
            What will you commit to next month?
          </p>
        </div>
        <button
          onClick={save}
          disabled={isPending}
          className="text-[11px] font-semibold px-3 py-1 rounded-lg bg-ink text-white transition-opacity disabled:opacity-50"
        >
          {isPending ? "Saving…" : isSaved ? "Saved ✓" : "Save"}
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-1 p-4 md:p-5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 group">
            {/* Number */}
            <span className="font-mono-brand text-[11px] text-dust w-4 text-right shrink-0">
              {i + 1}.
            </span>
            <input
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              value={item}
              onChange={(e) => update(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              placeholder={`Intention ${i + 1}`}
              className="flex-1 text-[14px] font-medium text-ink bg-transparent outline-none placeholder:text-dust placeholder:font-normal py-1.5 border-b border-transparent focus:border-[var(--border)] transition-colors"
            />
            {/* Remove */}
            {(items.length > 1 || item !== "") && (
              <button
                onClick={() => remove(i)}
                className="opacity-0 group-hover:opacity-100 text-dust hover:text-coral transition-opacity shrink-0"
                aria-label="Remove intention"
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
          className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-stone hover:text-ink transition-colors self-start"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Add intention
        </button>
      </div>

      {/* Prompt */}
      <div className="mx-4 md:mx-5 mb-4 md:mb-5 px-4 py-3 rounded-lg bg-chalk">
        <p className="font-serif-brand text-[13px] text-stone leading-relaxed italic">
          "An intention is not a goal with a deadline — it is a direction you choose to move in."
        </p>
      </div>
    </div>
  );
}
