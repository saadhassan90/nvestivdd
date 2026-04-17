---
name: L1 Report Structure Lock
description: Locked deterministic skeleton for all uploaded fund reports — every section always renders, missing data shows [NOT DISCLOSED AT L1]
type: feature
---

## Locked Tab Order (never reorder, never hide)
Overview → Scorecard → Team → Strategy → Performance → Risk → Interrogatory Matrix → Sources → Analysis Log → Dataroom.

## Skeleton-First Rule
Every section card from PRD v1.0 renders for every fund. Missing fields show `<EmptyChip />` ([NOT DISCLOSED AT L1]) or "No data available" via `SectionCard empty`. **Never** conditionally hide a section based on data presence.

## Mapping Job (when a new report is uploaded)
Map incoming report characteristics into this fixed structure:
- **Cover Block (ProjectTopBar)**: report type, fund_name, gp_entity_name, working-name pills, analysis_date, scorecard version, composite_score, recommendation, score_tier.
- **Overview**: hero, abstract, KPI strip (composite, recommendation, hard floor, critical flag count, completeness), fund snapshot grid, source materials, cross-reference.
- **Scorecard**: composite hero, 3 hard-floor gates, 5-dimension rubric, verdict panel, meeting conditions, tier thresholds.
- **Team**: sponsor entity cards, person cards (education, employment, credentials, regulatory), governance, network, flags lanes, interrogatory subset.
- **Strategy**: thesis, portfolio construction, target company profile, term structure, economics, target returns, fee benchmark, flags, interrogatory subset.
- **Performance**: headline KPIs, scale & count, in-strategy breakdown, multiple expansion, securitizations, investor verification, reconciliation, benchmarks, flags, interrogatory subset.
- **Risk**: severity strip, CRITICAL cards, ELEVATED table, MONITOR table, category sub-tabs, hard-floor detail, discrepancies, regulatory & litigation, carry-forward.
- **Interrogatory Matrix**: count strip, filters, editable 0–3 scoring table, per-dimension toggle, scoring guide, no-meet threshold.
- **Sources**: A–G category nav, citations, disambiguation, confidence legend, negative-results ledger.
- **Analysis Log**: pipeline metadata, verification checklist, 4 domain research panels (8.1–8.4), market context, evidence gaps, cross-reference inheritance.
- **Dataroom**: submission quality KPIs, critical missing docs, P1–P4 priority accordions, completeness panel, action bar.

## Primitives (always reuse, never reinvent)
`SectionCard`, `EmptyChip`, `KpiTile`, `FieldValueGrid`, `FlagLane`, `VerdictBadges`, `HardFloorBanner`.

## Hard Rules
1. Adding a new field → extend an existing section's grid; do NOT create a new tab.
2. Missing data → `EmptyChip`, never blank, never hidden.
3. Tab labels and order are frozen per PRD v1.0.
4. Frontend is presentation-only; pipeline owns extraction/normalization.
