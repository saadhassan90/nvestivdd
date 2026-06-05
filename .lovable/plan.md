## L1 Page Revisions

Addressing the demo-blocking items. Items 3 and 11 deferred per earlier call.

### 1. Scores get a verdict, not just a number
- **Composite score**: plain-language verdict line ("Take the meeting — strong fit on thesis and team" / "Defer — track record gaps") + the top 3 questions to ask if the meeting is taken.
- **Module scores**: every module score renders with an **Above average / Average / Below average** label next to the number. Tier color still drives the badge.
- Short 1-line rationale under each module score explaining the label.

Touches: `ScoreBadge`, composite header in `OverviewTab`, each module section header.

### 2. Self-contained, fully legible cards
Remove text truncation on body content across every L1 card (titles only may truncate). Cards expand vertically. Click only required for deep evidence/citation drill-in, never to read the primary point.

Touches: `SectionCard`, `MarkdownSectionCards`, `ReportMarkdownSection`, all per-tab card components.

### 4 + 5. Module accordions: content → flags → flag-bound questions
Every module section (Thesis, Team, Track Record, Economics, Macro Context, Reg & Ops) follows the same shape:

1. **Module content** — substantive analysis cards (made fully legible per #2).
2. **Flags in this module** — inline list of `red_flags` filtered by `module`/`source_module`. Each flag renders:
   - Flag title + severity dot
   - **Why it was raised** — the observation / what we unearthed
   - **Questions tied to this flag** (from `interrogatory_items.related_red_flag_ids`), each with:
     - The question
     - **Rationale** — why we're asking / what we're trying to fill
     - **Good answer direction** — what a satisfactory response looks like
     - **Bad answer direction** — the red-flag-confirming response

No freestanding questions. Anything without a `related_red_flag_ids` link gets grouped under "Unattributed observations" at the bottom of the relevant module (data-quality signal).

The standalone Risk Flags tab stays as the cross-module roll-up. `InterrogatoryTab` becomes a roll-up index pointing back to in-context flag blocks. Section headers show a small "N flags here" chip.

Touches: new `ModuleFlagBlock` + `FlagQuestionCard` primitives wired into every module tab.

**Schema add** (one migration): `interrogatory_items` gets `good_answer_direction text` and `bad_answer_direction text`, both nullable. Render "—" until populated.

### 6. Rename to "Macro Context"
Rename "Market Reality" → **Macro Context** everywhere user-facing. Section copy expanded to cover *why this strategy* + *why this geography/sector*. Tab key stays `market_reality` internally to preserve saved comments/citations.

### 7. *(awaiting input — please complete)*

### 8. Benchmark in every card
- Embed a small benchmark line in each scored card.
- Track Record uses **quartile** labels when `benchmarks.vintage_performance` exposes them ("Second quartile vs. 2021 Asia PE").
- Other modules use **Above average / Average / Below average** (matches module score labels).
- Missing data: "Benchmark: insufficient data" — never vague filler.

Touches: new `BenchmarkChip` primitive; `benchmarks.ts` label mapping.

### 9. Expand affordance before the name
Move chevron / expand indicator to the **left** of the title on expandable cards.

Touches: `SectionCard` header layout.

### 10. Fund fact sheet
New "Fund Fact Sheet" card pinned at top of Overview:
| Manager | Strategy | Vintage | Fund Size | Domicile | Target Return | Mgmt Fee | Carry | Hurdle | Term |
Pulls from `projects` + `fee_structure`. 2-col mobile, 4-col desktop. Empty fields show "—".

Touches: new `FundFactSheet` in `src/components/project/`, added to top of `OverviewTab`.

### NEW. Inline citation tags everywhere
Every finding, claim, score rationale, flag observation, and benchmark line gets **inline citation tags** at the end of the sentence/bullet.

- Reuse the existing `CitationRefs` primitive (dotted chip, hover tooltip, click-to-pin), which already shows source type icon, title, accessed date, excerpt, and an "Open source" link.
- **Source labels in the chip** reflect what the source actually is:
  - Uploaded GP deck → deck filename (e.g. "Asia Growth III — Deck.pdf")
  - Other uploaded documents → uploaded filename
  - Web sources → provided source name (publisher / domain title), not raw URL
  - Regulatory filings → registry name (e.g. "SEC EDGAR — Form ADV")
- Tooltip contents (already supported): type icon, title, date, ≤240-char excerpt, **Open source / Open document / Open SEC EDGAR** link.
- For uploaded files without a public URL, the "Open" action opens the document in-app (Data Room viewer) instead of an external link.

**Coverage pass** — wire `CitationRefs` (or `CitationChips` where space is tight) into:
- Every card body bullet across module tabs
- Module score rationale lines
- Composite verdict line
- Flag "Why it was raised" text
- Question rationale + good/bad answer directions when sourced
- Fund fact sheet rows where a value has a citation

**Data plumbing**: most tables already carry `citation_ids` (`thesis_validations`, `competitive_landscape`, `market_factors`, `performance_metrics`) or analogous fields. Where citation linkage is missing today (e.g. `red_flags`, `interrogatory_items` rationale), surface whatever is present and degrade gracefully (no chip rendered) — no schema work required.

### Deferred (per user)
- **Item 3** — strongest/weakest contributor per module.
- **Item 11** — multi-fund comparison view.

### Rollout order
1. Migration: `interrogatory_items.good_answer_direction` + `bad_answer_direction`.
2. Rename to Macro Context + label cleanup.
3. Fund fact sheet + score verdicts with Above/Average/Below labels.
4. Card legibility pass + chevron move.
5. Module accordion restructure: content → flags → flag-bound questions with rationale + good/bad answers.
6. Embedded benchmark chips.
7. Inline citation tag coverage pass across every card, score line, flag, and question.