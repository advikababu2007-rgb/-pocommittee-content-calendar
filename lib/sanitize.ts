import { isIsoDate, todayIso } from "./dates";
import {
  isStatus,
  type EditableFields,
  type NewContentItem,
} from "./types";

/**
 * Every payload that leaves the browser goes through this file.
 * Guarantees:
 *   1. `id` is never present (the DB generates it on insert; updates use .eq("id", …)).
 *   2. No `null` / `undefined` values — missing text becomes "", missing
 *      status/date/position get safe defaults that match the SQL defaults.
 *   3. Unknown keys are dropped (whitelist, not blacklist).
 */

const asText = (v: unknown): string => (typeof v === "string" ? v : "");
const asInt = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isInteger(v) ? v : fallback;

export function buildInsertPayload(
  input: Partial<NewContentItem> & { week_number: number },
): NewContentItem {
  const payload: NewContentItem = {
    requirement: asText(input.requirement),
    topic_idea: asText(input.topic_idea),
    assignee: asText(input.assignee),
    status: isStatus(input.status) ? input.status : "Idea",
    target_date: isIsoDate(input.target_date) ? input.target_date : todayIso(),
    week_number: Math.max(1, asInt(input.week_number, 1)),
    position: Math.max(0, asInt(input.position, 0)),
  };
  assertClean(payload);
  return payload;
}

/** Whitelist + validate a partial update. Invalid fields are dropped, never nulled. */
export function buildUpdatePatch(
  patch: Partial<EditableFields>,
): Partial<EditableFields> {
  const out: Partial<EditableFields> = {};

  if (typeof patch.requirement === "string") out.requirement = patch.requirement;
  if (typeof patch.topic_idea === "string") out.topic_idea = patch.topic_idea;
  if (typeof patch.assignee === "string") out.assignee = patch.assignee;
  if (isStatus(patch.status)) out.status = patch.status;
  if (isIsoDate(patch.target_date)) out.target_date = patch.target_date;
  if (typeof patch.week_number === "number" && Number.isInteger(patch.week_number) && patch.week_number > 0)
    out.week_number = patch.week_number;
  if (typeof patch.position === "number" && Number.isInteger(patch.position) && patch.position >= 0)
    out.position = patch.position;

  assertClean(out);
  return out;
}

/** Last line of defence — throws before a bad payload can reach the network. */
export function assertClean(payload: object): void {
  if ("id" in payload) {
    throw new Error("Payload must not contain `id` — the database generates it.");
  }
  for (const [key, value] of Object.entries(payload)) {
    if (value === null || value === undefined) {
      throw new Error(`Payload field "${key}" is ${String(value)}; null/undefined is not allowed.`);
    }
  }
}
