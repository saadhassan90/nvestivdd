## Goal

Every section card (across all tabs) gets an attached comment thread directly underneath it. Two visual states:
- **Empty state** — single inline composer: text input with placeholder "Add a comment…" + Send button.
- **Populated state** — stacked thread of comments (chronological, oldest → newest) attached to the card with a clear "joined" visual (no gap, shared border feel), plus a compact composer pinned at the bottom.

The right-hand `CommentsRail` keeps aggregating all comments but each entry now shows **Section → Card** so the linkage is obvious, and clicking scrolls to the exact card.

---

## Approach

### 1. Stable card identity

Introduce a `cardId` prop on the two card primitives so each card on a page has a deterministic id used for `comments.sub_card_id`:

- `SectionCard` (`src/components/project/primitives/SectionCard.tsx`) — add optional `cardId: string` and `sectionId: string` props. When both present, render the new `<CardCommentThread>` slot at the bottom.
- `MarkdownSectionCards` (`src/components/project/MarkdownSectionCards.tsx`) — derive a stable `cardId` from a slugified card title (e.g. `card-investment-thesis-overview`), accept a `sectionId` prop from the parent tab, and render `<CardCommentThread>` per card.

Convention: `sub_card_id` = short slug (e.g. `executive_summary`, `verdict_snapshot`, `findings_overview`). `section_id` = the existing tab key (`overview`, `economics`, …). The DB already has both columns, so no schema change needed.

### 2. New `CardCommentThread` component

`src/components/project/CardCommentThread.tsx`

Responsibilities:
- Subscribe to `comments` rows where `project_id = X AND section_id = Y AND sub_card_id = Z` via Supabase Realtime (one channel per card; cheap because postgres_changes filters server-side).
- Render two states:
  - **Empty**: a compact attached strip (top border merges with the card via `-mt-px rounded-t-none border-t-0`), containing a single-line input + ghost Send icon button. Placeholder: "Add a comment…". Pressing Enter (no Shift) or the icon submits.
  - **Populated**: thread list (each comment as a small bubble with author chip, relative time, body, resolve toggle), then the same compact composer at the bottom.
- Inserts go directly to `supabase.from("comments").insert({ project_id, section_id, sub_card_id, author_type: 'human', author_name: 'You', body_md })`.
- AI authored comments render with the existing "Nvestiv AI" badge convention.
- Resolved comments dim to 50% and collapse into "N resolved · show" disclosure to keep the thread tidy.

Visual style matches existing primitives (small text, `border-border/60`, `bg-muted/20` for the composer strip) so it reads as the bottom of the card, not a separate block.

### 3. Wire `cardId`/`sectionId` into every tab

Each tab already calls `<SectionCard title=…>` multiple times. Add `sectionId` (the tab key) and `cardId` (a short kebab slug) to each call. Tabs to update:

- `OverviewTab` — verdict_snapshot, findings_overview, executive_summary, fund_snapshot, all_scores
- `InvestmentThesisTab`, `MarketRealityTab`, `TeamTab`, `TrackRecordTab`, `EconomicsTab`, `RegulatoryOpsTab`, `RedFlagsTab`, `InterrogatoryTab`, `DataRoomTab`, `SourceFilesTab`
- `MarkdownSectionCards` consumers (the markdown-driven sub-sections in some tabs) — pass `sectionId` from caller, slug derived from heading.

No content changes required — purely additive props.

### 4. Update `CommentsRail` (right-hand panel)

`src/components/project/CommentsRail.tsx`:
- Group comments by `section_id` → `sub_card_id` instead of a flat list.
- Each comment shows `Section › Card` breadcrumb (e.g. `Overview › Executive Summary`). When `sub_card_id` is null, fall back to current section-only label.
- Card label resolution: a small registry `CARD_LABELS: Record<string, string>` keyed by `${section_id}::${sub_card_id}` so the rail shows human names. Anything missing falls back to titlecased slug.
- Click on a comment scrolls to `#card-${section_id}-${sub_card_id}` (we add this `id` to the `<section>` element in `SectionCard` when `cardId` is provided) and switches tabs if needed via the existing tab query param.
- The rail's existing "Add" modal becomes a fallback only — primary entry is the inline composer on the card. Keep the modal for quick top-level notes.

### 5. Aggregation page

`src/pages/CommentsPage.tsx` gets the same `Section › Card` label treatment and the section deep-link becomes `/project/:id?tab=…#card-…-…` so clicking jumps straight to the card.

---

## Technical details

**Files created**
- `src/components/project/CardCommentThread.tsx` — the attached thread + composer
- `src/lib/card-labels.ts` — registry mapping `${sectionId}::${cardId}` → human label, plus `slugify` helper

**Files edited**
- `src/components/project/primitives/SectionCard.tsx` — accept `sectionId`, `cardId`; render thread; set DOM `id`
- `src/components/project/MarkdownSectionCards.tsx` — accept `sectionId`; auto-slug per card; render thread
- All tab files in `src/components/project/*Tab.tsx` — pass `sectionId` + `cardId` per card (mechanical)
- `src/components/project/CommentsRail.tsx` — group/label by card, deep-link scroll
- `src/pages/CommentsPage.tsx` — same label treatment

**No DB changes** — `comments.sub_card_id` already exists; realtime is already enabled on `comments`.

**Realtime hygiene** — each `CardCommentThread` opens its own filtered channel. Channels auto-clean on unmount. For pages with ~6–10 cards this is well within Supabase realtime limits.

**Meeting Mode** — wrap the thread in `data-meeting-hide="true"` so presentations stay clean (consistent with existing pattern).

---

## ASCII layout

```text
┌────────────────────────────────── Card ─┐
│ Header: Title · subtitle                │
├─────────────────────────────────────────┤
│ Card body (existing content)            │
├──── attached comment strip ─────────────┤  ← empty state
│  [ Add a comment…              ] [↵]    │
└─────────────────────────────────────────┘

┌────────────────────────────────── Card ─┐
│ Header                                  │
├─────────────────────────────────────────┤
│ Card body                               │
├──── thread (2) ─────────────────────────┤  ← populated
│ • Sara · 2h     "Push back on IRR…" [✓] │
│ • Nvestiv AI    "Track-record claims …" │
│ ─────────────────────────────────────── │
│  [ Reply…                      ] [↵]    │
└─────────────────────────────────────────┘
```

---

## Out of scope

- Threaded replies (parent_comment_id) — the column exists but UI stays flat for now.
- @mentions / notifications.
- Edit/delete of own comments (only resolve toggle ships).
