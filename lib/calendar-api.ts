import { getSupabase } from "./supabase";
import { buildInsertPayload, buildUpdatePatch } from "./sanitize";
import { isIsoDate, todayIso } from "./dates";
import type { LayoutChange } from "./layout";
import {
  isStatus,
  type ContentItem,
  type EditableFields,
  type NewContentItem,
} from "./types";

const TABLE = "content_calendar";

interface DbError {
  message: string;
  code?: string;
  hint?: string;
}

function fail(op: string, error: DbError): never {
  const code = error.code ? ` [${error.code}]` : "";
  const hint = error.hint ? ` — ${error.hint}` : "";
  throw new Error(`${op} failed: ${error.message}${code}${hint}`);
}

/** Defensive read: legacy/null rows can never leak `null` into UI state. */
function normalizeRow(row: Record<string, unknown>): ContentItem {
  return {
    id: String(row.id),
    requirement: typeof row.requirement === "string" ? row.requirement : "",
    topic_idea: typeof row.topic_idea === "string" ? row.topic_idea : "",
    assignee: typeof row.assignee === "string" ? row.assignee : "",
    status: isStatus(row.status) ? row.status : "Idea",
    target_date: isIsoDate(row.target_date) ? row.target_date : todayIso(),
    week_number: typeof row.week_number === "number" ? row.week_number : 1,
    position: typeof row.position === "number" ? row.position : 0,
    created_at: typeof row.created_at === "string" ? row.created_at : undefined,
  };
}

export async function fetchItems(): Promise<ContentItem[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .order("week_number", { ascending: true })
    .order("position", { ascending: true });
  if (error) fail("Loading the calendar", error);
  return (data ?? []).map(normalizeRow);
}

/** INSERT — the payload is built by buildInsertPayload, so it never contains `id`. */
export async function insertItem(
  input: Partial<NewContentItem> & { week_number: number },
): Promise<ContentItem> {
  const payload = buildInsertPayload(input);
  const { data, error } = await getSupabase().from(TABLE).insert(payload).select().single();
  if (error) fail("Creating the item", error);
  return normalizeRow(data);
}

export async function updateItem(id: string, patch: Partial<EditableFields>): Promise<void> {
  const clean = buildUpdatePatch(patch);
  if (Object.keys(clean).length === 0) {
    throw new Error("Saving the item failed: no valid fields to update.");
  }
  const { error } = await getSupabase().from(TABLE).update(clean).eq("id", id);
  if (error) fail("Saving the item", error);
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await getSupabase().from(TABLE).delete().eq("id", id);
  if (error) fail("Deleting the item", error);
}

/** Persist a drag-and-drop result. Only rows that actually moved are written. */
export async function updateLayout(changes: LayoutChange[]): Promise<number> {
  const supabase = getSupabase();
  const results = await Promise.allSettled(
    changes.map(async ({ id, ...placement }) => {
      const clean = buildUpdatePatch(placement);
      const { error } = await supabase.from(TABLE).update(clean).eq("id", id);
      if (error) fail("Saving the layout", error);
    }),
  );
  const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
  if (failed.length > 0) {
    throw new Error(
      `${failed.length} of ${changes.length} layout updates failed: ${String(failed[0].reason?.message ?? failed[0].reason)}`,
    );
  }
  return changes.length;
}
