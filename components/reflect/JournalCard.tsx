"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { saveJournal } from "@/app/reflect/actions";

interface Props {
  monthKey: string;
  initialText: string;
}

export default function JournalCard({ monthKey, initialText }: Props) {
  const [text, setText] = useState(initialText);
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize on mount and content change
  function resize() {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }

  useEffect(() => {
    resize();
  }, [text]);

  const isSaved = savedAt !== null && Date.now() - savedAt < 2000;

  function save() {
    startTransition(async () => {
      await saveJournal(monthKey, text.trim());
      setSavedAt(Date.now());
    });
  }

  function handleBlur() {
    if (text.trim() !== initialText.trim()) save();
  }

  return (
    <div className="bg-surface rounded-xl border border-[var(--border)] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 md:px-5 py-3 border-b border-[var(--border)] flex items-center justify-between shrink-0">
        <div>
          <p className="font-mono-brand text-[9px] uppercase tracking-[0.2em] text-dust leading-none">
            Journal
          </p>
          <p className="text-[11px] text-stone mt-0.5 leading-none">
            Write freely about this month
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

      {/* Textarea */}
      <div className="p-4 md:p-5">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          placeholder="What happened this month? How did it feel? What did you learn? Write without editing yourself — this is just for you."
          rows={8}
          style={{ resize: "none", overflow: "hidden" }}
          className="w-full font-serif-brand text-[15px] md:text-[16px] text-ink leading-relaxed bg-transparent outline-none placeholder:text-dust placeholder:font-sans placeholder:text-[13px] placeholder:not-italic"
        />
      </div>

      {/* Footer: char count */}
      <div className="px-4 md:px-5 pb-3 flex justify-end">
        <span className="font-mono-brand text-[9px] text-dust">
          {text.length} {text.length === 1 ? "char" : "chars"}
        </span>
      </div>
    </div>
  );
}
