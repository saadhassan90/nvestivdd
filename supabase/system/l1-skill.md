---
name: l1-due-diligence
description: >
  Run a Level 1 Pre-Data Room Due Diligence analysis on an alternative investment fund submission.
  Use this skill whenever the user asks you to analyze a fund, run due diligence, produce an L1 report,
  review a pitch deck or DDQ for an alternative fund, or evaluate a GP submission. Also trigger when the
  user mentions "L1", "pre-data room", "preliminary report", "fund screening", "alternative fund analysis",
  or uploads PDF files that appear to be fund pitch decks, investor letters, DDQs, or similar GP marketing
  materials. This skill produces a comprehensive, institutional-grade L1 Preliminary Report with inline
  citations and end-of-report source appendix.
---

# L1 Pre-Data Room Due Diligence Analysis

This skill produces an institutional-grade Level 1 Preliminary Report from GP marketing materials (pitch decks, DDQs, investor letters, factsheets) submitted before a formal data room is opened. The analysis combines document extraction with autonomous web research across five modules, then synthesizes findings into a scored recommendation with red flags, interrogatory questions, and a data room request checklist.

The process is designed as a glass box — every factual claim traces back to either a source document or a specific research finding, and the report includes both inline citations and an end-of-report source appendix.

## When to Use This Skill

Trigger when you receive one or more PDFs that are fund marketing materials and the user wants an analysis, screening, or due diligence report. Typical inputs include pitch decks (most common), DDQs, executive summaries, investor letters, monthly performance reports, or factsheets. The user may provide a single deck or a bundle of 2-5 documents for the same fund.

## Input Requirements

At minimum, you need one PDF document from the fund. Before starting analysis, extract and classify every provided document:

- **Pitch Deck** — The primary marketing document. Usually 20-60 pages. Contains strategy overview, team bios, performance data, and portfolio highlights.
- **DDQ (Due Diligence Questionnaire)** — Structured Q&A document. Dramatically improves Modules D and E when available.
- **Investor Letter / Quarterly Report** — Performance commentary and portfolio updates. Improves Module A.
- **Executive Summary / Factsheet** — Condensed fund overview. Supplements the deck.
- **Term Sheet** — Fund economics. Rare at pre-data room stage but transformative for Module D.

Create a document manifest listing each file, its classification, page count, and date. This manifest feeds into the Submission Quality Assessment.

## The L1 Process: 13 Nodes

The analysis runs through 13 sequential nodes. Nodes 2-6 (the five analysis modules) can run in parallel because they are independent of each other. Everything else is sequential.

Read `references/report-template.md` for the exact output format of each section before beginning.

---

### Node 0: Document Ingestion & Classification

Read every provided PDF. Extract all text content. For each document:

1. Classify its type (Pitch Deck, DDQ, Investor Letter, Factsheet, Term Sheet, Other)
2. Note its date, page count, and what information categories it covers
3. Flag any quality issues (stale dates, missing pages, watermarks indicating draft status)

Record the classification in a manifest that becomes part of the report header:

```
**Source Materials:** [Document name] ([Type], [Page count] pages, [Date])
```

This node determines how much raw material each module has to work with. A deck-only submission means Modules D and E will operate at reduced capacity and lean heavily on research.

---

### Node 1: Phase 1A — Triage

The quick first pass. Produces three outputs in Section 2 of the report.

**Step 1.1 — Completeness Scoring**

Check the submission against the institutional pre-data room checklist. Score each category:

| Category | What to Look For |
|----------|-----------------|
| Strategy & Thesis | Investment approach, market opportunity, differentiation |
| Team Bios & Experience | Named professionals, backgrounds, track records |
| Performance Track Record | Returns by period, benchmarks, risk metrics |
| Fund Mechanics/Terms | Fees, lockups, redemption, GP commitment |
| Risk Management Framework | Portfolio limits, stress testing, risk committee |
| Operational Setup | Service providers, compliance, infrastructure |
| Investor Base / References | Existing LPs, capital raised, reference contacts |
| Regulatory Filings | SEC registration, FINRA, international registrations |
| Financial Statements | Audited financials, NAV history |

**IMPORTANT: ESG/DEI categories are NOT part of the completeness checklist.** Do not include ESG, DEI, sustainability, or similar categories as scored items. Their absence must never reduce the completeness percentage or trigger a severity rating.

Each category gets a status (Complete / Partial / Minimal / Not Provided), a confidence level (High / Medium / Low / N/A), and a severity rating for gaps (— / Monitor / Elevated / Critical).

Calculate the completeness percentage. Deck-only submissions typically score 55-70%. Deck + DDQ + support docs can reach 80-90%.

**Step 1.2 — Document Quality Flags**

Assess six dimensions: Freshness, Completeness, Professionalism, Forward-Looking Statements, Disclaimers, Performance Claims. Each gets a one-word rating and a brief assessment.

**Step 1.3 — Critical Information Gaps**

List 5-10 specific pieces of missing information that would be needed for a full assessment, numbered, with explanations of why each matters for the investment decision. Do NOT list ESG/DEI/sustainability information as a critical gap — these are optional and their absence is not a gap.

---

