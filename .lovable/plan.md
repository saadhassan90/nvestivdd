
# Agentic Iris across all GP pages

Goal: Iris (the embedded chat) can read content from any GP page and propose edits the user reviews before applying. Storage is in Lovable Cloud. Structure of pages stays the same; only the content inside named blocks is editable.

## What ships

1. **Generic editable-content layer**
   - New table `page_content` keyed by `(page_key, section_key)` holding `content jsonb` and `updated_at`.
   - New table `page_edit_proposals` holding pending proposals: `page_key, section_key, current, proposed, rationale, status (pending|applied|rejected), conversation_id`.
   - Both tables: open public policies (per project memory) + GRANTs.
   - Realtime enabled on both, so pages refresh when content changes and chat shows new proposals as they arrive.

2. **Client content runtime**
   - `PageContentProvider` (mounted in `GpShell`) loads all blocks for the current route, exposes `useBlock(section_key, defaultValue)` for pages and `usePendingProposals()` for the proposal banner.
   - Pages adopt `useBlock` for the prose/headline/description fields that are reasonable to edit (overview cards, interview prompts, DDQ intros, dataroom descriptions, feedback notes, report-card narrative, pipeline notes, contacts notes, settings copy). Layout / tables / charts stay structural and are not registered as blocks.
   - Each registered block calls `registerBlock({ page_key, section_key, label, schema: "markdown" | "text" | "json" })` once on mount so the agent can discover what exists on the page without reading source code.

3. **Proposal UI (propose + confirm)**
   - Floating "Iris suggestions" banner anchored to the page (not the chat). Each pending proposal shows: section label, side-by-side diff (current vs proposed), rationale, Apply / Reject buttons. Applying writes to `page_content`; rejecting marks the row rejected.
   - In the chat bubble, when the agent calls `propose_page_edit`, the assistant message renders a compact card linking to the proposal in the banner.

4. **Edge function tools**
   - Extend `chat-completion` with four tools the model can call:
     - `list_page_blocks({ page_key? })` — returns registered blocks + current content for the active page (or any page).
     - `read_page_block({ page_key, section_key })` — full content of one block.
     - `search_page_content({ query, page_key? })` — substring search across blocks so Iris can answer "where did we say X".
     - `propose_page_edit({ page_key, section_key, proposed, rationale })` — inserts a row in `page_edit_proposals`; returns the proposal id.
   - Active `page_key` is sent from the client in the request body (derived from the current route) so Iris defaults to "this page" when the user doesn't name one.
   - System prompt updated: Iris is told she can edit page content only via `propose_page_edit`, never invent section keys, and must read before proposing.

5. **Discovery for the agent**
   - On every chat request we also send a compact `page_blocks_manifest` for the active page (keys + labels + short preview) so the model has zero-shot awareness without an extra tool call.

## Out of scope (explicit)

- Structural edits (adding/removing tabs, cards, rows, columns).
- Editing tabular/computed data (scores, pipeline rows, contact rows).
- Auto-apply. Every change goes through Apply/Reject.
- Versioning beyond `updated_at` (no full history table in v1).

## Technical notes

- Page keys follow the route: `gp.raises.list`, `gp.raise.overview`, `gp.raise.interview`, `gp.raise.ddq`, `gp.raise.dataroom`, `gp.raise.pipeline`, `gp.raise.feedback`, `gp.raise.report-card`, `gp.pipeline`, `gp.contacts`, `gp.settings`, `gp.chat`. Raise-scoped pages also include the `raise_id` in the row so different raises have independent content.
- Section keys are short and stable, declared in code (e.g. `overview.summary`, `interview.intro`, `ddq.preamble`).
- Default content for each block stays in code; `useBlock` returns the DB value if present, otherwise the code default. This means existing pages keep working before any edit is made.
- Realtime channel `page_content:{page_key}` for content updates and `page_edit_proposals:{page_key}` for proposals.
- Edge function authorization continues to use the publishable key; no per-user auth changes.
- Diff rendering uses a small inline word-diff (no new heavy dep).

## Rollout order

1. Migration: `page_content`, `page_edit_proposals`, grants, realtime.
2. `PageContentProvider`, `useBlock`, manifest registry, proposal banner.
3. Edge function tools + system prompt + manifest injection.
4. Adopt `useBlock` on the GP pages above (one PR-sized pass, prose blocks only).
5. Manual test: ask Iris to summarize the current page, then ask her to rewrite the overview summary; confirm proposal appears, Apply writes through, refresh shows new content.
