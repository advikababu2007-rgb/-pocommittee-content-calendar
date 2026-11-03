"use client";

import { useState } from "react";

interface Props {
  value: string;
  placeholder: string;
  ariaLabel: string;
  onCommit: (next: string) => void;
}

/**
 * Auto-growing text cell. Commits on blur / Enter, reverts on Escape.
 * Always emits a string (possibly empty) — never null.
 */
export function EditableText({ value, placeholder, ariaLabel, onCommit }: Props) {
  const [draft, setDraft] = useState(value);
  const [seen, setSeen] = useState(value);

  // Re-sync when the saved value changes underneath us (rollback, refetch).
  if (value !== seen) {
    setSeen(value);
    setDraft(value);
  }

  const commit = () => {
    const next = draft.trim();
    if (next !== value) onCommit(next);
    else setDraft(value);
  };

  return (
    <textarea
      rows={1}
      value={draft}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === "Escape") {
          setDraft(value);
          e.currentTarget.blur();
        }
      }}
      className="field-sizing-content min-h-8 w-full resize-none rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm leading-5 text-zinc-900 outline-none transition placeholder:text-zinc-300 hover:border-zinc-200 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
    />
  );
}
