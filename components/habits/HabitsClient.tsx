"use client";

import { useState, useTransition, useRef } from "react";
import HabitModal, { type HabitFormData } from "./HabitModal";
import { archiveHabit, reorderHabits } from "@/app/habits/actions";
import type { HabitStatus } from "@/lib/business/habits";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HabitRow {
  id: string;
  name: string;
  icon: string;
  category: string;
  defaultWeeklyGoal: number;
  description: string;
  streak: number;
  weekCompleted: number;
  weekGoal: number;
  status: HabitStatus;
  sortOrder: number;
}

interface HabitsClientProps {
  habits: HabitRow[];
  activeCount: number;
  totalWeeklyTarget: number;
  archivedCount: number;
}

// ─── Category badge colors ────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  physical:   { bg: "#FDEEE8", text: "#C97B5F" },
  mental:     { bg: "#EEEDFE", text: "#6B64C4" },
  growth:     { bg: "#E1F5EE", text: "#178a64" },
  recovery:   { bg: "#FEF3DC", text: "#B87C1A" },
  connection: { bg: "#E6F1FB", text: "#2B6CB0" },
  creative:   { bg: "#FDEEE8", text: "#C06B8C" },
  spiritual:  { bg: "#EEEDFE", text: "#805AD5" },
  other:      { bg: "#F2F1EC", text: "#6B6A66" },
};

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<HabitStatus, { label: string; color: string }> = {
  "on-track": { label: "On track",  color: "var(--teal)" },
  "at-risk":  { label: "At risk",   color: "var(--amber)" },
  "behind":   { label: "Behind",    color: "var(--coral)" },
  "no-data":  { label: "No data",   color: "var(--dust)" },
};

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sublabel,
  progress,
}: {
  label: string;
  value: string;
  sublabel: string;
  progress: number;
}) {
  return (
    <div className="bg-surface rounded-xl border border-[var(--border)] px-4 pt-4 pb-3 flex flex-col gap-1.5 relative overflow-hidden">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-dust leading-none">
        {label}
      </p>
      <p
        className="text-[26px] md:text-[28px] font-extrabold tracking-tight leading-none"
        style={{ color: "var(--purple)" }}
      >
        {value}
      </p>
      <p className="text-[11px] text-stone leading-none">{sublabel}</p>
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-chalk">
        <div
          className="h-full transition-all duration-700"
          style={{
            width: `${Math.min(Math.max(progress, 0), 1) * 100}%`,
            background: "var(--purple)",
          }}
        />
      </div>
    </div>
  );
}

// ─── Archive confirm ──────────────────────────────────────────────────────────

