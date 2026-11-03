"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { isIsoDate } from "@/lib/dates";
import type { ContentItem, EditableFields } from "@/lib/types";
import { EditableText } from "./EditableText";
import { ROW_GRID } from "./grid";
import { StatusSelect } from "./StatusSelect";

interface Props {
  item: ContentItem;
  onUpdate: (id: string, patch: Partial<EditableFields>) => void;
  onRemove: (id: string) => void;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

export function ItemRow({ item, onUpdate, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${ROW_GRID} group border-t border-zinc-100 bg-white py-2 first:border-t-0 ${
        isDragging ? "relative z-10 opacity-30" : ""
      }`}
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder or move to another week"
        className="flex h-7 w-6 cursor-grab touch-none items-center justify-center rounded text-zinc-300 transition hover:bg-zinc-100 hover:text-zinc-600 active:cursor-grabbing"
      >
        <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" aria-hidden>
          {[2, 8, 14].flatMap((y) => [3, 9].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" />))}
        </svg>
      </button>

      <EditableText
        value={item.requirement}
        placeholder="Requirement"
        ariaLabel="Requirement"
        onCommit={(requirement) => onUpdate(item.id, { requirement })}
      />
      <EditableText
        value={item.topic_idea}
        placeholder="Topic / idea"
        ariaLabel="Topic or idea"
        onCommit={(topic_idea) => onUpdate(item.id, { topic_idea })}
      />

      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
            item.assignee ? "bg-indigo-100 text-indigo-700" : "bg-zinc-100 text-zinc-300"
          }`}
        >
          {item.assignee ? initials(item.assignee) : "?"}
        </span>
        <EditableText
          value={item.assignee}
          placeholder="Assignee"
          ariaLabel="Assignee"
          onCommit={(assignee) => onUpdate(item.id, { assignee })}
        />
      </div>

      <StatusSelect value={item.status} onChange={(status) => onUpdate(item.id, { status })} />

      <input
        type="date"
        value={item.target_date}
        aria-label="Target date"
        onChange={(e) => isIsoDate(e.target.value) && onUpdate(item.id, { target_date: e.target.value })}
        className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-zinc-700 outline-none transition hover:border-zinc-200 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
      />

      <button
        onClick={() => onRemove(item.id)}
        aria-label="Delete row"
        className="flex h-7 w-7 items-center justify-center rounded text-zinc-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 focus:opacity-100 group-hover:opacity-100"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
          <path d="M3 3l8 8M11 3l-8 8" />
        </svg>
      </button>
    </div>
  );
}

/** Lightweight clone shown under the cursor while dragging. */
export function RowGhost({ item }: { item: ContentItem }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm shadow-xl ring-4 ring-indigo-100/60">
      <span className="font-medium text-zinc-900">{item.requirement || "Untitled requirement"}</span>
      <span className="truncate text-zinc-500">{item.topic_idea}</span>
      <span className="ml-auto text-xs text-zinc-400">{item.assignee}</span>
    </div>
  );
}
