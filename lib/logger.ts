"use client";

import { useSyncExternalStore } from "react";

export type LogLevel = "info" | "success" | "error";

export interface LogEntry {
  id: number;
  at: string; // ISO timestamp
  level: LogLevel;
  scope: string; // e.g. "addWeek", "moveItem", "ErrorBoundary"
  message: string;
  detail?: string;
  toast: boolean;
}

const MAX_ENTRIES = 100;
let entries: LogEntry[] = [];
let counter = 0;
const listeners = new Set<() => void>();
const EMPTY: LogEntry[] = [];

function describe(detail: unknown): string | undefined {
  if (detail === undefined) return undefined;
  if (detail instanceof Error) return detail.message;
  if (typeof detail === "string") return detail;
  try {
    return JSON.stringify(detail);
  } catch {
    return String(detail);
  }
}

function push(level: LogLevel, scope: string, message: string, detail?: unknown, toast = false) {
  const entry: LogEntry = {
    id: ++counter,
    at: new Date().toISOString(),
    level,
    scope,
    message,
    detail: describe(detail),
    toast,
  };
  entries = [entry, ...entries].slice(0, MAX_ENTRIES); // new array → useSyncExternalStore sees the change

  const line = `[content-calendar][${scope}] ${message}`;
  if (level === "error") console.error(line, detail ?? "");
  else console.info(line, detail ?? "");

  listeners.forEach((l) => l());
}

export const logger = {
  info: (scope: string, message: string, detail?: unknown) => push("info", scope, message, detail),
  success: (scope: string, message: string, detail?: unknown) => push("success", scope, message, detail, true),
  error: (scope: string, message: string, detail?: unknown) => push("error", scope, message, detail, true),
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => entries,
};

export function useLogEntries(): LogEntry[] {
  return useSyncExternalStore(logger.subscribe, logger.getSnapshot, () => EMPTY);
}
