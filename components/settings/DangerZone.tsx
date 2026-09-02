"use client";

import { useState, useTransition } from "react";
import { resetUserData, deleteAccount } from "@/app/settings/actions";

type Dialog = "reset" | "delete" | null;

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmWord: string;
  buttonLabel: string;
  buttonColor: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function ConfirmDialog({
  title,
  description,
  confirmWord,
  buttonLabel,
  buttonColor,
  onConfirm,
  onCancel,
  isPending,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  const confirmed = typed === confirmWord;

  return (
    <div className="mt-4 border border-[var(--border)] rounded-xl p-4 bg-[var(--bg)]">
      <p className="text-[13px] font-semibold text-ink mb-1">{title}</p>
      <p className="text-[12px] text-stone leading-relaxed mb-4">{description}</p>

      <label className="font-mono-brand text-[9px] uppercase tracking-[0.2em] text-dust block mb-1.5">
        Type <span className="text-ink font-bold">{confirmWord}</span> to confirm
      </label>
      <input
        type="text"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder={confirmWord}
        autoFocus
        className="w-full text-[13px] text-ink bg-surface rounded-lg px-3 py-2 border border-[var(--border)] outline-none focus:border-[var(--border-md)] transition-colors mb-3"
      />

      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={!confirmed || isPending}
          className="flex-1 py-2 rounded-lg text-[13px] font-semibold text-white transition-opacity disabled:opacity-30"
          style={{ background: buttonColor }}
        >
          {isPending ? "Working…" : buttonLabel}
        </button>
        <button
          onClick={onCancel}
          disabled={isPending}
          className="flex-1 py-2 rounded-lg text-[13px] font-semibold text-stone bg-chalk hover:bg-[var(--border)] transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

interface DangerRowProps {
  label: string;
  description: string;
  buttonLabel: string;
  buttonColor: string;
  onClick: () => void;
}

function DangerRow({ label, description, buttonLabel, buttonColor, onClick }: DangerRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <p className="text-[14px] font-semibold text-ink leading-tight">{label}</p>
        <p className="text-[12px] text-stone mt-0.5 leading-snug">{description}</p>
      </div>
      <button
        onClick={onClick}
        className="shrink-0 px-4 py-2 rounded-lg text-[12px] font-semibold text-white sm:self-start transition-opacity"
        style={{ background: buttonColor }}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

export default function DangerZone() {
  const [open, setOpen]                     = useState<Dialog>(null);
  const [resetPending, startReset]          = useTransition();
  const [deletePending, startDelete]        = useTransition();

  function handleReset() {
    startReset(async () => {
      await resetUserData();
    });
  }

  function handleDelete() {
    startDelete(async () => {
      await deleteAccount();
    });
  }

  return (
    <section className="bg-surface rounded-xl border border-[var(--coral)] overflow-hidden">
      {/* Header */}
      <div
        className="px-4 md:px-5 py-3 border-b"
        style={{ background: "var(--coral-lt)", borderColor: "var(--coral)" }}
      >
        <p
          className="font-mono-brand text-[9px] uppercase tracking-[0.2em] leading-none"
          style={{ color: "var(--coral)" }}
        >
          Danger Zone
        </p>
        <p className="text-[11px] text-stone mt-0.5 leading-none">
          These actions are permanent and cannot be undone
        </p>
      </div>

      <div className="p-4 md:p-5 flex flex-col gap-5">
        {/* Reset data */}
        <div>
          <DangerRow
            label="Reset all data"
            description="Deletes all habits, logs, reflections, and goals. Your account is kept."
            buttonLabel="Reset data"
            buttonColor="var(--amber)"
            onClick={() => setOpen(open === "reset" ? null : "reset")}
          />
          {open === "reset" && (
            <ConfirmDialog
              title="This will permanently delete all your tracking data."
              description="Habits, check-in logs, weekly goals, reflections, notes, and milestones will all be erased. Your account (name, email, timezone) will remain. This cannot be undone."
              confirmWord="RESET"
              buttonLabel="Yes, reset everything"
              buttonColor="var(--amber)"
              isPending={resetPending}
              onConfirm={handleReset}
              onCancel={() => setOpen(null)}
            />
          )}
        </div>

        <div className="border-t border-[var(--border)]" />

        {/* Delete account */}
        <div>
          <DangerRow
            label="Delete account"
            description="Permanently deletes your account and all associated data."
            buttonLabel="Delete account"
            buttonColor="var(--coral)"
            onClick={() => setOpen(open === "delete" ? null : "delete")}
          />
          {open === "delete" && (
            <ConfirmDialog
              title="This will permanently delete your account and all data."
              description="Every habit, log, reflection, goal, and note will be erased. Your Consyst account will be gone. You will be signed out immediately. This cannot be undone."
              confirmWord="DELETE"
              buttonLabel="Yes, delete my account"
              buttonColor="var(--coral)"
              isPending={deletePending}
              onConfirm={handleDelete}
              onCancel={() => setOpen(null)}
            />
          )}
        </div>
      </div>
    </section>
  );
}
