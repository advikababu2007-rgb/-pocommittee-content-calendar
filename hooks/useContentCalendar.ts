"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteItem,
  fetchItems,
  insertItem,
  updateItem,
  updateLayout,
} from "@/lib/calendar-api";
import { addDays, mondayOf, todayIso } from "@/lib/dates";
import { byLayout, diffLayout, moveItem } from "@/lib/layout";
import { logger } from "@/lib/logger";
import type { ContentItem, EditableFields, SaveState } from "@/lib/types";

type Outcome = "idle" | "saved" | "error";

export function useContentCalendar() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, setPending] = useState(0);
  const [outcome, setOutcome] = useState<Outcome>("idle");

  // Always points at the latest list so async callbacks never act on stale state.
  const itemsRef = useRef<ContentItem[]>(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const commit = useCallback((next: ContentItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  /**
   * Error boundary for every write: runs `fn`, tracks the "saving" indicator,
   * logs failures, and resolves to `null` (never throws) when the save failed.
   */
  const track = useCallback(async <T,>(scope: string, fn: () => Promise<T>): Promise<T | null> => {
    setPending((p) => p + 1);
    try {
      const result = await fn();
      setOutcome("saved");
      return result;
    } catch (err) {
      setOutcome("error");
      logger.error(scope, "Save failed", err);
      return null;
    } finally {
      setPending((p) => p - 1);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const rows = await fetchItems();
      commit(rows);
      setLoadError(null);
      logger.info("load", `Loaded ${rows.length} rows`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setLoadError(message);
      logger.error("load", "Could not load calendar", err);
    } finally {
      setLoading(false);
    }
  }, [commit]);

  // Initial load. State is only set after the awaited fetch, never synchronously.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchItems();
        if (cancelled) return;
        commit(rows);
        logger.info("load", `Loaded ${rows.length} rows`);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : String(err));
        logger.error("load", "Could not load calendar", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [commit]);

  const retryLoad = useCallback(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  // ── Create ────────────────────────────────────────────────────────────────

  const addWeek = useCallback(async () => {
    const current = itemsRef.current;
    const lastWeek = current.reduce((max, i) => Math.max(max, i.week_number), 0);
    const lastDates = current.filter((i) => i.week_number === lastWeek).map((i) => i.target_date).sort();
    const target_date =
      lastWeek > 0 ? addDays(mondayOf(lastDates[0]), 7) : mondayOf(todayIso());

    const row = await track("addWeek", () =>
      insertItem({ week_number: lastWeek + 1, target_date, position: 0, status: "Idea" }),
    );
    if (!row) return;
    commit([...itemsRef.current, row].sort(byLayout));
    logger.success("addWeek", `Week ${row.week_number} created`);
  }, [commit, track]);

  const addItem = useCallback(
    async (weekNumber: number) => {
      const inWeek = itemsRef.current.filter((i) => i.week_number === weekNumber);
      const dates = inWeek.map((i) => i.target_date).sort();
      const row = await track("addItem", () =>
        insertItem({
          week_number: weekNumber,
          position: inWeek.length,
          target_date: dates.length ? mondayOf(dates[0]) : mondayOf(todayIso()),
        }),
      );
      if (!row) return;
      commit([...itemsRef.current, row].sort(byLayout));
      logger.info("addItem", `Added row to week ${weekNumber}`, { id: row.id });
    },
    [commit, track],
  );

  // ── Update / delete (optimistic with rollback) ────────────────────────────

  const updateField = useCallback(
    async (id: string, patch: Partial<EditableFields>) => {
      const before = itemsRef.current.find((i) => i.id === id);
      if (!before) return;
      commit(itemsRef.current.map((i) => (i.id === id ? { ...i, ...patch } : i)));

      const ok = await track("updateField", () => updateItem(id, patch));
      if (ok === null) {
        // Roll back only the fields we touched.
        const reverted = Object.fromEntries(
          Object.keys(patch).map((k) => [k, before[k as keyof ContentItem]]),
        );
        commit(itemsRef.current.map((i) => (i.id === id ? { ...i, ...reverted } : i)));
      }
    },
    [commit, track],
  );

  const removeItem = useCallback(
    async (id: string) => {
      const before = itemsRef.current;
      commit(before.filter((i) => i.id !== id));
      const ok = await track("removeItem", () => deleteItem(id));
      if (ok === null) commit(before);
      else logger.info("removeItem", "Row deleted", { id });
    },
    [commit, track],
  );

  // ── Drag & drop ───────────────────────────────────────────────────────────

  /** Local-only preview while dragging (no network). */
  const previewMove = useCallback(
    (activeId: string, overId: string) => commit(moveItem(itemsRef.current, activeId, overId)),
    [commit],
  );

  const restore = useCallback((snapshot: ContentItem[]) => commit(snapshot), [commit]);

  /** Persist the layout that resulted from a drag. `before` = snapshot taken at drag start. */
  const saveLayout = useCallback(
    async (before: ContentItem[]) => {
      const changes = diffLayout(before, itemsRef.current);
      if (changes.length === 0) return;

      const saved = await track("moveItem", () => updateLayout(changes));
      if (saved === null) {
        logger.error("moveItem", "Layout not saved — reverting to last known server state");
        commit(before);
        void refresh(); // reconcile with the DB in case some rows did update
      } else {
        logger.info("moveItem", `Layout saved (${saved} row${saved === 1 ? "" : "s"})`);
      }
    },
    [commit, refresh, track],
  );

  const saveState: SaveState = pending > 0 ? "saving" : outcome;

  return {
    items,
    loading,
    loadError,
    saveState,
    retryLoad,
    addWeek,
    addItem,
    updateField,
    removeItem,
    previewMove,
    restore,
    saveLayout,
  };
}
