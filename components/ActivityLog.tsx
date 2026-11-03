"use client";

import { useState } from "react";
import { useLogEntries } from "@/lib/logger";

const DOT = {
  info: "bg-zinc-300",
  success: "bg-emerald-500",
  error: "bg-rose-500",
} as const;

/** Collapsible, human-readable trail of every load / save / layout status. */
export function ActivityLog() {
  const entries = useLogEntries();
  const [open, setOpen] = useState(false);
  const errorCount = entries.filter((e) => e.level === "error").length;

  return (
    <section className="mt-10 rounded-2xl border border-zinc-200 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-zinc-700"
        aria-expanded={open}
      >
        <span>
          Activity log
          <span className="ml-2 text-xs font-normal text-zinc-400">
            {entries.length} events{errorCount > 0 && ` · ${errorCount} errors`}
          </span>
        </span>
        <span className="text-zinc-400">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <ul className="max-h-64 divide-y divide-zinc-100 overflow-y-auto border-t border-zinc-100 font-mono text-xs">
          {entries.length === 0 && <li className="px-5 py-4 text-zinc-400">Nothing logged yet.</li>}
          {entries.map((e) => (
            <li key={e.id} className="flex items-start gap-3 px-5 py-2">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[e.level]}`} />
              <span className="shrink-0 text-zinc-400">{new Date(e.at).toLocaleTimeString()}</span>
              <span className="shrink-0 text-zinc-500">{e.scope}</span>
              <span className="text-zinc-800">
                {e.message}
                {e.detail && <span className="text-zinc-400"> — {e.detail}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
