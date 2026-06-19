import { supabase } from "@/integrations/supabase/client";

/**
 * Singleton store powering Iris's read+edit access to GP page content.
 *
 * Design:
 * - Pages mount EditableText components that call `registerBlock` for each
 *   editable piece of prose. The registry is the manifest Iris uses.
 * - DB rows in `page_content` override the in-code default; live updates
 *   stream in via Supabase Realtime.
 * - The active route (page_key + raise_id) is published via `setActivePage`
 *   so the chat backend can default to "this page" when the user doesn't
 *   name one.
 * - `page_edit_proposals` rows surface in the floating Iris banner; Apply
 *   writes through to `page_content` and marks the proposal applied.
 */

export type SchemaType = "text" | "markdown";

type ContentRow = {
  id: string;
  page_key: string;
  raise_id: string | null;
  section_key: string;
  content: { text?: string } | Record<string, unknown>;
  label: string | null;
  schema_type: string;
};

type RegisteredBlock = {
  pageKey: string;
  raiseId: string | null;
  sectionKey: string;
  label: string;
  schema: SchemaType;
  defaultValue: string;
};

const rowKey = (pk: string, rid: string | null, sk: string) =>
  `${pk}|${rid || ""}|${sk}`;

const dbRows = new Map<string, ContentRow>();
const registry = new Map<string, RegisteredBlock>();
let active: { pageKey: string; raiseId: string | null } = {
  pageKey: "unknown",
  raiseId: null,
};

const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}

export function subscribePageContent(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setActivePage(pageKey: string, raiseId: string | null) {
  if (active.pageKey === pageKey && active.raiseId === raiseId) return;
  active = { pageKey, raiseId };
  emit();
}

export function getActivePage() {
  return active;
}

export function registerBlock(b: RegisteredBlock) {
  const k = rowKey(b.pageKey, b.raiseId, b.sectionKey);
  registry.set(k, b);
  emit();
}

export function getBlockValue(
  pageKey: string,
  raiseId: string | null,
  sectionKey: string,
  fallback: string,
): string {
  const row = dbRows.get(rowKey(pageKey, raiseId, sectionKey));
  const t =
    row && typeof row.content === "object" && row.content !== null
      ? (row.content as { text?: string }).text
      : undefined;
  return typeof t === "string" ? t : fallback;
}

export function getRegisteredBlocks(
  pageKey?: string,
  raiseId?: string | null,
) {
  const out: (RegisteredBlock & { current: string })[] = [];
  for (const b of registry.values()) {
    if (pageKey && b.pageKey !== pageKey) continue;
    if (pageKey && raiseId !== undefined && b.raiseId !== raiseId) continue;
    out.push({
      ...b,
      current: getBlockValue(b.pageKey, b.raiseId, b.sectionKey, b.defaultValue),
    });
  }
  return out;
}

export function buildActiveManifest() {
  const { pageKey, raiseId } = active;
  return {
    page_key: pageKey,
    raise_id: raiseId,
    blocks: getRegisteredBlocks(pageKey, raiseId).map((b) => ({
      section_key: b.sectionKey,
      label: b.label,
      schema: b.schema,
      preview: b.current.slice(0, 240),
    })),
  };
}

/** Apply a proposal: write content, mark proposal applied. */
export async function applyProposal(proposalId: string) {
  const { data: prop, error } = await supabase
    .from("page_edit_proposals")
    .select("*")
    .eq("id", proposalId)
    .maybeSingle();
  if (error || !prop) throw new Error(error?.message || "Proposal not found");

  const { error: upErr } = await supabase
    .from("page_content")
    .upsert(
      {
        page_key: prop.page_key,
        raise_id: prop.raise_id,
        section_key: prop.section_key,
        content: prop.proposed_content,
        label: prop.label,
        schema_type: "markdown",
      },
      { onConflict: "page_key,raise_id,section_key" },
    );
  if (upErr) throw upErr;

  await supabase
    .from("page_edit_proposals")
    .update({ status: "applied" })
    .eq("id", proposalId);
}

export async function rejectProposal(proposalId: string) {
  await supabase
    .from("page_edit_proposals")
    .update({ status: "rejected" })
    .eq("id", proposalId);
}

/** Initial hydration + realtime subscription. Idempotent. */
let initialized = false;
export function initPageContent() {
  if (initialized) return;
  initialized = true;

  (async () => {
    const { data } = await supabase
      .from("page_content")
      .select("id, page_key, raise_id, section_key, content, label, schema_type");
    if (data) {
      for (const row of data as ContentRow[]) {
        dbRows.set(rowKey(row.page_key, row.raise_id, row.section_key), row);
      }
      emit();
    }
  })();

  supabase
    .channel("page_content_stream")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "page_content" },
      (payload) => {
        const newRow = payload.new as ContentRow | null;
        const oldRow = payload.old as ContentRow | null;
        if (payload.eventType === "DELETE" && oldRow) {
          dbRows.delete(rowKey(oldRow.page_key, oldRow.raise_id, oldRow.section_key));
        } else if (newRow) {
          dbRows.set(rowKey(newRow.page_key, newRow.raise_id, newRow.section_key), newRow);
        }
        emit();
      },
    )
    .subscribe();
}