### Node 2: Module A — Financial & Performance Assessment

This module extracts and contextualizes all quantitative data.

**Step 2.1 — Performance Data Extraction**

Extract every numerical performance claim from the source materials into structured tables:

- Fund returns by period (1M, 3M, 6M, 1YR, 3YR, 5YR, ITD) — net of fees
- Benchmark comparison data (identify the appropriate benchmark for the strategy)
- Risk metrics: volatility, beta, Sharpe ratio, max drawdown, Sortino ratio
- Portfolio characteristics: yield, duration, exposure, concentration

Format these as markdown tables with Fund | Benchmark | Alpha/Difference columns.

**Step 2.2 — Fee Structure Extraction**

Extract all disclosed fee terms: management fee, carried interest/incentive fee, hurdle rate, high-water mark, GP commitment, expense ratio, lockup period, redemption frequency, early redemption penalties. Structure by share class if multiple classes exist.

When fee information is incomplete, explicitly state what's missing rather than guessing.

**Step 2.3 — Autonomous Research: Performance Validation**

Search for:
- Public fund performance data (Bloomberg, Morningstar, eVestment, Preqin if accessible)
- Benchmark index returns for the relevant strategy and time periods
- Peer fund performance for competitive context
- Any third-party commentary or ratings on the fund

Use this research to validate or challenge the claims in the deck. Note discrepancies.

**Step 2.4 — Risk Metric Assessment**

Evaluate risk-adjusted returns, concentration risk (top 5 positions, sector weights), liquidity profile, leverage indicators, and drawdown history. Where hard data isn't available, state the limitation and assign lower confidence.

**Inline Citations:** Every data point from research gets an inline citation. Format: `[Source Name](URL)` or `[Source Name, Date]` for non-URL sources. See the Inline Citations section below.

**Output:** Section 3 of the report. Include a module score (0-100) and confidence level (High/Medium/Low).

---

### Node 3: Module B — Team & Management Assessment

This module validates biographical claims and assesses governance structure.

**Step 3.1 — Team Extraction**

Create a structured roster from source materials: Name, Title, Years of Experience, Prior Affiliations, Education, Notable Credentials. Format as a markdown table.

**Step 3.2 — Autonomous Research: Biographical Verification**

For each key team member (typically 3-6 principals), search for:

- **LinkedIn profiles** — Verify employment history, education, connections
- **SEC Form ADV** — Confirm registration, disclosed regulatory history
- **FINRA BrokerCheck** — Check for disciplinary actions, customer complaints
- **News/press coverage** — Awards, features, speaking engagements, controversies
- **Academic/publication records** — Validate expertise claims
- **Prior employer verification** — Confirm roles at previous firms (especially AUM claims)

Document what you verified and what you could not verify. Distinguish between "Verified via [source]", "Partially verified", and "Unable to verify."

**Step 3.3 — Governance Structure Analysis**

Evaluate: key person concentration risk, segregation of duties (watch for one person holding COO/CFO/CCO simultaneously), succession planning, team depth relative to AUM, and compensation alignment.

**Step 3.4 — Adverse Media & Regulatory Search**

Specifically search for: SEC enforcement actions against the firm and individuals, FINRA disciplinary history, adverse news coverage, litigation, regulatory warnings, and political exposure. Report findings even when the search comes back clean — a clean record is itself a finding worth documenting.

**Output:** Section 4 of the report with team table, strengths/weaknesses, research validation, and module score.

---

### Node 4: Module C — Strategy & Market Validation

The strongest module because it leverages autonomous research most heavily. The efficacy testing showed this module consistently produced the most substantive analysis regardless of input material quality.

**Step 4.1 — Thesis Extraction**

Distill the fund's core investment thesis into 2-3 sentences. Identify the specific market inefficiency or opportunity the fund claims to exploit.

**Step 4.2 — Autonomous Research: Thesis Validation**

For each major thesis claim, independently research whether it holds up:

- **Market data** that confirms or contradicts specific claims (market size, disclosure rates, pricing dynamics)
- **Academic research** on the underlying economic relationships
- **Regulatory and policy trends** that affect the strategy
- **Competitive landscape** — who else is doing this, how differentiated is this fund
- **Macro tailwinds and headwinds** — structural factors that help or hinder the strategy

Rate each thesis claim: Verified / Partially Verified / Unverified / Contradicted, with a confidence level and the research source.

**Step 4.3 — Competitive Landscape**

Research direct competitors, assess differentiation, identify barriers to entry, and evaluate market timing. This is where you search for other funds with similar strategies and assess whether this fund's approach is genuinely unique.

**Step 4.4 — Headwinds & Tailwinds**

Structure a balanced assessment of macro factors. Be specific — not "regulatory changes could affect the strategy" but "SFDR Article 8 registration in Europe positions the fund well for EU institutional capital, but increasing HY ESG disclosure rates (~10pp per 3 years) may narrow the information asymmetry the fund exploits."

**Output:** Section 5 of the report with thesis validation table, competitive landscape, tailwinds/headwinds, and module score.

---

### Node 5: Module D — Terms & Structure Assessment

**Step 5.1 — Term Extraction**

