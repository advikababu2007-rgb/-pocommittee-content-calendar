"use client";

import { useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useContentCalendar } from "@/hooks/useContentCalendar";
import { groupByWeek, weekOf, WEEK_PREFIX } from "@/lib/layout";
import type { ContentItem } from "@/lib/types";
import { ActivityLog } from "./ActivityLog";
import { ErrorBoundary } from "./ErrorBoundary";
import { RowGhost } from "./ItemRow";
import { SaveIndicator } from "./SaveIndicator";
import { Toaster } from "./Toaster";
import { WeekSection } from "./WeekSection";

/** Prefer the row under the pointer over the week container that wraps it. */
const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  if (hits.length === 0) return closestCenter(args); // keyboard dragging has no pointer
  const rows = hits.filter((h) => !String(h.id).startsWith(WEEK_PREFIX));
  return rows.length > 0 ? rows : hits;
};

export function CalendarDashboard() {
  const cal = useContentCalendar();
  const [addingWeek, setAddingWeek] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pinnedWeeks, setPinnedWeeks] = useState<number[]>([]);
  const snapshot = useRef<ContentItem[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const weeks = useMemo(() => groupByWeek(cal.items, pinnedWeeks), [cal.items, pinnedWeeks]);
  const activeItem = activeId ? cal.items.find((i) => i.id === activeId) ?? null : null;
  const published = cal.items.filter((i) => i.status === "Published").length;

  const handleAddWeek = async () => {
    setAddingWeek(true);
    try {
      await cal.addWeek(); // errors are caught + logged inside the hook
    } finally {
      setAddingWeek(false);
    }
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    snapshot.current = cal.items;
    setActiveId(String(active.id));
    setPinnedWeeks([...new Set(cal.items.map((i) => i.week_number))]); // keep emptied weeks droppable
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const a = String(active.id);
    const o = String(over.id);
    const from = weekOf(cal.items, a);
    const to = weekOf(cal.items, o);
    if (from === null || to === null || from === to) return;
    cal.previewMove(a, o); // hop across weeks live, same-week sorting is handled by dnd-kit
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    setPinnedWeeks([]);
    if (over) cal.previewMove(String(active.id), String(over.id));
    void cal.saveLayout(snapshot.current);
  };

  const onDragCancel = () => {
    setActiveId(null);
    setPinnedWeeks([]);
    cal.restore(snapshot.current);
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Content Calendar</h1>
            <p className="text-sm text-zinc-500">Plan, assign and ship weekly content.</p>
          </div>
          <div className="flex items-center gap-5">
            <SaveIndicator state={cal.saveState} />
            <button
              onClick={handleAddWeek}
              disabled={addingWeek || cal.loading || cal.loadError !== null}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {addingWeek ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <span className="text-base leading-none">+</span>
              )}
              Add New Week
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <dl className="mb-8 grid grid-cols-3 gap-4">
          {[
            ["Weeks", weeks.length],
            ["Items", cal.items.length],
            ["Published", published],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">{value}</dd>
            </div>
          ))}
        </dl>

        {cal.loading && (
          <div className="space-y-4" aria-busy>
            {[0, 1].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
            ))}
          </div>
        )}

        {!cal.loading && cal.loadError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900">
            <p className="font-semibold">Couldn’t load your calendar</p>
            <p className="mt-1 break-words text-rose-800/80">{cal.loadError}</p>
            <button
              onClick={cal.retryLoad}
              className="mt-4 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-500"
            >
              Retry
            </button>
          </div>
        )}

        {!cal.loading && !cal.loadError && weeks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
            <p className="text-base font-semibold text-zinc-900">No weeks planned yet</p>
            <p className="mt-1 text-sm text-zinc-500">Click “Add New Week” to start your first content week.</p>
          </div>
        )}

        {!cal.loading && !cal.loadError && weeks.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDragCancel={onDragCancel}
          >
            <div className="space-y-6">
              {weeks.map((week) => (
                <ErrorBoundary key={week.week_number} scope={`week-${week.week_number}`} compact>
                  <WeekSection
                    weekNumber={week.week_number}
                    items={week.items}
                    onAddItem={cal.addItem}
                    onUpdate={cal.updateField}
                    onRemove={cal.removeItem}
                  />
                </ErrorBoundary>
              ))}
            </div>
            <DragOverlay dropAnimation={{ duration: 180 }}>
              {activeItem ? <RowGhost item={activeItem} /> : null}
            </DragOverlay>
          </DndContext>
        )}

        <ActivityLog />
      </main>

      <Toaster />
    </div>
  );
}
