"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { formatWeekRange, mondayOf } from "@/lib/dates";
import { weekDropId } from "@/lib/layout";
import type { ContentItem, EditableFields } from "@/lib/types";
import { ROW_GRID, TABLE_MIN_WIDTH } from "./grid";
import { ItemRow } from "./ItemRow";

interface Props {
  weekNumber: number;
  items: ContentItem[];
  onAddItem: (week: number) => void;
  onUpdate: (id: string, patch: Partial<EditableFields>) => void;
  onRemove: (id: string) => void;
}

const COLUMNS = ["", "Requirement", "Topic / idea", "Assignee", "Status", "Target date", ""];

export function WeekSection({ weekNumber, items, onAddItem, onUpdate, onRemove }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: weekDropId(weekNumber) });

  const firstDate = items.map((i) => i.target_date).sort()[0];
  const range = firstDate ? formatWeekRange(mondayOf(firstDate)) : "No dates yet";

  return (
    <section
      ref={setNodeRef}
      aria-label={`Week ${weekNumber}`}
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
        isOver ? "border-indigo-300 ring-4 ring-indigo-50" : "border-zinc-200"
      }`}
    >
      <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
            Week {weekNumber}
          </span>
          <span className="text-sm text-zinc-500">{range}</span>
          <span className="text-xs text-zinc-400">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </div>
        <button
          onClick={() => onAddItem(weekNumber)}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
        >
          + Add row
        </button>
      </header>

      <div className="overflow-x-auto">
        <div className={TABLE_MIN_WIDTH}>
          <div className={`${ROW_GRID} bg-zinc-50/70 py-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400`}>
            {COLUMNS.map((c, i) => (
              <span key={i} className={i === 1 || i === 2 || i === 3 ? "px-2" : ""}>
                {c}
              </span>
            ))}
          </div>

          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((item) => (
              <ItemRow key={item.id} item={item} onUpdate={onUpdate} onRemove={onRemove} />
            ))}
          </SortableContext>

          {items.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-zinc-400">
              Drop a row here, or use “+ Add row”.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