function ArchiveConfirm({
  habitName,
  onConfirm,
  onCancel,
}: {
  habitName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl shadow-xl w-full max-w-xs p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
          <p className="text-[16px] font-bold text-ink">Archive &ldquo;{habitName}&rdquo;?</p>
          <p className="text-[13px] text-stone leading-relaxed">
            Archived habits are hidden from your dashboard. You can restore them later.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 h-10 rounded-lg border border-[var(--border)] text-[13px] font-semibold text-stone hover:bg-chalk transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 h-10 rounded-lg bg-[var(--coral)] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
            >
              Archive
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

const SUGGESTION_CHIPS = [
  { name: "Morning run",  icon: "🏃", category: "physical" },
  { name: "Meditation",   icon: "🧘", category: "mental" },
  { name: "Read 30 min",  icon: "📚", category: "growth" },
  { name: "Sleep 7+",     icon: "💤", category: "recovery" },
  { name: "Journaling",   icon: "✍️", category: "growth" },
  { name: "Exercise",     icon: "🏋️", category: "physical" },
  { name: "Hydration",    icon: "💊", category: "recovery" },
];

function EmptyState({ onAdd }: { onAdd: (pre?: Partial<HabitFormData>) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
      <h2 className="text-[18px] sm:text-[20px] font-extrabold text-ink tracking-tight mb-2">
        What dimensions of your life do you want to track?
      </h2>
      <p className="text-[13px] text-stone mb-6 max-w-sm">
        These are suggestions — or start from scratch.
      </p>
      <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-md">
        {SUGGESTION_CHIPS.map((chip) => (
          <button
            key={chip.name}
            onClick={() =>
              onAdd({
                name: chip.name,
                icon: chip.icon,
                category: chip.category,
                defaultWeeklyGoal: 3,
                description: "",
              })
            }
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-surface text-[13px] font-medium text-stone hover:bg-chalk hover:text-ink transition-colors"
          >
            {chip.icon} {chip.name}
          </button>
        ))}
        <button
          onClick={() => onAdd()}
          className="px-3 py-2 rounded-lg border border-[var(--border)] bg-surface text-[13px] font-medium text-stone hover:bg-chalk hover:text-ink transition-colors"
        >
          + Something else
        </button>
      </div>
      {/* Consyst note */}
      <div className="bg-surface border border-[var(--border)] rounded-xl px-5 py-4 max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-end gap-[2px]" aria-hidden>
            {[
              { h: 6,  c: "#F0997B" }, { h: 8,  c: "#EF9F27" },
              { h: 10, c: "#1D9E75" }, { h: 8,  c: "#378ADD" },
            ].map((b, i) => (
              <div key={i} className="w-[3px] rounded-full" style={{ height: b.h, background: b.c }} />
            ))}
          </div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-dust">Consyst</p>
        </div>
        <p className="font-serif text-[13px] text-stone leading-relaxed italic">
          "Be honest about your capacity. A 3× per week goal you keep is worth more than a 7× goal you break."
        </p>
      </div>
    </div>
  );
}

// ─── Drag-handle icon ─────────────────────────────────────────────────────────

function DragHandle() {
  return (
    <svg width="12" height="16" viewBox="0 0 12 16" fill="none" className="text-dust">
      {[0, 5, 10].map((cx) =>
        [2, 8, 14].map((cy) => (
          <circle key={`${cx}-${cy}`} cx={cx + 1} cy={cy} r="1.2" fill="currentColor" />
        ))
      )}
    </svg>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export default function HabitsClient({
  habits: initialHabits,
  activeCount,
  totalWeeklyTarget,
  archivedCount,
}: HabitsClientProps) {
  const [habits, setHabits] = useState<HabitRow[]>(initialHabits);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<HabitFormData | undefined>();
  const [archiveTarget, setArchiveTarget] = useState<HabitRow | null>(null);
  const [, startTransition] = useTransition();

  // Drag state
  const dragIndex = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  function openAdd(pre?: Partial<HabitFormData>) {
    setEditTarget(
      pre
        ? { name: pre.name ?? "", icon: pre.icon ?? "⭐", category: pre.category ?? "other", defaultWeeklyGoal: pre.defaultWeeklyGoal ?? 3, description: pre.description ?? "" }
        : undefined
    );
    setModalOpen(true);
  }

  function openEdit(h: HabitRow) {
    setEditTarget({
      id: h.id,
      name: h.name,
      icon: h.icon,
      category: h.category,
      defaultWeeklyGoal: h.defaultWeeklyGoal,
      description: h.description,
    });
    setModalOpen(true);
  }

  function confirmArchive() {
    if (!archiveTarget) return;
    const id = archiveTarget.id;
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setArchiveTarget(null);
    startTransition(() => archiveHabit(id));
  }

  // ── Drag-to-sort ────────────────────────────────────────────────────────────

  function onDragStart(index: number) {
    dragIndex.current = index;
  }

  function onDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    dragOverIndex.current = index;
  }

  function onDrop() {
    const from = dragIndex.current;
    const to = dragOverIndex.current;
    if (from === null || to === null || from === to) return;

    const reordered = [...habits];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setHabits(reordered);
    dragIndex.current = null;
    dragOverIndex.current = null;
    startTransition(() => reorderHabits(reordered.map((h) => h.id)));
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <HabitModal
        open={modalOpen}
        initial={editTarget}
        onClose={() => setModalOpen(false)}
      />

      {archiveTarget && (
        <ArchiveConfirm
          habitName={archiveTarget.name}
          onConfirm={confirmArchive}
          onCancel={() => setArchiveTarget(null)}
        />
      )}

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="h-14 border-b border-[var(--border)] bg-surface flex items-center justify-between px-4 md:px-5 shrink-0">
        <div>
          <p className="font-mono text-[9px] text-dust uppercase tracking-[0.18em] leading-none">
            Configure
          </p>
          <p className="text-[15px] md:text-[17px] font-extrabold text-ink tracking-tight leading-tight mt-0.5">
            Habits
          </p>
        </div>
        <button
          onClick={() => openAdd()}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-white text-[12px] sm:text-[13px] font-semibold transition-colors hover:opacity-90"
          style={{ background: "var(--purple)" }}
        >
          <span className="text-[16px] leading-none">+</span>
          <span className="hidden sm:inline">Add habit</span>
        </button>
      </div>

      {/* ── Scrollable content ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-5 pb-5 flex flex-col gap-4">

        {/* Stat cards: 3-col on md+, 2-col on sm, 1-col on xs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 shrink-0">
          <StatCard
            label="Active habits"
            value={String(activeCount)}
            sublabel={activeCount === 1 ? "habit running" : "habits running"}
            progress={Math.min(activeCount / 10, 1)}
          />
          <StatCard
            label="Total weekly target"
            value={String(totalWeeklyTarget)}
            sublabel={totalWeeklyTarget === 1 ? "check-in per week" : "check-ins per week"}
            progress={Math.min(totalWeeklyTarget / 21, 1)}
          />
          <StatCard
            label="Archived"
            value={String(archivedCount)}
            sublabel={archivedCount === 1 ? "habit archived" : "habits archived"}
            progress={Math.min(archivedCount / 10, 1)}
          />
        </div>

        {/* Table or empty state */}
        {habits.length === 0 ? (
          <EmptyState onAdd={openAdd} />
        ) : (
          <div className="bg-surface rounded-xl border border-[var(--border)] overflow-hidden">
            {/* Desktop table header */}
            <div className="hidden md:grid grid-cols-[28px_40px_1fr_110px_90px_80px_90px_90px] gap-3 items-center px-4 py-2 bg-chalk border-b border-[var(--border)]">
              {["", "", "Name", "Category", "Goal", "Streak", "This week", ""].map((h, i) => (
                <p key={i} className="font-mono text-[9px] uppercase tracking-widest text-dust">
                  {h}
                </p>
              ))}
            </div>

            {/* Rows */}
            <div>
              {habits.map((habit, index) => {
                const catColor = CATEGORY_COLORS[habit.category] ?? CATEGORY_COLORS.other;
                const status = STATUS_CONFIG[habit.status];

                return (
                  <div
                    key={habit.id}
                    draggable
                    onDragStart={() => onDragStart(index)}
                    onDragOver={(e) => onDragOver(e, index)}
                    onDrop={onDrop}
                    className="border-b border-[var(--border)] last:border-b-0 hover:bg-bg transition-colors"
                  >
                    {/* ── Desktop row ──────────────────────────── */}
                    <div className="hidden md:grid grid-cols-[28px_40px_1fr_110px_90px_80px_90px_90px] gap-3 items-center px-4 py-3">
                      {/* Drag handle */}
                      <div className="cursor-grab active:cursor-grabbing flex justify-center">
                        <DragHandle />
                      </div>

                      {/* Icon */}
                      <span className="text-[20px] leading-none">{habit.icon}</span>

                      {/* Name */}
                      <button
                        onClick={() => openEdit(habit)}
                        className="text-[13px] font-bold text-ink hover:text-[var(--purple)] transition-colors text-left truncate"
                      >
                        {habit.name}
                      </button>

                      {/* Category badge */}
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-widest w-fit"
                        style={{ background: catColor.bg, color: catColor.text }}
                      >
                        {habit.category}
                      </span>

                      {/* Goal */}
                      <p className="font-mono text-[11px] text-stone">
                        {habit.weekGoal}d / wk
                      </p>

                      {/* Streak */}
                      <p
                        className="font-mono text-[13px] font-semibold"
                        style={{ color: habit.streak > 0 ? "var(--purple)" : "var(--dust)" }}
                      >
                        {habit.streak > 0 ? `${habit.streak}d` : "—"}
                      </p>

                      {/* This week */}
                      <p className="font-mono text-[11px]" style={{ color: status.color }}>
                        {habit.weekCompleted}/{habit.weekGoal}
                        <span className="ml-1 text-[9px]">{status.label}</span>
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEdit(habit)}
                          className="h-7 px-2 rounded text-[11px] font-semibold text-stone hover:bg-chalk hover:text-ink transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setArchiveTarget(habit)}
                          className="h-7 px-2 rounded text-[11px] font-semibold text-dust hover:bg-chalk hover:text-coral transition-colors"
                        >
                          Archive
                        </button>
                      </div>
                    </div>

                    {/* ── Mobile row ───────────────────────────── */}
                    <div className="md:hidden flex items-center gap-3 px-4 py-3">
                      <div className="cursor-grab active:cursor-grabbing shrink-0">
                        <DragHandle />
                      </div>
                      <span className="text-[20px] shrink-0">{habit.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-ink truncate">{habit.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[8px] uppercase tracking-widest"
                            style={{ background: catColor.bg, color: catColor.text }}
                          >
                            {habit.category}
                          </span>
                          <span className="font-mono text-[10px] text-dust">{habit.weekGoal}d/wk</span>
                          {habit.streak > 0 && (
                            <span className="font-mono text-[10px]" style={{ color: "var(--purple)" }}>
                              {habit.streak}d streak
                            </span>
                          )}
                          <span className="font-mono text-[10px]" style={{ color: status.color }}>
                            {habit.weekCompleted}/{habit.weekGoal}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => openEdit(habit)}
                          className="h-7 px-2 rounded text-[11px] font-semibold text-stone hover:bg-chalk transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setArchiveTarget(habit)}
                          className="h-7 px-2 rounded text-[11px] font-semibold text-dust hover:text-coral transition-colors"
                        >
                          Archive
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
