import type { SaveState } from "@/lib/types";

const CONFIG: Record<SaveState, { label: string; dot: string; text: string }> = {
  idle: { label: "Up to date", dot: "bg-zinc-300", text: "text-zinc-500" },
  saving: { label: "Saving…", dot: "bg-amber-400 animate-pulse", text: "text-amber-700" },
  saved: { label: "All changes saved", dot: "bg-emerald-500", text: "text-emerald-700" },
  error: { label: "Last save failed", dot: "bg-rose-500", text: "text-rose-700" },
};

export function SaveIndicator({ state }: { state: SaveState }) {
  const c = CONFIG[state];
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-medium ${c.text}`} aria-live="polite">
      <span className={`h-2 w-2 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
