## Goal

Replace the current L1SnapshotPage with a single-scroll, 8-section "L1 One-Pager" that renders entirely from one typed payload object per fund, matching `render-fixture-demo-fund.json`. Restructure all 18 existing mock funds in the app to that shape. Reuse existing visual primitives (cards, chips, badges, KPI tiles) — no new design system.

## Sections (in order, one sticky nav)

1. **Verdict** — north-star banner (ADVANCE/CONDITIONAL/DECLINE + ≤60-word statement), composite + tier, 5 module chips (expandable to rationale + citations), claims tally pills (deep-link → ledger filter), "What would change our mind".
2. **Executive Summary** — narrative + Key Strengths / Key Risks columns with citations.
3. **Factsheet** — fields grouped by identity / scale / economics / governance / providers; per-field provenance: `verified` (value + citations), `disclosed_only` ("GP-stated"), `not_disclosed` (em-dash + NOT DISCLOSED).
4. **Claims Ledger** — sticky tally bar, filters (disposition × category), rows grouped by category with disposition + severity badges, evidence, citations.
5. **Flags & Questions** — flag cards CRITICAL → WARNING, with clarifying questions inline (questions render full-text ONLY here). Standalone asks at bottom.
6. **Modules** — Thesis, Macro, Track Record, Team, Fund Economics. Collapsed: header + verdict chip + score + KPI row. Expanded: narrative + facts (source-tier tag + citation) + flag cross-ref chips.
7. **Meeting Agenda** — objective; ordered items (topic/minutes/what_to_validate/question chips/listen_for strong+weak); standalone-ask chips; materials_request (item + reason + claim chips); decision_rule callout.
8. **Sources & Methodology** — source registry with 8 tier badges + external links; clicking any citation chip page-wide scrolls + highlights its row; Methodology modal (per-topic venues searched / hits + completeness%).

## Technical Approach

- **Contract types**: new `src/types/renderContract.ts` mirroring the fixture exactly (`meta`, `verdict`, `executive_summary`, `factsheet`, `claims_ledger`, `flags`, `modules`, `agenda`, `sources`, `methodology`).
- **Mock registry**: `src/mocks/renderPayloads.ts` exporting `RENDER_PAYLOADS: Record<projectId, RenderPayload>` for all 18 funds. One flagship fund (Vista Equity Partners IX — current preview) gets the full fixture coverage (all 3 provenances, all 3 dispositions, both severities, CONDITIONAL verdict, ≥6 flags w/ questions, ≥2 standalone asks, all 8 source tiers, listen_for on every agenda item). The other 17 use a deterministic generator that varies verdict/tier/score/flag counts per fund but stays contract-shaped.
- **Component layout**: new `src/components/project/l1/` with one component per section + `L1OnePager.tsx` shell (sticky left/top nav, scroll-spy active state, smooth-scroll, anchor-target highlight pulse). Reuses `ScoreBadge`, `BenchmarkChip`, `KpiTile`, `SectionCard`, `CitationRefs`, severity classes, etc.
- **Cross-references**: a `RenderRefsProvider` indexes `sources[].id`, `flags.questions[].id`, `flags.items[].id`, `claims_ledger.claims[].id` for O(1) lookup; unresolved refs render a muted "?" chip + console.warn.
- **Tally → ledger filter**: shared `useLedgerFilters` Zustand-lite store (or context) so verdict pills can set filter state then anchor-scroll to ledger.
- **Wiring**: `ProjectDetail.tsx` swaps `L1SnapshotPage` for `<L1OnePager payload={RENDER_PAYLOADS[project.id] ?? buildFallbackPayload(project)} />`. The old `L1SnapshotPage.tsx` and its now-unused tab components stay on disk (untouched) but are no longer imported by the L1 route — keeps the diff focused and reversible. The legacy `SectionProvider` + `CommentsRail` continues to wrap so existing comment threads work on the new section ids.
- **Methodology modal**: extend existing `MethodologyModal.tsx` (or new wrapper) to accept the payload's coverage rows.
- **Conditional sections**: `meta.sections_present` honored — sections not listed neither nav-render nor body-render. The demo payload omits esg/science as required.
- **Empty states**: per FR-19 every section renders an explicit notice when its content object is empty; no blank cards.
- **No backend changes**: zero Supabase reads/writes for page content. Project row still loads for top-bar context.

## File Plan

- Add `src/types/renderContract.ts`
- Add `src/mocks/renderPayloads.ts` (+ small helper `src/mocks/buildPayload.ts` for the 17 generated funds)
- Add `src/components/project/l1/L1OnePager.tsx`
- Add `src/components/project/l1/sections/`: `VerdictSection.tsx`, `ExecSummarySection.tsx`, `FactsheetSection.tsx`, `ClaimsLedgerSection.tsx`, `FlagsQuestionsSection.tsx`, `ModulesSection.tsx`, `AgendaSection.tsx`, `SourcesSection.tsx`
- Add `src/components/project/l1/primitives/`: `StickySectionNav.tsx`, `CitationChip.tsx`, `ProvenanceField.tsx`, `DispositionBadge.tsx`, `SourceTierBadge.tsx`, `RefsContext.tsx`
- Add `src/components/project/l1/MethodologyDialog.tsx`
- Edit `src/pages/ProjectDetail.tsx` — swap L1 component import + render
- Keep `L1SnapshotPage.tsx` on disk, unimported

## Out of Scope (per PRD)

No backend wiring, no PDF export, no ODD/IC-memo changes, no new design system, no dashboard/login changes, no real fund data.

## Open question I'm assuming an answer to

You said "for every fund" — I'm taking that as "every fund must render through the new shape" (one flagship gets the full fixture-grade content; the other 17 get deterministic, contract-shaped variants so the demo holds on any tile). If you instead want all 18 hand-authored to fixture depth, say so and I'll write a longer mock file.
