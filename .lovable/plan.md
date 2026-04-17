

## Plan: Restructure all L1 report tabs to match PRD v1.0

I'll rebuild every tab as a **deterministic skeleton** following the PRD exactly. Every section described in the PRD gets rendered for every fund, even when data is missing — empty sections show a muted `[NOT DISCLOSED AT L1]` chip or "No data available" placeholder so the layout is identical across every deal.

### Core principle: skeleton-first

Every tab becomes an ordered sequence of section cards. Each section has:
- A persistent header (always shown)
- A body that either renders data or shows an empty-state message
- No section is ever hidden — only its content varies

### Global chrome (applied across all tabs)

1. **Cover Block** (`ProjectTopBar`) — extend to show: report type label, fund name, working-name pills, sponsor line, analysis date, analyst, scorecard version, related prior report chip, composite score badge, recommendation badge (MEET / CONDITIONAL MEET / NO MEET), tier pill (Strong Advance / Advance / Review / Decline).
2. **Hard Floor banner** — global red banner at top of every tab when `trigger_fired` is true.
3. **Tab order** (`ProjectSidebar`) — reorder to PRD spec: Overview · Scorecard · Team · Strategy · Performance · Risk · Interrogatory Matrix · Sources · Analysis Log · Dataroom.
4. **URL sync** — `?tab=` reflects active tab.

### Tab-by-tab rebuild

**1. OverviewTab** → Hero Card · Abstract block · Findings Overview KPI strip (5 tiles: Composite, Recommendation, Hard Floor, Critical Flag count, Completeness %) · Fund Snapshot 2-col grid (14-17 rows) · Source Materials card · Cross-reference card.

**2. ScorecardTab** → Composite Score Hero · Hard Floor Gates Panel (3 cards) · 5-Dimension Rubric Grid (expandable rows showing flags/gaps/verification) · Composite Row · Verdict & Recommendation Panel · Meeting Conditions Panel (only renders content when CONDITIONAL MEET, otherwise shows skeleton with empty message) · Score Tier Thresholds legend (dual scale).

**3. TeamTab** → Sponsor Entity Cards (one per sponsor, side-by-side for co-GP) · Person Cards (education, employment chain, credentials, regulatory checks, deck-vs-research diff, confidence badge) · Team Governance strip · Team Network strip · Team Flags subsection (RED/YELLOW lanes) · Team Interrogatory subset.

**4. StrategyTab** → Thesis Card · Portfolio Construction (mini-chart) · Target Company Profile grid · Term Structure grid · Economics grid · Target Returns panel · Fee Benchmark Callout · Strategy Flags · Strategy Interrogatory subset.

**5. PerformanceTab** → Headline Metrics Strip (4 KPI tiles) · Scale & Count Grid · In-Strategy Breakdown toggle · Multiple Expansion Panel · Securitizations table · Investor Verification Panel · Performance/Scale row · Reconciliation Note · Benchmarks Callout · Performance Flags · Performance Interrogatory subset.

**6. RedFlagsTab → renamed "Risk"** → Severity Summary Strip (Critical / Elevated / Monitor + Inherited badge) · CRITICAL Flag Cards · ELEVATED table · MONITOR table · Category sub-tabs (Team/Track Record/Strategy/Domain/Structure) · Hard Floor Gate Detail · Discrepancies Found panel · Regulatory & Litigation panel · Carry-forward callout.

**7. InterrogatoryTab → "Interrogatory Matrix"** → Question Count Strip · Priority + Category filter chips · Questions Table (with editable 0–3 GP Response Score, audit log to localStorage, Export CSV button) · Per-Dimension View toggle · Scoring Guidance Footer · No-Meet Conversion Threshold banner.

**8. SourceFilesTab → "Sources"** → Source Categories Navigator (left rail, A–G taxonomy) · Citations List (APA-style, access-status icon) · Disambiguation Panel · Confidence Legend · Negative-Results Ledger (always rendered).

**9. ProcessingState (Analysis Log)** → keep existing pipeline UI but add: Pipeline Metadata card · Verification Actions Completed checklist · Domain Research blocks (4 panels: 8.1–8.4 with 9-item questionnaire) · Market Context card · Evidence Gaps Register table · Cross-reference Inheritance map.

**10. DataRoomTab → "Dataroom"** → Submission Quality Strip (4 KPIs) · Critical Missing Documents card · Priority Checklist (4 accordion groups: P1 Deal-Breaker, P2 Essential, P3 Supporting, P4 Nice-to-Have) · Completeness Verification panel · Upload/Request Action bar.

### Shared primitives to create

- `SectionCard` — header + empty-state wrapper used by every section
- `EmptyChip` — `[NOT DISCLOSED AT L1]` muted chip for missing field values
- `KpiTile` — used by Findings Overview, Severity, Headline Metrics, etc.
- `FieldValueGrid` — 2-column field/value table with empty handling
- `FlagLane` — RED/YELLOW lane renderer used by category-filtered subsections
- `RecommendationBadge` / `TierPill` / `BandBadge` — verdict scale primitives

### Files to create

- `src/components/project/primitives/SectionCard.tsx`
- `src/components/project/primitives/EmptyChip.tsx`
- `src/components/project/primitives/KpiTile.tsx`
- `src/components/project/primitives/FieldValueGrid.tsx`
- `src/components/project/primitives/FlagLane.tsx`
- `src/components/project/primitives/VerdictBadges.tsx`
- `src/components/project/primitives/HardFloorBanner.tsx`

### Files to rewrite (skeleton-first)

- `src/components/project/OverviewTab.tsx`
- `src/components/project/ScorecardTab.tsx`
- `src/components/project/TeamTab.tsx`
- `src/components/project/StrategyTab.tsx`
- `src/components/project/PerformanceTab.tsx`
- `src/components/project/RedFlagsTab.tsx` (relabel "Risk")
- `src/components/project/InterrogatoryTab.tsx` (add inline editing + CSV export + per-dim toggle)
- `src/components/project/SourceFilesTab.tsx` (relabel "Sources", add A–G nav, negative ledger)
- `src/components/project/DataRoomTab.tsx` (4 priority accordions + KPI strip)
- `src/components/project/ProcessingState.tsx` (add 6 Analysis Log sections)
- `src/components/project/ProjectSidebar.tsx` (reorder + relabel tabs to PRD spec)
- `src/components/project/ProjectTopBar.tsx` (full Cover Block per PRD §3.2)
- `src/pages/ProjectDetail.tsx` (URL `?tab=` sync, hard-floor global banner, pass missing data flags through)

### Verification step (after build)

I'll walk through PRD §8 (the 86-row coverage matrix) and confirm each row maps to a rendered section in the skeleton. Anything missing gets added before delivery.

### Out of scope (intentional, per PRD §6.3)

Pre-synthesis fact-gathering input format (Hometap 5-Pillar) is rejected upstream; no special handling here. Pipeline data shape (which JSON keypaths populate which DB columns) stays as currently mapped — this PR is **frontend rendering only**.