Extract all disclosed terms: management fee, carry, hurdle rate, fund size/target, lockup period, redemption frequency, high-water mark, GP commitment, fee offsets/rebates, side pocket provisions, ERISA eligibility.

**Step 5.2 — Benchmarking Against Norms**

Compare extracted terms against institutional norms for the specific asset class and strategy. A 2/20 structure means different things for PE vs. liquid credit. Flag terms that are above-market, below-market, or unusual.

**Step 5.3 — Alignment Assessment**

Evaluate GP-LP alignment: meaningful GP co-investment? Appropriate clawback? Fee ratcheting that rewards scale? Hurdle rate that protects LP interests?

**Step 5.4 — Gap Identification**

Explicitly list every term that cannot be assessed from the available materials. This module will be thin for deck-only submissions — that's expected and should be stated clearly.

**Output:** Section 6 of the report with terms table, benchmarking, alignment assessment, and module score. Confidence is typically Low for deck-only, Medium-High when DDQ or term sheet is available.

---

### Node 6: Module E — Operational Quick-Check

**Step 6.1 — Service Provider Identification**

Look for named service providers: auditor, fund administrator, custodian, prime broker, legal counsel. Note whether each is named, implied, or absent.

**Step 6.2 — Autonomous Research: Regulatory Verification**

Search:
- **SEC EDGAR** for Form ADV filings (confirms registration, AUM, fee structure, conflicts)
- **FINRA BrokerCheck** for broker-dealer registration
- **FCA Register** for UK-regulated entities
- **Other regulators** as appropriate for the fund's jurisdiction
- **SEC Enforcement Actions database** for any actions against the firm

**Step 6.3 — Operational Risk Assessment**

Evaluate: segregation of duties, valuation methodology (if discernible), business continuity posture, cybersecurity indicators, insurance coverage. Most of this requires data room documents, so this section should be honest about its limitations.

**Output:** Section 7 of the report. Like Module D, this operates at reduced capacity without a DDQ.

---

### Node 7: Red Flag Synthesis

After all five modules are complete, review every finding across all modules and identify anything that constitutes a risk, concern, or anomaly.

**IMPORTANT: Absence of ESG/DEI is NEVER a red flag.** Do not flag the absence of ESG policies, DEI initiatives, sustainability frameworks, or similar programs at any severity level. If the fund has these programs, they may be noted as context in the relevant module, but their absence must not appear in the red flag summary.

**Severity Classification:**

- **CRITICAL** — Must be resolved before commitment. These are potential deal-breakers. Examples: no named auditor/administrator, key person concentration with no succession plan, material performance discrepancies, undisclosed regulatory actions.
- **ELEVATED** — Require clarification before commitment. Material but not necessarily fatal. Examples: fee opacity, engagement outcome ambiguity, unknown investor base.
- **MONITOR** — Track in annual reviews. Not pre-commitment blockers. Examples: credit cycle sensitivity, regulatory uncertainty, small team size.

For each flag, document:

| Field | Content |
|-------|---------|
| Issue | What the problem is, specifically |
| Severity | CRITICAL / ELEVATED / MONITOR |
| Implication | Why this matters for the investment decision |
| Resolution | What needs to happen to address this |
| Timeline | When this must be resolved (pre-commitment / annual review) |

End with a summary scorecard table: Severity | Count | Status.

**Output:** Section 8 of the report.

---

### Node 8: Interrogatory Matrix

Generate targeted questions for the GP meeting, drawn from anomalies and gaps found across all modules.

For each module, generate 4-6 questions. Each question includes:

| Field | Content |
|-------|---------|
| # | Module letter + number (A1, A2, B1, etc.) |
| Question | The specific question to ask, with enough context that the GP understands what you're after |
| Rationale | Why this question matters — what finding or gap prompted it |
| Priority | CRITICAL / HIGH / MEDIUM (mapped from the severity of the underlying issue) |

CRITICAL priority questions address critical red flags. HIGH priority questions address elevated flags and material gaps. MEDIUM priority questions deepen understanding.

Do NOT generate interrogatory questions about ESG/DEI absence. If the fund has an ESG/DEI program and there are legitimate questions about its implementation or claims, those are fair game. But do not ask "why don't you have an ESG policy?" — that is not a gap.

Include a scoring system for GP responses (0-3 scale) and red flag thresholds that trigger further action.

The interrogatory matrix is one of the highest-value outputs because it synthesizes the entire analysis into an actionable meeting agenda. Make the questions specific and pointed — not generic templates, but questions that could only come from having analyzed this specific fund.

**Output:** Section 9 of the report.

---

### Node 9: Data Room Request Checklist

Generate a prioritized document request list.

**Priority 1: Deal-Breaker Documents** — Cannot make commitment decision without these. LPA, Form ADV, audited financials, administrator documentation, service provider verification, key person documentation.

**Priority 2: Essential Documents** — Required pre-commitment. Fee calculations, portfolio/performance detail, risk management framework, regulatory/compliance docs, investor/capital raising history.

**Priority 3: Supporting Documents** — Required for full diligence. Engagement documentation (if applicable), investment process docs, organizational docs, operational docs, marketing materials.

