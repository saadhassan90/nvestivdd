## ODD Workspace — ADIA Variant (V1)

Yes — understood. All changes below are gated on `variant === "adia"` from `UiVariantContext`. The General variant is untouched.

### Scope of this build

V1 ships the full ODD workspace UX end-to-end with a **mocked pipeline** (frontend-driven section completion via timers + seeded content), so the demo is fully clickable. The real async pipeline (webhook + worker) is wired through `task_queue` / `analysis_logs` but left as a stub that the backend team can replace. This lets us answer Open Questions #1–#3 in parallel without blocking the UI.

---

### 1. Stage selector — ADIA-only ODD tab

File: `src/components/project/ProjectTopBar.tsx`

- Read `useUiVariant()`. When `variant === "adia"`:
  - Render the level pill strip as `L1 · L2 · ODD · L3`.
  - **Only ODD is clickable**; L1/L2/L3 are locked (Lock icon, `opacity-40 cursor-not-allowed`, tooltip "Coming soon in ADIA demo").
  - Default active stage = `ODD`.
- When `variant === "general"`: existing `L1 · L2 · L3` behavior unchanged.
- New stage value `"ODD"` added to the `reportLevel` union (`"L1" | "L2" | "L3" | "ODD"`).

### 2. Routing — no new route

File: `src/pages/ProjectDetail.tsx`

- Add a `?stage=odd` search-param branch (same pattern as the existing `?tab=`).
- When `variant === "adia"` and there is no explicit `stage` param, default to `stage=odd` and force `reportLevel = "ODD"`.
- When `stage === "odd"`, replace the existing tabs/report region with `<OddWorkspace project={project} />`. Top bar + breadcrumb stay mounted.

### 3. ODD workspace component

New: `src/components/odd/OddWorkspace.tsx`

Three-column layout (desktop):

```text
┌──────────┬──────────────────────────┬──────────┐
│ 220px    │ flex-1 BlockNote canvas  │ 380px    │
│ Left     │ (six locked H2 sections) │ Embedded │
│ rail     │                          │ Iris     │
└──────────┴──────────────────────────┴──────────┘
```

- Right rail: reuse `EmbeddedIrisChat` exactly as `IcMemoPage` does (always-on, scoped to project on mount via `setProjectScope`).
- Mobile/tablet: left rail collapses to a top dropdown; right rail hidden (matches existing pattern, surfaced via `MobileBottomNav` "Ask Iris" button).

### 4. Left rail

New: `src/components/odd/OddLeftRail.tsx`

- Six bookmarks in fixed order: Firm Stability · Staffing · People / Process / Systems · Fund Terms · Discrepancy Register · Sources & Appendix.
- Each row = label + status chip: `Unverified` (muted) · `Generating…` (spinner) · `Verified` (`text-score-strong`) · `Flagged` (`text-severity-critical`).
- Click → smooth-scroll the canvas to that section's H2 (anchor IDs `odd-section-{key}` injected by canvas).
- Bottom: Risk Rating block — `—` until all six complete, then Low/Medium/High with severity color.

### 5. Center canvas

New: `src/components/odd/OddCanvas.tsx` (mirrors `IcMemoCanvas`)

- BlockNote `@blocknote/mantine` editor, seeded by `buildOddSkeletonDocument()` (new in `src/lib/odd-template.ts`) — six locked H2 headings with empty bodies.
- States:
  - **Empty**: Centered card, "No ODD report yet" + "Import Daseti Data" CTA (FR-12). Left rail chips all "Unverified".
  - **Generating**: All six H2s render; under each pending section, `<OddSectionSkeleton />` shimmer (3 lines @ 80/65/45%, pulsing left accent). Section block non-editable.
  - **Ready/Partial**: As each section's pipeline status flips to `complete`, replace skeleton with drafted content in place — no scroll jump, no editor remount (stable `resetKey`, identical to `IcMemoPage` trick).
- Heading guard: on autosave, re-inject any missing/renamed H2 in the correct position (Option chosen for Q6 — simpler than custom BlockNote schema).
- Autosave: debounced 1.5s via new `useOddReport` hook → `odd_reports` table (see §7).

### 6. Import modal

New: `src/components/odd/OddImportModal.tsx`

