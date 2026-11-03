"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

/** Route-level safety net for anything the in-page boundaries don't catch. */
export default function RouteError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    logger.error("route", error.message);
  }, [error]);

  return (
    <div className="mx-auto mt-24 max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Something went wrong</h2>
      <p className="mt-2 text-sm text-zinc-500">{error.message}</p>
      <button onClick={reset} className="mt-6 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
        Reload
      </button>
    </div>
  );
}