**Priority 4: Nice-to-Have** — Helpful but not blocking. Management meeting notes, competitive analysis, regulatory correspondence, valuation docs, academic/research support. ESG/DEI/sustainability documentation may be listed here ONLY with the explicit note "(if applicable — optional)" — it must never appear in Priority 1-3.

Each item should have sub-bullets specifying exactly what's needed (not just "audited financials" but "annual audited statements for each calendar year since inception, audit opinion, management letters, auditor name and contact").

End with a completeness verification: how many items received in the deck, how many found via research, how many remain as data room gaps, estimated response time, and recommended next steps.

**Output:** Section 10 of the report.

---

### Node 10: Scoring & Final Recommendation

**Step 10.1 — Module Score Aggregation**

Each module (A-E) has produced a score (0-100) and confidence level. Weight the modules for aggregation:

- Modules B and C carry more weight at pre-data room stage because they leverage autonomous research most effectively
- Modules D and E carry less weight when only a deck is available (their scores are heavily constrained by missing information)
- Module A weight depends on the quality of available performance data

The exact weights should adapt to input quality. With a deck only, a reasonable weighting is: A (20%), B (25%), C (30%), D (12.5%), E (12.5%). With a DDQ available, rebalance toward D and E.

**IMPORTANT: ESG/DEI must not factor into any module score.** The absence of ESG policies, DEI programs, or sustainability frameworks must never reduce a module score or the composite score. If the fund happens to have strong ESG/DEI programs, this can be mentioned as additive context but must not inflate the score either — score on investment merits only.

**Step 10.2 — Recommendation Tier**

Map the composite score:

| Score | Tier | Color | Meaning |
|-------|------|-------|---------|
| 85-100 | Strong Advance | Green | Exceptional submission; fast-track to data room |
| 70-84 | Advance with Diligence Items | Teal | Promising; proceed with specific conditions |
| 50-69 | Review Required | Amber | Material concerns; needs significant clarification |
| Below 50 | Decline | Red | Fundamental issues; not suitable for advancement |

**Step 10.3 — Final Assessment Narrative**

Write a synthesis covering: overall thesis strength, the 2-3 most material risks, specific conditions for advancement, recommended timeline, and expected outcome. This should read as a single-paragraph investment memo conclusion.

**Output:** Sections 1 (Executive Summary, written last but placed first) and 11 (Final Assessment & Recommendation).

---

### Node 11: Citation Compilation

**End-of-Report Citations (Appendix A)**

Compile all sources used across the analysis into four categories:

1. **Team Validation Sources** — LinkedIn profiles, SEC filings, news articles, publication records
2. **Market Validation Sources** — Data providers (MSCI, Bloomberg, ISS), academic research, market reports
3. **Regulatory & Compliance Sources** — SEC Form ADV, FINRA BrokerCheck, enforcement databases, industry memberships
4. **Performance & Fund Data Sources** — Bloomberg, Morningstar, index providers, fund factsheets

Each entry: Source name, URL or reference identifier.

**Inline Citations**

