

## Plan: L3 IC Memo workspace (revised — no left rail)

Drop the left stage rail. The IC memo page becomes a clean **2-column layout**: BlockNote canvas on the left, always-on Iris chat on the right. Stage switching moves into the top bar.

### Layout

```text
┌──────────────────────────────────────────────────────────────┐
│ ProjectTopBar  …  [Stage ▾ L3 — IC Memo]  [Back to Reports] │
├────────────────────────────────────┬─────────────────────────┤
│ Canvas (BlockNote)                 │ Iris chat (always on)   │
│  • IC Memo title                   │                         │
│  • Sections seeded from L1         │ Project-scoped, with    │
│  • Inline editing                  │ memo context + tools    │
│                                    │                         │
│ flex-1, max-w-[820px] centered     │ 420px                   │
└────────────────────────────────────┴─────────────────────────┘
```

### Top bar changes (memo page only)

`ProjectTopBar` gets a `mode` prop. When `mode="memo"`:

- **Replace the "Ask Iris" pill** with a **Stage dropdown** showing the current stage ("L3 — IC Memo") and a chevron. Menu items:
  - L1 — Triage Report → navigates to `/project/:id?tab=overview`
  - L2 — Deep Dive → disabled, "Locked" tag
  - L3 — IC Memo → current, checkmark
- Add a secondary **"Back to Reports"** ghost button to the left of the dropdown for one-click return to L1.
- Cover Block (composite/recommendation/tier pills) stays — useful context while drafting.
- Share + Notifications buttons stay.

On the L1 tabs page nothing changes (Ask Iris pill stays).

### Routing & navigation

- New route `/project/:id/memo` renders `IcMemoPage`.
- `ProjectSidebar` Report picker: clicking **L3** navigates to `/project/:id/memo`. L1 stays on tabs page. L2 still locked.
- `AppLayout` suppresses the global Iris drawer on `/project/*/memo` since the page hosts its own embedded chat.

### Canvas (BlockNote)

- Deps: `@blocknote/core`, `@blocknote/react`, `@blocknote/mantine`.
- `IcMemoCanvas` wraps `useCreateBlockNote` + `<BlockNoteView />` themed to our HSL tokens (monochrome cool-gray).
- **Seeded skeleton** when no memo exists yet, derived from L1 data — same skeleton-first rule as the report:
  H1 `{fund_name} — Investment Committee Memo`, then H2 sections: Recommendation · Executive Summary · Fund Overview · Team & Governance · Strategy · Performance & Track Record · Fees & Terms · Risks & Mitigants · Diligence Status · Conditions for Advancement · Appendix. Each seeded with a paragraph from matching L1 fields or a muted `[NOT YET DRAFTED]` block.
- Small toolbar above canvas: "Saved · 2s ago" indicator, Export menu (download Markdown / copy), "Reset to template" (with confirm).

### Persistence

- New `ic_memos` table: `id`, `project_id` (unique), `content_json` (jsonb BlockNote doc), `content_markdown` (text), `version` (int), `updated_at`. Public RLS matching the rest of the app.
- Load → fetch row; if absent, generate seeded skeleton and insert.
- Edit → debounced (1.5s) upsert of `content_json` + regenerated `content_markdown` via BlockNote's `blocksToMarkdownLossy`.
- Realtime subscription so chat-driven edits appear in the editor live.

### Iris chat (embedded, agentic)

- Reuse `ChatProvider` / `useChatContext`. On mount, page calls `setProjectScope({ id, name })` so messages are scoped to this fund.
- New `EmbeddedIrisChat` renders the same UI as `ChatSidebar` (history, model picker, suggested prompts, bubbles, input) but mounted inside the right column instead of as a fixed drawer. Header omits the close button since it's permanent here.
- Send requests include optional `memo_id`. `chat-completion` edge function:
  - When `memo_id` is present, injects current `content_markdown` into the system prompt: "You are co-authoring an IC memo for {fund_name}…"
  - Registers two new tools:
    - `propose_memo_edit({ section_heading, new_markdown, mode: "replace" | "append" | "insert_after" })` → returns a diff preview to the client.
    - `apply_memo_edit({ edit_id })` → server applies edit to `ic_memos` (markdown → blocks via `tryParseMarkdownToBlocks`) and broadcasts via realtime.
- Client renders proposed edits as compact diff cards inside chat bubbles with **Apply** / **Discard** buttons. Apply round-trips and the canvas updates from the realtime sub.
- Suggested prompts (memo scope): "Tighten the executive summary", "Draft the recommendation paragraph", "Pull the fee table into Fees & Terms", "Add mitigants column to Risks".

### Mobile (< lg)

Top bar stage dropdown stays. Canvas full-width; chat collapses into a bottom-docked drawer toggle.

### Memory updates

- New `mem://features/ic-memo-workspace.md` documenting: route, 2-column layout, top-bar stage dropdown (no left rail), BlockNote choice, `ic_memos` schema, seed-from-L1 rule, agentic edit tool contract.
- Index gets one new line under Memories.

---

### Technical notes

- **Files added**: `src/pages/IcMemoPage.tsx`, `src/components/memo/IcMemoCanvas.tsx`, `src/components/memo/MemoToolbar.tsx`, `src/components/memo/EmbeddedIrisChat.tsx`, `src/components/memo/StageDropdown.tsx`, `src/lib/ic-memo-template.ts`, `src/hooks/use-ic-memo.ts`.
- **Files edited**: `src/App.tsx` (new route), `src/components/project/ProjectTopBar.tsx` (add `mode` prop; swap Ask Iris for StageDropdown + Back to Reports when `mode="memo"`), `src/components/project/ProjectSidebar.tsx` (L3 navigates instead of local state), `src/components/layout/AppLayout.tsx` (suppress global drawer on memo route), `src/contexts/ChatContext.tsx` (accept optional `memoId` per send), `supabase/functions/chat-completion/index.ts` (memo context + 2 tools).
- **DB**: one migration creating `ic_memos` table with public RLS + realtime publication.
- **Out of scope**: PDF export, multi-user presence/cursors, version history UI (column reserved), L2 page.

