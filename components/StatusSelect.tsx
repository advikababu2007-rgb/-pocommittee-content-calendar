"use client";

import { STATUSES, isStatus, type Status } from "@/lib/types";

const STYLES: Record<Status, string> = {
  Idea: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  Drafting: "bg-amber-50 text-amber-800 ring-amber-200",
  "In Review": "bg-violet-50 text-violet-800 ring-violet-200",
  Scheduled: "bg-sky-50 text-sky-800 ring-sky-200",
  Published: "bg-emerald-50 text-emerald-800 ring-emerald-200",
};

export function StatusSelect({
  value,
  onChange,
}: {
  value: Status;
  onChange: (next: Status) => void;
}) {
  return (
    <select
      value={value}
      aria-label="Status"
      onChange={(e) => isStatus(e.target.value) && onChange(e.target.value)}
      className={`w-full cursor-pointer appearance-none rounded-full px-3 py-1.5 text-center text-xs font-medium ring-1 ring-inset outline-none transition focus:ring-2 ${STYLES[value]}`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