- Title "Import Daseti Data".
- Zone 1 (required): "Daseti Export" — single PDF/DOCX, drag/drop + click.
- Zone 2 (optional): "Supporting Documents (LPA, PPM, ILPA DDQ, financials, compliance)" — multi PDF/DOCX.
- File-type rejection inline ("Only PDF and DOCX files are accepted").
- "Run ODD Analysis" disabled until Zone 1 has a valid file.
- Submit:
  1. Upload each file to `documents` bucket under `{project_id}/odd/`.
  2. Insert `documents` rows tagged via existing `document_type_classified` (`"daseti_export"` / `"odd_supporting"`).
  3. Insert one `task_queue` row `{ task_type: 'odd_analysis', input_payload: { daseti_path, supporting_paths } }`.
  4. Insert six `analysis_logs` rows in `pending` (one per section step_key).
  5. Close modal, transition canvas to Generating.
- Re-import on completed report → confirmation dialog "This will replace the existing ODD report. Continue?" (AC-19).

### 7. Data model (decision for Open Q #1)

**Choose Option B — new `odd_reports` table.** Cleaner separation from L1's `report_sections` and mirrors the proven `ic_memos` shape.

Migration creates:

- `odd_reports` — one row per project: `project_id` (unique), `content_json` jsonb, `content_markdown` text, `risk_rating` text (`low|medium|high|null`), `version` int, `created_at`, `updated_at`. Public RLS (matches project convention), realtime enabled.
- `odd_section_results` — one row per (project_id, section_key): `section_key`, `status` (`pending|running|complete|error`), `content_markdown`, `verification_status` (`verified|flagged`), `flag_count` int. Public RLS, realtime enabled.

`analysis_logs` — **no schema change**. New `step_key` values only: `odd_firm_stability`, `odd_staffing`, `odd_people_process_systems`, `odd_fund_terms`, `odd_discrepancy_register`, `odd_sources_appendix`.

`documents` — no schema change.

### 8. Realtime + pipeline trigger

- `OddWorkspace` subscribes to `analysis_logs` filtered by `project_id` and `step_key ILIKE 'odd_%'`, and to `odd_section_results` filtered by `project_id`. On `complete`, it fetches the section's `content_markdown` and replaces the skeleton block in the BlockNote doc.
- New edge function `supabase/functions/dispatch-odd-analysis/index.ts` (stub for V1): claims an `odd_analysis` task, walks the six step keys, and — for the demo — generates seeded content via Lovable AI gateway (`openai/gpt-5.4-mini` per project's tiered model rule), writing one section every ~3–5 seconds to make the staggered unlock UX visible. The real ADIA webhook (`POST /api/odd/trigger`) is left as a `TODO` block behind an env-flag check; when Saad provides the URL it's a one-line swap.
- Existing `process-task-queue` already dispatches by `task_type === 'odd_analysis'` → `dispatch-odd-analysis` (matches existing pattern of mapping `l1_analysis` → `run-l1-analysis`).

### 9. Error states

- Per-section failure → skeleton replaced with inline `"Generation failed · Retry"` chip; Retry re-enqueues only that step.
- All-fail → toast "ODD analysis failed. Please re-import your data."

### 10. Files to add / change

**Add**
- `src/components/odd/OddWorkspace.tsx`
- `src/components/odd/OddLeftRail.tsx`
- `src/components/odd/OddCanvas.tsx`
- `src/components/odd/OddSectionSkeleton.tsx`
- `src/components/odd/OddImportModal.tsx`
- `src/components/odd/OddEmptyState.tsx`
- `src/hooks/use-odd-report.ts`
- `src/lib/odd-template.ts`
- `supabase/functions/dispatch-odd-analysis/index.ts` (stub)
- Migration: `odd_reports` + `odd_section_results` tables, realtime publication

**Change**
- `src/components/project/ProjectTopBar.tsx` — add ODD tab + lock other tabs in ADIA variant
- `src/pages/ProjectDetail.tsx` — add `?stage=odd` branch, render `<OddWorkspace />`
- `.lovable/memory/index.md` + new `features/odd-workspace.md` memory entry

### Out of scope (per PRD §10)

DOCX/PDF export, direct Daseti API, email ingestion, auto-apply Iris suggestions, version history UI, L2/L3 unlock in ADIA, ODD in General variant.

### Open questions resolved in this plan (flag for Saad/Paul to confirm)

- **Q1** (Paul): Option B — new `odd_reports` table. Confirm before migration runs.
- **Q6** (Paul): Heading guard via autosave re-injection (not custom BlockNote schema).
- **Q2/Q3** (Saad): Pipeline stubbed with Lovable AI; swap to real webhook when URL/auth provided — no UI rework needed.

---

Approve to start with the migration + variant-gated ODD tab, then build the workspace shell, then wire the import + mocked pipeline.