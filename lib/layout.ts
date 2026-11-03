import { arrayMove } from "@dnd-kit/sortable";
import { addDays } from "./dates";
import type { ContentItem } from "./types";

export const WEEK_PREFIX = "week-";
export const weekDropId = (week: number) => `${WEEK_PREFIX}${week}`;

export interface WeekGroup {
  week_number: number;
  items: ContentItem[];
}

export const byLayout = (a: ContentItem, b: ContentItem) =>
  a.week_number - b.week_number || a.position - b.position;

export function groupByWeek(items: ContentItem[], pinnedWeeks: number[] = []): WeekGroup[] {
  const map = new Map<number, ContentItem[]>();
  for (const w of pinnedWeeks) map.set(w, []); // keep emptied weeks visible mid-drag
  for (const item of [...items].sort(byLayout)) {
    const list = map.get(item.week_number) ?? [];
    list.push(item);
    map.set(item.week_number, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([week_number, list]) => ({ week_number, items: list }));
}

/** Resolve a dnd-kit id (item id OR week-drop id) to a week number. */
export function weekOf(items: ContentItem[], id: string): number | null {
  if (id.startsWith(WEEK_PREFIX)) {
    const n = Number(id.slice(WEEK_PREFIX.length));
    return Number.isInteger(n) ? n : null;
  }
  return items.find((i) => i.id === id)?.week_number ?? null;
}

const renumber = (list: ContentItem[]): ContentItem[] =>
  list.map((item, position) => (item.position === position ? item : { ...item, position }));

/**
 * Pure function: returns a new array with `activeId` moved next to `overId`
 * (an item) or to the end of a week (a week-drop id).
 * Cross-week moves shift target_date by whole weeks so the weekday is preserved.
 */
export function moveItem(items: ContentItem[], activeId: string, overId: string): ContentItem[] {
  const active = items.find((i) => i.id === activeId);
  const targetWeek = weekOf(items, overId);
  if (!active || targetWeek === null || activeId === overId) return items;

  const overIsWeek = overId.startsWith(WEEK_PREFIX);
  const fromWeek = active.week_number;
  const inWeek = (w: number) => items.filter((i) => i.week_number === w).sort(byLayout);

  let nextFrom: ContentItem[];
  let nextTarget: ContentItem[];

  if (fromWeek === targetWeek) {
    if (overIsWeek) return items; // hovering a week's empty space inside the same week: nothing to reorder
    const list = inWeek(fromWeek);
    const oldIndex = list.findIndex((i) => i.id === activeId);
    const newIndex = list.findIndex((i) => i.id === overId);
    if (newIndex < 0 || oldIndex === newIndex) return items;
    nextTarget = renumber(arrayMove(list, oldIndex, newIndex));
    nextFrom = nextTarget;
  } else {
    const source = inWeek(fromWeek).filter((i) => i.id !== activeId);
    const target = inWeek(targetWeek);
    const insertAt = overIsWeek ? target.length : Math.max(0, target.findIndex((i) => i.id === overId));
    const moved: ContentItem = {
      ...active,
      week_number: targetWeek,
      target_date: addDays(active.target_date, (targetWeek - fromWeek) * 7),
    };
    nextFrom = renumber(source);
    nextTarget = renumber([...target.slice(0, insertAt), moved, ...target.slice(insertAt)]);
  }

  const untouched = items.filter((i) => i.week_number !== fromWeek && i.week_number !== targetWeek);
  const merged = fromWeek === targetWeek ? nextTarget : [...nextFrom, ...nextTarget];
  return [...untouched, ...merged].sort(byLayout);
}

export interface LayoutChange {
  id: string;
  week_number: number;
  position: number;
  target_date: string;
}

/** Rows whose placement differs between two snapshots — the only ones we write. */
export function diffLayout(before: ContentItem[], after: ContentItem[]): LayoutChange[] {
  const prev = new Map(before.map((i) => [i.id, i]));
  const changes: LayoutChange[] = [];
  for (const next of after) {
    const old = prev.get(next.id);
    if (
      !old ||
      old.week_number !== next.week_number ||
      old.position !== next.position ||
      old.target_date !== next.target_date
    ) {
      changes.push({
        id: next.id,
        week_number: next.week_number,
        position: next.position,
        target_date: next.target_date,
      });
    }
  }
  return changes;
}
