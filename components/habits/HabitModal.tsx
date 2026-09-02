"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createHabit, updateHabit } from "@/app/habits/actions";

// ─── Constants ────────────────────────────────────────────────────────────────

const ICONS = [
  "🏃", "🏋️", "🚴", "🤸",
  "🧘", "💤", "🥗", "💊",
  "📚", "✍️", "🎵", "🎨",
  "🤝", "💬", "💚", "⭐",
];

const CATEGORIES = [
  { value: "physical",   label: "Physical" },
  { value: "mental",     label: "Mental" },
  { value: "growth",     label: "Growth" },
  { value: "recovery",   label: "Recovery" },
  { value: "connection", label: "Connection" },
  { value: "creative",   label: "Creative" },
  { value: "spiritual",  label: "Spiritual" },
  { value: "other",      label: "Other" },
];


// ─── Types ────────────────────────────────────────────────────────────────────

export interface HabitFormData {
  id?: string;
  name: string;
  icon: string;
  category: string;
  defaultWeeklyGoal: number;
  description: string;
}

interface HabitModalProps {
  open: boolean;
  initial?: HabitFormData;
  onClose: () => void;
}

// ─── WeeklyGoalSelector ───────────────────────────────────────────────────────

function WeeklyGoalSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex gap-1.5 sm:gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => {
          const active = n === value;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className="flex-1 h-9 sm:h-10 rounded-lg flex items-center justify-center font-mono text-[13px] font-semibold transition-all"
              style={{
                background: active ? "var(--purple)" : "var(--surface)",
                color: active ? "#fff" : "var(--stone)",
                border: active ? "none" : "1.5px solid var(--border)",
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 font-mono text-[10px] text-stone tracking-wide">
        {value} {value === 1 ? "day" : "days"} / week
      </p>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function HabitModal({ open, initial, onClose }: HabitModalProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("⭐");
  const [category, setCategory] = useState("other");
  const [goal, setGoal] = useState(3);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);

  // Populate form when opening
  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setIcon(initial?.icon ?? "⭐");
      setCategory(initial?.category ?? "other");
      setGoal(initial?.defaultWeeklyGoal ?? 3);
      setDescription(initial?.description ?? "");
      setError("");
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [open, initial]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const isEdit = Boolean(initial?.id);
  const title = isEdit ? "Edit habit" : "Add habit";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Habit name is required."); return; }
    setError("");

    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("icon", icon);
    fd.set("category", category);
    fd.set("defaultWeeklyGoal", String(goal));
    fd.set("description", description);

    startTransition(async () => {
      if (isEdit && initial?.id) {
        await updateHabit(initial.id, fd);
      } else {
        await createHabit(fd);
      }
      onClose();
    });
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <div
          className="
            w-full sm:w-full sm:max-w-lg
            bg-surface
            rounded-t-2xl sm:rounded-2xl
            shadow-xl
            flex flex-col
            max-h-[92vh] sm:max-h-[90vh]
            overflow-hidden
          "
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
            <h2 className="text-[17px] font-extrabold text-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-chalk transition-colors text-stone"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Scrollable body */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto px-5 py-5 space-y-5"
          >
            {/* Name */}
            <div>
              <label className="block text-[13px] font-semibold text-ink mb-1.5">
                Habit name
              </label>
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                placeholder="e.g. Morning run, Read, Meditation"
                className="w-full h-11 px-4 rounded-lg border border-[var(--border)] bg-bg text-ink text-[14px] placeholder:text-dust focus:outline-none focus:border-[var(--purple)] transition-colors"
              />
              {error && (
                <p className="mt-1 text-[12px] text-coral">{error}</p>
              )}
            </div>

            {/* Icon grid */}
            <div>
              <label className="block text-[13px] font-semibold text-ink mb-2">
                Choose an icon
              </label>
              <div className="grid grid-cols-8 gap-1.5">
                {ICONS.map((em) => {
                  const selected = icon === em;
                  return (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setIcon(em)}
                      className="aspect-square flex items-center justify-center rounded-lg text-[20px] transition-all"
                      style={{
                        background: selected ? "var(--purple-lt)" : "var(--chalk)",
                        border: selected ? "2px solid var(--purple)" : "2px solid transparent",
                      }}
                    >
                      {em}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[13px] font-semibold text-ink mb-1.5">
                Category
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 pl-4 pr-9 rounded-lg border border-[var(--border)] bg-bg text-ink text-[14px] appearance-none focus:outline-none focus:border-[var(--purple)] transition-colors cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dust pointer-events-none"
                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                >
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* Weekly goal */}
            <div>
              <label className="block text-[13px] font-semibold text-ink mb-2">
                Weekly goal
              </label>
              <WeeklyGoalSelector value={goal} onChange={setGoal} />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[13px] font-semibold text-ink mb-1.5">
                Description{" "}
                <span className="font-normal text-dust">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Add notes about this habit — why it matters, how you'll do it, etc."
                className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-bg text-ink text-[13px] placeholder:text-dust resize-none focus:outline-none focus:border-[var(--purple)] transition-colors leading-relaxed"
              />
            </div>
          </form>

          {/* Footer */}
          <div className="shrink-0 flex gap-2 px-5 py-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-lg border border-[var(--border)] text-ink text-[13px] font-semibold hover:bg-chalk transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form=""
              disabled={pending}
              onClick={handleSubmit}
              className="flex-[2] h-11 rounded-lg text-white text-[13px] font-semibold transition-colors disabled:opacity-60"
              style={{ background: "var(--purple)" }}
            >
              {pending
                ? isEdit ? "Saving…" : "Adding…"
                : isEdit ? "Save habit" : "Add habit"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
