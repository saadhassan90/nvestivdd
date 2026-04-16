

# Report-to-App Mapping: Complete Section Breakdown

## Report Structure (11 Sections)

The L1 report has 11 sections. Here is how each section and its sub-parts map to the app's existing tabs.

---

## Tab Mapping

### 1. OVERVIEW TAB
Receives content from **4 report sections**:

| Report Section | Sub-part | UI Treatment |
|---|---|---|
| **Section 1 — Cover** | Key-value table (fund name, GP, strategy, geography, fund size, vintage, etc.) | **Fund Profile Card** — structured key-value grid at top of overview |
| **Section 1 — Cover** | Abstract paragraph | **Abstract Card** — prose summary below the profile card |
| **Section 1 — Cover** | Findings Overview paragraph | **Findings Summary Card** — expandable prose block |
| **Section 2 — Verdict** | Composite Score, Recommendation, Hard Floor Override | **Score Ring + Verdict Badge** (already exists) |
| **Section 2 — Verdict** | Rationale paragraph | **Verdict Rationale Card** — prose narrative explaining the score |
| **Section 3 — Hard Floor Status** | 3-gate table (Team Integrity, Entity Legitimacy, Track Record) | **Hard Floor Gates Card** — 3 rows with PASS/FAIL badges and findings |
| **Section 4 — Scorecard Summary** | 5-dimension scoring table | **Dimension Scores Card** — 5 rows with score bars, bands, and rationales |
| **Section 10 — Conclusion** | Full conclusion prose | **Conclusion Card** — full-width prose block at bottom of overview |

### 2. TEAM TAB
Receives content from **Section 7.1 (People)**:

| Sub-part | UI Treatment |
|---|---|
| Each named person (Preston, Glasgow, Donaldson, Russell, Matthews, Kasper, Morris, Harris) | **Team Member Card** — one card per person with name, title, tenure, bio narrative, verification status badge |
| Regulatory & litigation scan summary | **Compliance Status Card** — single card showing "all clean" with source list |
| Section 7.6 — Network (team affiliations) | **Network & Affiliations Card** — sponsor ecosystem connections, prior-firm overlap |

### 3. PERFORMANCE TAB
Receives content from **Section 7.3 (Track Record)**:

| Sub-part | UI Treatment |
|---|---|
| Program-level summary (fund sizes, committed, deployed, co-invest count) | **Program Summary Card** — key metrics grid (4 programs, $519M deployed, 170 co-invests) |
| Co-investment realized returns (2.8x MOIC, 27% IRR) | **Headline Returns Card** — large metric display with MOIC and IRR |
| Deal-level verification (5 sampled deals + 2 recent) | **Deal Verification Table** — each deal as a row with name, date, sponsor, verified status, notes |
| Fund-level HPEP I–IV returns | **Vintage Performance Card** — table of each vintage with MOIC, IRR, DPI, verification status |
| Section 7.5 — Claims table (verified/unverified/contradicted) | **Claims Verification Card** — table with status badges (green verified, yellow unverified, red contradicted) |
| Recent 2026 activity (Joe Van Gogh, Caring.com) | Part of the Deal Verification Table with "2026" badge |

### 4. STRATEGY TAB
Receives content from **3 report sections**:

| Report Section | Sub-part | UI Treatment |
|---|---|
| **Section 7.4 — Strategy** | Core thesis, sourcing edge, target profile | **Investment Thesis Card** — structured prose with key claims |
| **Section 7.4 — Strategy** | Critical strategy gap (regime shift analysis) | **Strategy Risk Card** — highlighted warning block with the deleveraging arbitrage analysis |
| **Section 8 — Domain Research** | 8.1 LMM PE market conditions | **Market Environment Card** — structured findings with NEUTRAL/SUPPORTS/CONTRADICTS badges |
| **Section 8 — Domain Research** | 8.2 Co-Investment Submarket | **Co-Investment Market Card** — pace benchmarks, fee norms, assessment badge |
| **Section 8 — Domain Research** | 8.3 LMM Exit Environment | **Exit Environment Card** — hold periods, exit channels, timing expectations |
| **Section 8 — Domain Research** | 8.4 Regulatory Environment | **Regulatory Card** — SEC regime, enforcement trends, Advisory Board governance concern |

### 5. RED FLAGS TAB
Receives content from **Section 5 — Flags**:

