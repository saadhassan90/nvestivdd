---
name: ODD Workspace (ADIA Variant)
description: ADIA-only Operational Due Diligence stage on ProjectDetail with 3-column layout, Daseti import modal, and per-section staggered unlock
type: feature
---
**Variant gate**: ADIA only (`useUiVariant()`). ODD tab appears in `ProjectTopBar` stage selector (`L1 · L2 · ODD · L3`); in ADIA, L1/L2/L3 are locked with Lock icon. In General, ODD is hidden.

**Routing**: No new route. `?stage=odd` on `/project/:id`. ADIA variant defaults to ODD when no tab/stage param. `ProjectDetail.tsx` branches: renders `<OddWorkspace>` instead of the L1 sidebar+tabs.

**Layout**: 3 columns — `OddLeftRail` (220px, section bookmarks + status chips + Risk Rating block) · `OddCanvas` (markdown sections with per-section skeleton/content/error) · `EmbeddedIrisChat` (380px, always-on, reused from IcMemo).

**Six fixed sections** (`src/lib/odd-template.ts`): firm_stability, staffing, people_process_systems, fund_terms, discrepancy_register, sources_appendix. Step keys prefixed `odd_`.

**Data model**: `odd_reports` (one row per project: content_json, content_markdown, risk_rating, version) and `odd_section_results` (one row per project+section_key: status pending/running/complete/error, content_markdown, verification_status, error_message). Public access, realtime enabled.

**Hook**: `useOddReport(projectId, fundName)` — fetches both tables, subscribes via Supabase Realtime, derives `sections` map for the canvas, exposes `startAnalysis` (uploads files to `documents` bucket under `{project_id}/odd/`, upserts six pending rows, enqueues `task_queue` row with `task_type='odd_analysis'`) and `retrySection`.

**Pipeline**: `task_queue` task_type `odd_analysis` — backend worker (`dispatch-odd-analysis` edge function) still to be implemented; current `process-task-queue` will fail to dispatch until function exists. Real ADIA webhook URL/auth TBD.

**Import modal**: PDF/DOCX only. Daseti export required; supporting docs (LPA/PPM/DDQ/financials/compliance) optional multi-file. Confirmation dialog when re-importing over an existing report.

**Out of scope V1**: BlockNote per-section editing (canvas renders markdown read-only for now; Iris is the edit surface), DOCX export, Daseti API, email ingestion, version history UI.

**Files**: `src/components/odd/*` (Workspace, LeftRail, Canvas, SectionSkeleton, EmptyState, ImportModal), `src/hooks/use-odd-report.ts`, `src/lib/odd-template.ts`.