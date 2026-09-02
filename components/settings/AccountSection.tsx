"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/settings/actions";

// Curated IANA timezone list
const TIMEZONES = [
  "UTC",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Phoenix", "America/Anchorage", "America/Honolulu",
  "America/Toronto", "America/Vancouver", "America/Mexico_City",
  "America/Sao_Paulo", "America/Argentina/Buenos_Aires", "America/Santiago",
  "America/Bogota", "America/Lima",
  "Europe/London", "Europe/Dublin", "Europe/Lisbon",
  "Europe/Paris", "Europe/Berlin", "Europe/Rome", "Europe/Madrid",
  "Europe/Amsterdam", "Europe/Brussels", "Europe/Stockholm",
  "Europe/Oslo", "Europe/Helsinki", "Europe/Warsaw", "Europe/Prague",
  "Europe/Budapest", "Europe/Bucharest", "Europe/Athens", "Europe/Istanbul",
  "Europe/Moscow", "Europe/Kiev",
  "Africa/Cairo", "Africa/Johannesburg", "Africa/Lagos", "Africa/Nairobi",
  "Asia/Dubai", "Asia/Karachi", "Asia/Kolkata", "Asia/Dhaka",
  "Asia/Kathmandu", "Asia/Bangkok", "Asia/Singapore", "Asia/Manila",
  "Asia/Tokyo", "Asia/Seoul", "Asia/Shanghai", "Asia/Hong_Kong", "Asia/Taipei",
  "Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane", "Australia/Perth",
  "Pacific/Auckland", "Pacific/Fiji", "Pacific/Honolulu",
];

interface Props {
  initialName: string;
  email: string;
  initialTimezone: string;
}

export default function AccountSection({ initialName, email, initialTimezone }: Props) {
  const [name, setName]         = useState(initialName);
  const [timezone, setTimezone] = useState(
    TIMEZONES.includes(initialTimezone) ? initialTimezone : "UTC",
  );
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt]        = useState<number | null>(null);

  const isSaved = savedAt !== null && Date.now() - savedAt < 2500;

  function save() {
    const fd = new FormData();
    fd.set("name", name);
    fd.set("timezone", timezone);
    startTransition(async () => {
      await updateProfile(fd);
      setSavedAt(Date.now());
    });
  }

  const inputCls =
    "w-full text-[14px] text-ink bg-chalk rounded-lg px-3 py-2.5 outline-none " +
    "focus:ring-2 focus:ring-[var(--teal)] focus:ring-opacity-30 transition-shadow";

  return (
    <section className="bg-surface rounded-xl border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-5 py-3 bg-chalk border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <p className="font-mono-brand text-[9px] uppercase tracking-[0.2em] text-dust leading-none">
            Account
          </p>
          <p className="text-[11px] text-stone mt-0.5 leading-none">
            Your profile and preferences
          </p>
        </div>
        <button
          onClick={save}
          disabled={isPending}
          className="text-[11px] font-semibold px-3 py-1 rounded-lg text-white transition-opacity disabled:opacity-50"
          style={{ background: "var(--teal)" }}
        >
          {isPending ? "Saving…" : isSaved ? "Saved ✓" : "Save"}
        </button>
      </div>

      {/* Fields */}
      <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {/* Display name */}
        <div>
          <label className="font-mono-brand text-[9px] uppercase tracking-[0.2em] text-dust block mb-1.5">
            Display Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            maxLength={100}
            className={inputCls}
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="font-mono-brand text-[9px] uppercase tracking-[0.2em] text-dust block mb-1.5">
            Email
          </label>
          <div className="w-full text-[14px] text-stone bg-chalk rounded-lg px-3 py-2.5 cursor-not-allowed truncate">
            {email}
          </div>
          <p className="text-[10px] text-dust mt-1 leading-snug">
            Email is managed through your auth provider.
          </p>
        </div>

        {/* Timezone */}
        <div className="md:col-span-2">
          <label className="font-mono-brand text-[9px] uppercase tracking-[0.2em] text-dust block mb-1.5">
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className={inputCls + " cursor-pointer"}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-dust mt-1 leading-snug">
            Used to determine "today" for check-ins and date calculations.
          </p>
        </div>
      </div>
    </section>
  );
}