| Sub-part | UI Treatment |
|---|---|
| RED flags grouped by dimension (Team, Track Record, Strategy, Domain, Structure) | **Red Flag Cards** — one card per flag with ID badge (R-T1, R-S1, etc.), severity indicator, full narrative, and source citations |
| YELLOW flags grouped by dimension | **Yellow Flag Cards** — same layout, amber severity indicator |
| Group headers (Team, Track Record, Strategy, Domain/Market, Structure) | **Dimension Group Headers** — collapsible sections grouping flags by category |

### 6. INTERROGATORY TAB
Receives content from **2 report sections**:

| Report Section | Sub-part | UI Treatment |
|---|---|
| **Section 6 — Meeting Conditions** | 4 conditional-meet requirements | **Meeting Conditions Card** — numbered list with flag cross-references and "gate" styling |
| **Section 9 — Meeting Questions** | 13 questions grouped by dimension | **Question Cards** — one per question with columns: Question, Rationale, Satisfactory Answer. Grouped under Dim 1–5 headers |

### 7. DATA ROOM TAB
Receives content from **Section 7.7 — Gap Register**:

| Sub-part | UI Treatment |
|---|---|
| 25-item gap register table | **Data Room Checklist** — each row becomes a checklist item with: data point, expected source, L1 status badge, L2 routing action |
| Items cross-referenced to Meeting Conditions | **Conditional-Meet Badge** on relevant items linking back to Section 6 gates |

### 8. DOCUMENTS (SOURCE FILES) TAB
Receives content from **Section 11 — Source Appendix**:

| Sub-part | UI Treatment |
|---|---|
| Category A: Primary GP materials | **Source Group Card** — "Primary GP Materials" with citation list |
| Category B: Regulatory sources | **Source Group Card** — "Regulatory Sources" |
| Category C: Court/litigation sources | **Source Group Card** — "Court & Litigation" |
| Category D: Market data/third-party research | **Source Group Card** — "Market Data & Research" |
| Category E: Deal-specific press | **Source Group Card** — "Deal-Specific Press" |
| Category F: LP/allocator searches (negative results) | **Source Group Card** — "LP Disclosure Searches" with "no match" badges |
| Category G: Consulted — no findings | **Source Group Card** — "Consulted — No Findings" |
| Section 7.2 — Entity verification | **Entity Verification Card** — adviser, fund, sidecar, prior vehicles with registration details |

---

## Implementation Plan

### Step 1: Update the markdown parser
Extend `markdown-sections.ts` to recognize all 11 sections and sub-sections (7.1–7.7, 8.1–8.4) and map them to the correct tabs with granular sub-section extraction.

### Step 2: Create structured content components
For each tab, build the card components described above that render structured data extracted from the markdown. Each card parses its section's markdown into structured elements (tables, prose, key-value pairs) rather than rendering raw markdown.

### Step 3: Update each tab component
Replace or augment the current `ReportMarkdownSection` (raw markdown dump) with the new structured card layouts for each tab. The tabs will display a curated, card-based layout where each report sub-section gets its own visual treatment.

### Step 4: Update tab keyword mapping
Revise `TAB_KEYWORDS` in `markdown-sections.ts` so each tab pulls exactly the right sections and sub-sections as mapped above.

### Step 5: Wire up ProjectDetail.tsx
Pass the granular section data to each tab component so they can render the structured cards.

---

### Files to create/modify

| File | Action |
|---|---|
| `src/lib/markdown-sections.ts` | Extend parser for sub-sections (7.x, 8.x) and update tab mapping |
| `src/components/project/OverviewTab.tsx` | Add Cover, Verdict Rationale, Hard Floor, Scorecard, Conclusion cards |
| `src/components/project/TeamTab.tsx` | Add per-person cards, compliance card, network card |
| `src/components/project/PerformanceTab.tsx` | Add program summary, deal verification, claims, vintage cards |
| `src/components/project/StrategyTab.tsx` | Add thesis, strategy risk, 4 domain research cards |
| `src/components/project/RedFlagsTab.tsx` | Group flags by dimension with RED/YELLOW severity cards |
| `src/components/project/InterrogatoryTab.tsx` | Add meeting conditions card + 13 question cards by dimension |
| `src/components/project/DataRoomTab.tsx` | Render 25-item gap register as checklist |
| `src/components/project/SourceFilesTab.tsx` | Render 7 source-category groups + entity verification |
| `src/pages/ProjectDetail.tsx` | Pass granular section data to tabs |

