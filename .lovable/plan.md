# L1 PRD v2.0 Migration Plan

## Goal

Transform the existing Nvestiv L1 demo into the architecture defined in `L1_PRD.md` v2.0, following the sequenced roadmap in `L1_Migration_Instructions.md`. The migration touches vocabulary, schema, sidebar IA, section content, scoring co-location, comments, new typed components, Meeting Mode, and the synthesis pipeline.

This is a large multi-month migration. Each phase is dependency-ordered — execute in order; do not parallelize across phases. Within a phase, tasks may be tackled in batches per chat message.

## What stays untouched

Dashboard route, deal table, AnalyticsCards (extended, not replaced), NewDealModal, ProjectTopBar shell, global Ask Iris sidebar, EmbeddedIrisChat on memo page, CommandSearch (⌘K), Notifications, BlockNote IC Memo (12-section seed), Realtime/no-polling pattern, Knowledge Graph (Fund/Domain/Entity), 13-node Analysis Log, Dataroom P1–P4, Sources A–G taxonomy, task_queue + dispatch-analysis pipeline scaffolding, multi-step NewDealModal, carry-forward inheritance.

## Phase 1 — Vocabulary & enum migrations (low risk, mechanical)

1.1 **Verdict vocabulary** [BREAKING] — Migrate `Pursue / Conditional Meet / Pass` → `Advance / Conditional Advance / Defer / Decline`. DB enum + backfill (Pursue→Advance, Conditional Meet→Conditional Advance, Pass→Defer; Decline new). Update `verdict-utils`, `RecommendationPill` (green/blue/amber/red), Dashboard FilterBar.

1.2 **Score tier scheme** [BREAKING] — Replace 4-bucket filter with 6 tiers: Exceptional (90–100), Strong (75–89), Adequate (60–74), Below Average (40–59), Concerning (1–39), Insufficient Data. Add `tier` column on `module_scores`. `ScoreBadge` shows numeric + tier.

1.3 **Hard Floor catalogue** [BREAKING] — Expand from 3 to 10 PE-specific floors (HF-01…HF-10). New `hard_floors` config table + `hard_floor_evaluations` per project. `HardFloorBanner` shows specific HF-ID + reason. Auto-set recommendation to `Decline` when any HF triggers.

1.4 **Hard Floor override** [ADDITIVE] — Add `override_state`, `override_reason` (≥20 chars), `override_author`, `override_at`. Modal in HardFloorBanner.

1.5 **Completeness / Confidence** [ADDITIVE] — Add `projects.completeness_pct` + `confidence_tier` (High ≥70, Medium 50–69, Low 30–49, Very Low <30 → auto-Defer). Add as third Hero metric on Overview + AnalyticsCards tile.

## Phase 2 — Sidebar restructure

2.1 **Reorder + rename** [BREAKING] — New 12-row sidebar: Overview / Investment Thesis / Market Reality / Team & Manager / Track Record / Economics / Regulatory & Ops / Risk Flags / Diligence Questions / ─divider─ / Sources / Analysis Log / Dataroom →. Add `?tab=` redirects from old slugs.

2.2 **Inline score chips** [ADDITIVE] — Each scored row right-aligns numeric (1–10) + tier label. Reg & Ops shows Pass/Conditional/Fail. Risk Flags shows count + ⚠. Insufficient Data shows `─ N/A`.

2.3 **Visual divider** [ADDITIVE] — 1px line between row 9 and row 10.

## Phase 3 — Section content reshuffle

3.1 **Overview** [BREAKING] — 5-block layout: Hero (Composite + tier, Recommendation, Confidence) → Hard Floor Banner (conditional) → Findings tiles → Executive Summary card (1-line verdict + Top 3 strengths + Top 3 risks + data gaps) → Fund Snapshot (6-group, Phase 3.10) → All Scores Summary table. Remove Source Materials + free-form Abstract.

3.2 **Investment Thesis** [BREAKING] — New tab: score badge, 3–5 takeaways, three-block thesis_summary (What betting on / Why now / How they win), conditional ESG card (Phase 6.1), sub-scores panel, 2–4 diligence Qs. Sub-score weights: Strategy Coherence 30, Differentiation 25, Market Timing 20, Execution 25.

3.3 **Market Reality** [BREAKING] — New tab: market_context_strip (sector_dynamics, Phase 6.5) → takeaways → claim_vs_market paired table with deviation flags (MATCH / AT_RANGE_TOP / AT_RANGE_BOTTOM / OUT_OF_RANGE_HIGH / OUT_OF_RANGE_LOW / MISMATCH / NO_BENCHMARK) → sub-scores → diligence Qs. Weights: Sector Consensus 30, Treatment vs Selection 25, Crowding 25, Macro 20.

