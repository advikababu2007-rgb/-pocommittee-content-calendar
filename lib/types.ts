export const STATUSES = [
  "Idea",
  "Drafting",
  "In Review",
  "Scheduled",
  "Published",
] as const;

export type Status = (typeof STATUSES)[number];

/** A row exactly as it comes back from Supabase. */
export interface ContentItem {
  id: string;
  requirement: string;
  topic_idea: string;
  assignee: string;
  status: Status;
  target_date: string; // yyyy-mm-dd
  week_number: number;
  position: number;
  created_at?: string;
}

/** What we are allowed to send on INSERT: everything except DB-generated keys. */
export type NewContentItem = Omit<ContentItem, "id" | "created_at">;

/** Columns that may be changed by an UPDATE (id is deliberately absent). */
export type EditableFields = Pick<
  ContentItem,
  | "requirement"
  | "topic_idea"
  | "assignee"
  | "status"
  | "target_date"
  | "week_number"
  | "position"
>;

export type SaveState = "idle" | "saving" | "saved" | "error";

export function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}
