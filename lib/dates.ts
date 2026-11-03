// All date math is done on local calendar dates (never via UTC strings),
// so "2026-11-02" never drifts a day because of the viewer's timezone.

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_RE.test(value)) return false;
  const d = parseIso(value);
  return toIso(d) === value; // rejects things like 2026-02-31
}

export function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayIso(): string {
  return toIso(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = parseIso(iso);
  d.setDate(d.getDate() + days);
  return toIso(d);
}

/** Monday of the week containing `iso`. */
export function mondayOf(iso: string): string {
  const d = parseIso(iso);
  const offset = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  d.setDate(d.getDate() - offset);
  return toIso(d);
}

const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export function formatShort(iso: string): string {
  return fmt.format(parseIso(iso));
}

export function formatWeekRange(mondayIso: string): string {
  return `${formatShort(mondayIso)} – ${formatShort(addDays(mondayIso, 6))}`;
}