3.4 **Team & Manager** [BREAKING] — Rename + tighten. Add team_grid with departure_flag. Sub-scores: Relevant Experience 25, Cohesion 20, Prior Firm 20, Bench 15, Key Person 20.

3.5 **Track Record** [BREAKING] — Rename Performance. Two layout variants: rich + first_time_fund (Insufficient Data + cross-ref to Team, excluded from composite). Add market_context_strip (vintage_performance). Extended `track_record_table` fields (as_of_date, pic, gross_irr_pct, gross_moic, max_sub_line_duration_days). Sub-scores: Realized 30, Quality of Marks 20, Sub-Line Distortion 15, Vintage Comparability 20, Attribution 15.

3.6 **Economics** [BREAKING] — New tab. market_context_strip (term_standards) → fee_benchmark_table with peer median/range + mandatory qualifiers ("1.5% on committed", "8% (hard)", "1.0% on invested after Year 6"). Sub-scores: Fee Reasonableness 25, Carry 20, GP Commitment 15, Waterfall 20, Offsets/Caps 20.

3.7 **Regulatory & Operational Hygiene** [BREAKING] — New tab, **NOT scored numerically** — emits Pass / Conditional Pass / Fail. 7 finding categories (SEC Reg, Litigation, Insolvency/Criminal, Adverse Media, Structural Guardrails CONDITIONAL on PE/VC + Pension/Endowment, Service Providers, Operational/Cyber). Hard Floor evidence panel. Excluded from composite.

3.8 **Risk Flags** [BREAKING] — Rename Risk → pure aggregator. Move Hard Floor Detail / Discrepancies / Regulatory & Litigation OUT to Reg & Ops. Each flag card: severity, source-section deep link, suggested follow-up. HF flags pinned top.

3.9 **Diligence Questions** [RENAME] — Rename Interrogatory Matrix. L1 shows only 3 columns (Question / Rationale / Satisfactory Answer Profile) grouped by section + Copy/CSV/Email actions. Hide GP Response Score editor in L1 (preserve for L2).

3.10 **Fund Snapshot** [BREAKING] — Replace flat 14-row with 6 grouped sections: Identity / Scale / Strategy / Economics / Lifecycle / Portfolio Construction. Conditional rows (taxIncentives, impactFocus, sfdrClassification) hidden when null/"No"/"None". Mandatory qualifier rules enforced.

## Phase 4 — Score-per-section co-location

4.1 **Eliminate Scorecard tab** [BREAKING] — Delete tab. Distribute: Composite → Overview hero (already there); Hard Floor Gates → Reg & Ops; 5-Dimension Rubric → inline section headers; Verdict → Overview hero; Meeting Conditions → Overview Exec Summary card; Tier Thresholds → "How is this computed?" disclosure.

4.2 **Migrate `module_scores`** [BREAKING] — New 5 dimensions with weights: Investment Thesis 15, Market Reality 20, Team & Manager 25, Track Record 20, Economics 20. Reg & Ops = Pass/Conditional/Fail (NOT in composite, feeds Hard Floors).

4.3 **Sub-scores with drill-down** [ADDITIVE] — Add `sub_scores` table or JSON column on `module_scores`. Each section header score is clickable → expands sub-score panel inline (4–5 dimensions, rationale ≤200 chars, source_refs).

## Phase 5 — Comments rail and aggregation

5.1 **Replace InsightsPanel with CommentsRail in L1** [BREAKING] — On L1 routes only (memo/L3 keeps EmbeddedIrisChat). Position-anchored, scroll-with-content, three filter tabs (All / Team / AI).

5.2 **Comment authoring per section / sub-card** [BREAKING] — New `comments` table (id, deal_id, section_id, sub_card_id?, author_id, body_md, parent_comment_id?, resolved_at, report_version, author_type). "Add comment" affordance on every header. Markdown body. Renders in 3 places (rail, page, local thread).

5.3 **Comments aggregation page** [ADDITIVE] — New route `/project/:id/comments`. Chronological. Filters: section / author / type / date. Click → deep link to source section.

5.4 **AI annotations as comments** [ADDITIVE] — `author_type` enum (human/ai). Synthesis pipeline writes high-severity flags as AI comments. Distinct "Nvestiv AI" attribution. NOT in Ask Iris chat history.

## Phase 6 — New typed components

6.1 **ESG validation card** [ADDITIVE] — Conditional on Investment Thesis (renders only if SFDR Article 8/9, OR impactFocus non-empty, OR explicit ESG narrative claims). gp_claims[] + process_matrix (Identification/Contribution/Monitoring/Disclosures) + esg_score (1.0–4.0 separate scale). Never penalizes absence.