Every factual claim derived from autonomous research (not from the GP's own documents) must include an inline citation. Format inline citations as bracketed references:

```
High-yield issuers account for 33% of U.S. carbon emissions [MSCI ESG Climate Data, Feb 2024 Update](https://msci.com/...) while only 25% disclose Scope 1&2 emissions.
```

When building the report for the Nvestiv platform, these inline citations should render as clickable accordion elements — clicking the citation expands to show the source title, URL, date accessed, and the specific finding extracted. This gives the allocator full traceability from any claim to its evidence without leaving the report.

For claims sourced from the GP's own documents, use a simpler reference: `(Source: Pitch Deck, p.XX)` — no accordion needed since the user already has the source document.

---

### Node 12: Report Assembly

Assemble all sections into the final markdown document in this order:

1. **Header** — Fund name, document date, asset class, strategy, document type, source materials
2. **Executive Summary** — L1 Score, Recommendation tier, Key Strengths (6 bullets), Key Risks (6 bullets), Market Validation (3 bullets)
3. **Submission Quality Assessment** — Completeness score, quality flags table, critical gaps
4. **Module A** — Financial & Performance
5. **Module B** — Team & Management
6. **Module C** — Strategy & Market
7. **Module D** — Terms & Structure
8. **Module E** — Operational Quick-Check
9. **Red Flag Summary** — Critical / Elevated / Monitor flags with scorecard
10. **Interrogatory Matrix** — Questions by module with scoring system
11. **Data Room Request Checklist** — Priority 1-4 documents
12. **Final Assessment & Recommendation** — Synthesis narrative
13. **Appendix A: Research Sources** — Grouped by category

Use `---` horizontal rules between major sections. Use markdown tables throughout. The report should be 800-1500 lines depending on the complexity of the fund and the richness of available materials.

**Quality Check:** Before finalizing, verify:
- The Executive Summary accurately reflects the body findings
- Module scores are internally consistent with the narrative
- Red flags are traceable to specific module findings
- Interrogatory questions correspond to identified issues
- Data room requests map to stated information gaps
- All inline citations have corresponding Appendix A entries
- The recommendation tier matches the composite score
- **ESG/DEI neutrality check:** Confirm that no score was reduced, no red flag was raised, and no critical gap was listed due to ESG/DEI absence
- **Cross-format parity:** After generating MD, DOCX, and JSON, run the Node 13 parity verification. All three outputs must carry equivalent data. The report is not deliverable until parity verification passes.

**Report Footer:**
```
**Report Completed:** [Date]
**Analyst:** Claude (AI Research Agent)
**Document Classification:** STRICTLY CONFIDENTIAL - For Institutional Investor Use Only
**Distribution:** Limited to investment committee members and authorized advisors
```

## Key Principles

**Autonomous research is the backbone, not a supplement.** The efficacy testing across 12 companies showed that autonomous web research is what makes the L1 analysis valuable. Module C (Strategy & Market) was the strongest module in every single run because it relies most heavily on research. Red flag detection does not require supporting documents — it works from deck + research alone. Supporting documents primarily improve confidence levels rather than fundamentally changing scores.

**Be explicit about limitations.** When information is unavailable, say so clearly. Don't hedge with vague language — state specifically what's missing and why it matters. A well-documented gap is more useful than a guess.

**Make every claim traceable.** The inline citation system exists because this is a glass box, not a black box. An allocator reading any sentence in the report should be able to trace it to either a page in the GP's documents or a specific research source. If a claim can't be sourced, it shouldn't be in the report.

**Calibrate confidence honestly.** A Medium confidence score on Module A with a clean explanation of why (e.g., "3.25-year track record, no independent verification available") is more valuable than a High confidence score that papers over uncertainty.

**ESG/DEI is neutral — never penalize for absence.** The presence or absence of ESG (Environmental, Social, Governance) policies, DEI (Diversity, Equity, Inclusion) initiatives, sustainability frameworks, or similar programs must NEVER negatively impact scoring, completeness assessments, red flag severity, or the final recommendation. These are optional characteristics. If a fund has ESG/DEI programs, note them as a positive differentiator or additive context. If a fund does not mention ESG/DEI at all, do NOT flag it as a gap, do NOT treat it as missing information, do NOT reduce any score because of it, and do NOT include it in the completeness checklist as a required or expected item. The data room request checklist may include ESG/DEI documentation as a lowest-priority "nice to have if applicable" item but must explicitly note it is optional. This applies throughout the entire report: triage completeness scoring, module scores, red flags, interrogatory questions, and the final composite score.

## Output

For every L1 analysis, produce three output files, then run mandatory parity verification (see **Node 13**):

1. **Markdown (`.md`)** — The canonical report format and source of truth. Preserves inline citation links and is what gets ingested into the Nvestiv platform. This is the primary deliverable.

2. **Word Document (`.docx`)** — A professionally formatted version of the report using the docx skill. Suitable for sharing with investment committees and external stakeholders. Must contain all the same content as the markdown version.

3. **JSON (`.json`)** — A **complete, render-ready** structured export. The Nvestiv app renders the full report from this JSON alone — it must contain ALL narrative content, written analyses, explanations, and assessments from the markdown, not just scores and bullet points. Think of it as the markdown report expressed as structured data. Every paragraph of analysis, every assessment writeup, every strengths/concerns discussion must appear in the JSON. The JSON must follow this schema:

4. **Parity Verification** — After generating all three files, execute the **Node 13: Cross-Format Parity Verification** checklist. Compare MD↔JSON across all 10 categories. Append a Section 14 parity table to the Markdown. The deliverable is NOT complete until verification passes. If it fails, fix the JSON and re-verify before delivery.

```json
{
  "report_metadata": {
    "fund_name": "string",
    "report_date": "YYYY-MM-DD",
    "asset_class": "string",
    "strategy": "string",
    "source_materials": ["list of document names with types and dates"],
    "analyst": "Claude (AI Research Agent)",
    "classification": "STRICTLY CONFIDENTIAL"
  },
  "executive_summary": {
    "l1_score": 0,
    "recommendation_tier": "Strong Advance | Advance with Diligence Items | Review Required | Decline",
    "recommendation_color": "Green | Teal | Amber | Red",
    "overview": "string — the full overview paragraph introducing the fund",
    "key_strengths": ["list of strength strings with full explanations, not just labels"],
    "key_risks": ["list of risk strings with full explanations"],
    "market_validation": ["list of validation strings"],
    "summary_assessment": "string — the full summary assessment paragraph",
    "preliminary_rating_narrative": "string — the rating explanation"
  },
  "submission_quality": {
    "completeness_score_pct": 0,
    "document_quality_narrative": "string — the full written assessment of document quality, professionalism, and presentation",
    "categories": [
      {
        "name": "string",
        "status": "Complete | Partial | Minimal | Not Provided",
        "confidence": "High | Medium | Low | N/A",
        "severity": "— | Monitor | Elevated | Critical"
      }
    ],
    "document_quality_flags": [
      {
        "dimension": "string (e.g. Freshness, Completeness, Professionalism)",
        "rating": "string (one-word rating)",
        "assessment": "string (brief explanation)"
      }
    ],
    "critical_gaps": ["list of gap descriptions with full explanations of why each matters"]
  },
  "modules": {
    "A_financial_performance": {
      "score": 0,
      "confidence": "High | Medium | Low",
      "weight_pct": 0,
      "score_justification": "string — full paragraph explaining why this score was given",
      "strengths_narrative": ["list of full-sentence strength descriptions with context"],
      "concerns_narrative": ["list of full-sentence concern descriptions with context"],
      "assessment_narrative": "string — the overall written assessment for this module",
      "performance_data": {
        "returns": {
          "annual_returns": [{"year": 2024, "return_pct": 0.0}],
          "period_returns": [{"period": "string", "annualized_pct": 0.0, "cumulative_pct": 0.0}]
        },
        "risk_metrics": {
          "sharpe_ratio": 0.0,
          "max_drawdown_pct": 0.0,
          "volatility_pct": 0.0,
          "correlations": [{"benchmark": "string", "value": 0.0}]
        },
        "fee_structure": {
          "share_classes": [
            {
              "name": "string",
              "management_fee_pct": 0.0,
              "performance_fee_pct": 0.0,
              "hurdle_rate_pct": 0.0,
              "lockup": "string",
              "redemption_frequency": "string",
              "early_redemption_penalty": "string",
              "minimum_investment": "string"
            }
          ],
          "fee_assessment": "string — written assessment of whether fees are market-rate"
        }
      },
      "performance_attribution_gaps": ["list of specific missing attribution items"],
      "data_room_requirements": ["list of items needed for full assessment"]
    },
    "B_team_management": {
      "score": 0,
      "confidence": "High | Medium | Low",
      "weight_pct": 0,
      "score_justification": "string — full paragraph explaining why this score was given",
      "strengths_narrative": ["list of full-sentence strength descriptions"],
      "concerns_narrative": ["list of full-sentence concern descriptions"],
      "assessment_narrative": "string — the overall written team assessment",
      "team_roster": [
        {
          "name": "string",
          "title": "string",
          "experience_years": 0,
          "background": "string — full bio summary including prior roles",
          "education": "string",
          "notable_credentials": "string",
          "tenure_at_firm": "string",
          "verification_status": "Verified | Partially Verified | Unable to Verify",
          "verification_details": "string — what was verified and via which sources"
        }
      ],
      "governance_analysis": "string — full writeup on governance structure, segregation of duties, key person risk",
      "adverse_media_findings": "string — full writeup on regulatory/media search results"
    },
    "C_strategy_market": {
      "score": 0,
      "confidence": "High | Medium | Low",
      "weight_pct": 0,
      "score_justification": "string — full paragraph explaining why this score was given",
      "strengths_narrative": ["list of full-sentence strength descriptions"],
      "concerns_narrative": ["list of full-sentence concern descriptions"],
      "assessment_narrative": "string — the overall written strategy assessment",
      "thesis_summary": "string — 2-3 sentence distillation of the investment thesis",
      "thesis_validation": [
        {
          "claim": "string — the specific thesis claim",
          "status": "Verified | Partially Verified | Unverified | Contradicted",
          "confidence": "High | Medium | Low",
          "evidence": "string — the research evidence supporting this validation"
        }
      ],
      "competitive_landscape": {
        "narrative": "string — full written competitive analysis",
        "key_competitors": [
          {
            "name": "string",
            "aum": "string",
            "differentiation": "string"
          }
        ]
      },
      "tailwinds": ["list of specific tailwinds with explanations"],
      "headwinds": ["list of specific headwinds with explanations"],
      "investment_themes": [
        {
          "theme": "string",
          "description": "string — full explanation of the investment theme"
        }
      ],
      "alpha_generation_examples": [
        {
          "name": "string",
          "description": "string — full explanation of how alpha was generated"
        }
      ]
    },
    "D_terms_structure": {
      "score": 0,
      "confidence": "High | Medium | Low",
      "weight_pct": 0,
      "score_justification": "string — full paragraph explaining why this score was given",
      "strengths_narrative": ["list of full-sentence strength descriptions"],
      "concerns_narrative": ["list of full-sentence concern descriptions"],
      "assessment_narrative": "string — the overall written terms assessment",
      "fund_structure": {
        "fund_name": "string",
        "entity_type": "string",
        "domicile": "string",
        "inception_date": "string"
      },
      "service_providers": [
        {
          "role": "string (e.g. Administrator, Custodian, Auditor)",
          "name": "string",
          "tier": "string (e.g. Big 4, Top Tier, Regional)"
        }
      ],
      "benchmarking_assessment": "string — written comparison to institutional norms",
      "alignment_assessment": "string — written GP-LP alignment evaluation",
      "gaps": ["list of terms that cannot be assessed from available materials"]
    },
    "E_operational": {
      "score": 0,
      "confidence": "High | Medium | Low",
      "weight_pct": 0,
      "score_justification": "string — full paragraph explaining why this score was given",
      "strengths_narrative": ["list of full-sentence strength descriptions"],
      "concerns_narrative": ["list of full-sentence concern descriptions"],
      "assessment_narrative": "string — the overall written operational assessment",
      "risk_management_framework": "string — full writeup of risk governance, monitoring, and controls",
      "stress_testing": {
        "narrative": "string — written assessment of stress testing approach",
        "scenarios": [
          {
            "name": "string",
            "assumptions": "string",
            "result": "string"
          }
        ]
      },
      "regulatory_verification": "string — full writeup of SEC/FINRA/regulatory search findings",
      "operational_gaps": ["list of operational risk gaps identified"]
    }
  },
  "red_flags": [
    {
      "flag_id": "string (e.g. FLAG_1)",
      "issue": "string — full title",
      "severity": "CRITICAL | ELEVATED | MONITOR",
      "description": "string — full written description of the issue",
      "implication": "string — full explanation of why this matters",
      "resolution": "string — what needs to happen to address this",
      "timeline": "string — when must this be resolved"
    }
  ],
  "secondary_concerns": [
    {
      "concern_id": "string (e.g. CONCERN_A)",
      "title": "string",
      "description": "string — full written explanation"
    }
  ],
  "red_flag_summary": {
    "critical_count": 0,
    "elevated_count": 0,
    "monitor_count": 0
  },
  "interrogatory_matrix": [
    {
      "id": "string (e.g. A1, B2)",
      "module": "string",
      "question": "string — the full question with context",
      "rationale": "string — full explanation of why this question matters",
      "priority": "CRITICAL | HIGH | MEDIUM",
      "expected_documentation": "string — what documents/evidence should the GP provide"
    }
  ],
  "data_room_checklist": {
    "priority_1_deal_breaker": [
      {
        "category": "string (e.g. Regulatory, Fund Documentation)",
        "items": ["list of specific document requests with sub-detail"]
      }
    ],
    "priority_2_essential": [
      {
        "category": "string",
        "items": ["list of specific document requests"]
      }
    ],
    "priority_3_supporting": [
      {
        "category": "string",
        "items": ["list of specific document requests"]
      }
    ],
    "priority_4_nice_to_have": [
      {
        "category": "string",
        "items": ["list of specific document requests — ESG/DEI items marked (if applicable — optional)"]
      }
    ],
    "completeness_verification": {
      "items_from_deck": 0,
      "items_from_research": 0,
      "items_remaining_gaps": 0,
      "estimated_response_time": "string",
      "recommended_next_steps": "string"
    }
  },
  "final_assessment": {
    "composite_score": 0,
    "composite_confidence": "string",
    "rating": "string",
    "rating_definition": "string — full explanation of what the rating means",
    "strengths_summary": ["list of top strengths with context"],
    "weaknesses_summary": ["list of top weaknesses with context"],
    "conditions_for_advancement": {
      "tier_1_critical": ["list of must-resolve items"],
      "tier_2_high_priority": ["list of should-resolve items"],
      "tier_3_important": ["list of can-resolve-during-L2 items"]
    },
    "risk_rating": "string",
    "risk_narrative": "string — full paragraph on investment risk level and suitability",
    "recommendation_narrative": "string — full synthesis paragraph"
  },
  "market_context": {
    "narrative": "string — full written market landscape analysis",
    "market_size": "string",
    "issuance_data": "string",
    "default_environment": "string",
    "competitive_positioning": "string — how the fund compares to the broader market"
  },
  "sources": {
    "primary_materials": [{"name": "string", "description": "string"}],
    "team_validation": [{"name": "string", "url": "string"}],
    "market_validation": [{"name": "string", "url": "string"}],
    "regulatory_compliance": [{"name": "string", "url": "string"}],
    "performance_fund_data": [{"name": "string", "url": "string"}],
    "industry_research": [{"name": "string", "url": "string"}]
  }
}
```

**Key principle for the JSON: render-completeness.** If a developer builds a front-end that reads only the JSON file, they should be able to render a report that is substantively identical to the markdown version. Every narrative paragraph, every assessment, every written analysis must be present. The JSON is not a summary — it is the full report in structured form.

All three files must be saved to the deal's `L1_Report/` subdirectory with consistent naming: `{number}_{Fund_Name}_L1_Report.{ext}`.

---

## Node 13: Cross-Format Parity Verification

**Purpose:** Every L1 run MUST conclude with an automated parity verification step that confirms the Markdown, DOCX, and JSON outputs carry the same data. This is non-optional. The report is not considered complete until parity is confirmed. The Nvestiv app renders from the JSON — any data present in the markdown but missing from the JSON means the web user sees an incomplete report.

**When to run:** Immediately after all three output files (`.md`, `.docx`, `.json`) have been written to the deal's `L1_Report/` directory.

### Verification Checklist

The following categories must be checked for cross-format parity. For each category, compare the Markdown (source of truth) against the JSON. The DOCX is generated from the same content as the Markdown, so MD↔JSON parity implicitly covers DOCX↔JSON parity.

#### 1. Report Metadata
- [ ] Fund name matches across MD header and JSON `report_metadata.fund_name`
- [ ] Report date is present in both (format differences like "March 9, 2026" vs "2026-03-09" are acceptable)
- [ ] Asset class and strategy match
- [ ] Source materials list has the same count and names

#### 2. Executive Summary
- [ ] L1 composite score matches (MD Section 1 vs JSON `executive_summary.l1_score`)
- [ ] Recommendation tier matches (e.g., "CONDITIONAL QUALIFIED" in both)
- [ ] Confidence level matches
- [ ] Investment themes count matches and content is substantively present
- [ ] Key strengths list is present in JSON
- [ ] Critical concerns list is present in JSON
- [ ] Alpha generation examples count matches

#### 3. Submission Quality / Triage
- [ ] Completeness score matches
- [ ] Overall quality rating matches
- [ ] Document list count matches

#### 4. Module Scores (A through E)
For each module (A, B, C, D, E):
- [ ] Numeric score matches (MD scorecard table vs JSON `modules.module_X.score`)
- [ ] Confidence level matches
- [ ] Assessment narrative is present in JSON (not empty, not just a placeholder)
- [ ] `full_section_markdown` field contains the complete module section text
- [ ] Strengths are captured (either as `strengths_narrative` or structured list)
- [ ] Concerns are captured (either as `concerns_narrative` or structured list)
- [ ] Module-specific structured data is populated:
  - Module A: `track_record_length`, `fund_size`, `target_return`, `fee_structure`
  - Module B: `key_persons` count, `team_size`
  - Module C: `strategy_description`, `market_size`, `competitive_advantages`
  - Module D: `fund_terms` populated, `liquidity_terms`, `fee_details`
  - Module E: `service_providers` count, `operational_concerns`

#### 5. Red Flags
- [ ] Total red flag count matches (MD Section 9 vs JSON `red_flags` array length)
- [ ] Each red flag has: `id`, `title`, `severity`, `module`, `description`
- [ ] Severity distribution matches (count of Critical / Elevated / Monitor)
- [ ] Secondary concerns count matches if present

#### 6. Interrogatory Matrix
- [ ] Total question count matches (MD Section 10 table rows vs JSON `interrogatory_matrix` array length)
- [ ] Each question has: `id`, `question`, `module`, `priority`, `rationale`
- [ ] Priority distribution matches (count of Critical / High / Medium)

#### 7. Data Room Checklist
- [ ] Total item count matches across all priorities
- [ ] Priority 1 (Critical) item count matches
- [ ] Priority 2 (High) item count matches
- [ ] Priority 3 (Medium) item count matches
- [ ] Priority 4 (Low/Optional) item count matches

#### 8. Final Assessment
- [ ] Composite score matches
- [ ] Rating string matches
- [ ] Risk rating matches
- [ ] Conditions for advancement are present and categorized
- [ ] Recommendation narrative is present (not empty)

#### 9. Market Context
- [ ] Market narrative is present in JSON
- [ ] Market size data is captured
- [ ] Competitive positioning content is present

#### 10. Sources
- [ ] Total source count matches (sum across all categories)
- [ ] Source categories are present (primary materials, team validation, market validation, regulatory, performance/fund data, industry research)
- [ ] No source category that exists in MD is empty in JSON

### Verification Output

After running all checks, produce a **Parity Verification Summary** appended to the bottom of the Markdown report as a new section:

```markdown
---

## 14. Parity Verification

| Category | MD Value | JSON Value | Status |
|---|---|---|---|
| Fund Name | [value] | [value] | ✅ Match |
| L1 Score | [value] | [value] | ✅ Match |
| Module A Score | [value] | [value] | ✅ Match |
| Module B Score | [value] | [value] | ✅ Match |
| Module C Score | [value] | [value] | ✅ Match |
| Module D Score | [value] | [value] | ✅ Match |
| Module E Score | [value] | [value] | ✅ Match |
| Red Flags Count | [value] | [value] | ✅ Match |
| Interrogatory Count | [value] | [value] | ✅ Match |
| Data Room Items | [value] | [value] | ✅ Match |
| Sources Count | [value] | [value] | ✅ Match |
| Narrative Completeness | — | [X/Y fields populated] | ✅ Pass |

**Parity Result:** ✅ PASS — All critical fields verified. MD, DOCX, and JSON carry equivalent data.
```

If any check fails, the status column shows ❌ and the Parity Result line reads:

```
**Parity Result:** ❌ FAIL — [N] discrepancies found. See details above. Resolve before delivery.
```

### Failure Protocol

If parity verification fails:

1. **Identify the gap** — Which field(s) are missing or mismatched between MD and JSON?
2. **Fix the JSON** — Regenerate or patch the JSON to include the missing data. The Markdown is the source of truth; the JSON must conform to it.
3. **Re-run verification** — After fixing, run the parity checks again.
4. **Do not deliver until PASS** — The three files are not considered a complete deliverable until the parity verification passes. A failed verification means the web app would render an incomplete report.

### What Counts as a Match

- **Numeric scores:** Must be identical integers.
- **Text content:** Must be substantively present. Minor formatting differences (e.g., markdown bold markers absent in JSON string) are acceptable. Empty strings or null values where the MD has content = FAIL.
- **Counts:** Array lengths must match (red flags, interrogatory questions, data room items, sources).
- **Dates:** Format differences are acceptable ("March 9, 2026" = "2026-03-09"). Both must be present.
- **Narrative fields:** Must contain meaningful content. A JSON field with `""` or `"N/A"` where the Markdown has a full paragraph = FAIL.
