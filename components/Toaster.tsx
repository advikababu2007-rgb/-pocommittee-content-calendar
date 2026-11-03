"use client";

import { useEffect, useRef, useState } from "react";
import { logger, type LogEntry } from "@/lib/logger";

const VISIBLE_MS = 6000;

/** Pops up success/error entries from the logger (entries flagged `toast`). */
export function Toaster() {
  const [visible, setVisible] = useState<LogEntry[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    let lastSeen = logger.getSnapshot()[0]?.id ?? 0;
    const pending = timers.current;

    const unsubscribe = logger.subscribe(() => {
      const all = logger.getSnapshot();
      const fresh = all.filter((e) => e.id > lastSeen && e.toast).reverse();
      lastSeen = all[0]?.id ?? lastSeen;
      if (fresh.length === 0) return;

      setVisible((v) => [...v, ...fresh].slice(-4));
      for (const entry of fresh) {
        pending.push(
          window.setTimeout(() => setVisible((v) => v.filter((x) => x.id !== entry.id)), VISIBLE_MS),
        );
      }
    });

    return () => {
      unsubscribe();
      pending.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  if (visible.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-80 flex-col gap-2" role="status" aria-live="polite">
      {visible.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur ${
            t.level === "error"
              ? "border-rose-200 bg-rose-50/95 text-rose-900"
              : "border-emerald-200 bg-emerald-50/95 text-emerald-900"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{t.message}</p>
              {t.detail && <p className="mt-0.5 break-words text-xs opacity-80">{t.detail}</p>}
            </div>
            <button
              aria-label="Dismiss"
              onClick={() => setVisible((v) => v.filter((x) => x.id !== t.id))}
              className="text-current opacity-50 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