6.2 **`sector_exposure_chart`** [ADDITIVE] — Three modes: weighted_chart (% disclosed), labeled_chips (named without %), single_label. Never fabricate equal-weight pie.

6.3 **`geography_map`** [ADDITIVE] — Three modes: weighted_map / highlighted_regions / labeled_chips. World map renderer.

6.4 **Dashboard citations** [ADDITIVE] — Inline citation rendering globally. Dotted underline / ⓘ icon / "Sources (N)" link. Hover tooltip with type icon, title, date, ≤240 char excerpt, "Open source →". Click-to-pin (stacked bottom-right). Source-type-specific open actions (deck slide / SEC EDGAR / web URL / Analysis Log).

6.5 **`market_context_strip`** [ADDITIVE] — Three variants (sector_dynamics in Market Reality, vintage_performance in Track Record, term_standards in Economics). Top-of-section, 4–6 metric cards + qualitative notes + footer. Never references the specific fund. Omitted entirely if no benchmark match.

## Phase 7 — Meeting Mode + Benchmark Database + Pipeline rewrite

7.1 **Meeting Mode** [ADDITIVE] — Top-bar `🎥 Meeting Mode` toggle. localStorage per user/deal. ON: Comments rail 420px / sidebar icon-only / +15% font / pinned diligence Qs / sub-scores expanded / hidden Analysis Log + Sources + All Scores table. Cache-first offline behavior. Analytics events.

7.2 **Static benchmark database** [ADDITIVE] — New `benchmarks` table or JSON config keyed by `{assetClass}::{subAssetClass}::{marketSegment}`. Schema covers sector_dynamics, vintage_performance, term_standards. 4-level fallback lookup. Seed v1.0 with 7 PE entries (Buyout Mid/Lower/Mega, Growth Mid, Healthcare Mid, Industrial Mid, Software Growth) sourced from Preqin/Bain/Cambridge/PitchBook. Quarterly refresh + stale flag.

7.3 **Insufficient Data first-class tier** [ADDITIVE] — Composite renormalization (4 sections at 7.0 + 1 ID = 70/100, NOT 56/100). Sidebar `─ N/A`. Auto-Defer when Completeness <30%.

7.4 **Per-section synthesis prompts** [BREAKING] — Replace single assembly prompt with 11 per-section prompts (Overview / Inv Thesis / Market Reality / Team / Track Record / Economics / Reg & Ops / Risk Flags / Diligence Qs / Sources). Each emits a structured Section object (not markdown). Persist in `report_sections`. Enables re-run individual section.

## Phase 8 — Polish & validation

8.1 **Sparse input QA** — 3 mandatory test scenarios: one-page tear sheet, unregistered fund (no Form ADV/D), first-time emerging manager. All produce credible reports with explicit Insufficient Data markers (not blanks, not hallucinations).

8.2 **Methodology disclosure** — "How is this computed?" modal on Overview showing the recommendation if/else ladder, 10 Hard Floors, six tiers, composite weights.

## Technical considerations

- **Phase ordering is mandatory.** Phase 1 enums underpin everything. Phase 2 sidebar must land before Phase 3 content moves. Phase 4 score migration depends on Phase 3 sections existing.
- **Migrations:** Each [BREAKING] vocabulary/schema change requires a Supabase migration with backfill of existing rows.
- **Composite renormalization:** add a unit test against the worked example in Phase 7.3.
- **Conditional rendering rules** (VCOC/ERISA, ESG, taxIncentives, impactFocus, sfdrClassification, first-time fund variant) should be implemented as predicates in a single `conditionals.ts` module so they're auditable.
- **Citation rendering (Phase 6.4)** is the highest-leverage UX win and is referenced by every section. Schedule it early in Phase 6.
- **`research_sources` already has the citation taxonomy** — Phase 6.4 is mostly UI work, not data work.
- **Pipeline rewrite (7.4)** is the biggest backend item. Land it after sections are in place so the new prompts target the new structure. The existing `pipeline_cache` machinery enables per-section re-runs cleanly.
- **CommentsRail (Phase 5)** introduces new realtime channels — extend the existing Realtime baton-pass pattern, do not poll.
- **Memory updates:** after each phase ships, update the relevant `mem://` files (l1-report-structure, sidebar-layout, layout-structure, ai-model-selection, etc.) to reflect new vocabulary and IA.

## Suggested sequencing for chat messages

Given the size, I recommend tackling this in approximately one phase per chat session, in order. Some phases (especially 3 and 6) may need to be split into 2–3 sessions. After your approval of this plan, I'll begin with **Phase 1 (vocabulary & enum migrations)** since it's mechanical, fully reversible via a migration, and unlocks every later phase.

