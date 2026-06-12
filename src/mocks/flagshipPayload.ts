import type { RenderPayload } from "@/types/renderContract";

/**
 * Flagship demo payload — transcribed from render-fixture-demo-fund.json.
 * Used for Vista Equity Partners IX in the mock dataset. Exercises every
 * contract surface (3 provenances, 3 dispositions, both severities,
 * CONDITIONAL verdict, 6 flags + paired questions, 2 standalone asks,
 * all 8 source tiers, listen_for on every agenda item).
 */
export const flagshipPayload: RenderPayload = {
  meta: {
    schema_version: "1.0",
    project_id: "demo-harborline-fund-ii",
    run_id: "demo-fixture-001",
    agent_version: "synthesis-agent@0.1-fixture",
    generated_at: "2026-06-12T14:00:00Z",
    maturity: "Emerging",
    asset_class: "Private Equity — Lower-Mid-Market Buyout",
    sections_present: [
      "verdict",
      "executive_summary",
      "factsheet",
      "claims_ledger",
      "flags",
      "modules",
      "agenda",
      "sources",
    ],
  },
  verdict: {
    north_star: {
      answer: "CONDITIONAL",
      statement:
        "Worth the hour — if the meeting resolves deal attribution and reported-IRR discrepancies. Team quality and niche thesis are real; two findings require GP answers before further work.",
    },
    composite_score: 72,
    tier: "advance_with_diligence",
    modules: [
      {
        key: "thesis",
        label: "Thesis",
        score: 74,
        verdict_label: "Credible niche, capacity watch",
        rationale:
          "Industrial-services consolidation thesis is supported by an independently verified target universe of ~1,400 companies and below-mean entry multiples; the 2.5x fund-over-fund step-up is at the threshold of demonstrated deployment pace.",
        citation_ids: ["c5", "c9", "c12"],
      },
      {
        key: "macro",
        label: "Macro",
        score: 61,
        verdict_label: "Mixed tailwinds",
        rationale:
          "Entry multiples sit below their 10-year mean and financing spreads have normalized, but LMM dry powder is at a record and exit volumes remain 18% below trend — deployment is favored, exits are not.",
        citation_ids: ["c12", "c13", "c14"],
      },
      {
        key: "track_record",
        label: "Track Record",
        score: 68,
        verdict_label: "Solid, attribution caveats",
        rationale:
          "Fund I (2021, $120M) shows verified 1.6x TVPI / 0.4x DPI with one impairment in nine platforms; the net IRR discrepancy (19% marketed vs 17.8% pension-reported) and the founder's prior-firm attribution claim are the two open items.",
        citation_ids: ["c3", "c4", "c6"],
      },
      {
        key: "team",
        label: "Team",
        score: 81,
        verdict_label: "Strong, one departure",
        rationale:
          "Founders show nine years of verified overlapping tenure at Granite Peak and a fully verified credential set; one senior investment professional departed in 2025 inside the Fund I investment period.",
        citation_ids: ["c7", "c8", "c15"],
      },
      {
        key: "economics",
        label: "Fund Economics",
        score: 65,
        verdict_label: "Market standard, document gaps",
        rationale:
          "Verified 2.0/20/8 with European waterfall and a 2% cash GP commitment are institutional-standard; key person provision, subscription-line policy and recycling terms could not be located in any available source.",
        citation_ids: ["c2", "c10"],
      },
    ],
    claims_tally: { confirmed: 9, contradicted: 2, unverifiable: 3 },
    change_our_mind: [
      {
        item: "Deal attribution letters or board records confirming Whitfield led (not co-led) the marketed Granite Peak deals",
        direction: "would_advance",
        question_refs: ["q1", "q2"],
      },
      {
        item: "Fund I capital account statement reconciling the 19% marketed vs 17.8% pension-reported net IRR",
        direction: "would_advance",
        question_refs: ["q3"],
      },
      {
        item: "A second senior investment departure, or evidence the 2025 departure was performance-related",
        direction: "would_decline",
        question_refs: ["q5"],
      },
    ],
  },
  executive_summary: {
    narrative:
      "Harborline Capital Partners Fund II is a $300M lower-mid-market industrial-services buyout fund from a two-founder team that spun out of Granite Peak Partners in 2021. The firm's first fund ($120M, 2021) is tracking well on verified marks with disciplined entry pricing, and the founders' nine-year working history together distinguishes them from typical first-cycle spin-outs. Two findings keep this at conditional: the marketed Fund I net IRR exceeds the figure reported by a public pension LP, and the founding partner's headline deal-attribution claim is contradicted by contemporaneous press on at least five of eleven deals. Both are answerable in a single meeting with documents the GP should readily possess.",
    key_strengths: [
      {
        category: "Verified team cohesion",
        detail:
          "Founders Whitfield and Osei show nine years of overlapping tenure at Granite Peak across two funds — confirmed via archived team pages and press, not just resumes.",
        citation_ids: ["c8", "c15"],
      },
      {
        category: "Disciplined entry pricing",
        detail:
          "Fund I platform entries averaged 6.2x EV/EBITDA against a sector mean of 7.4x — verified across six of nine deals with disclosed terms.",
        citation_ids: ["c9", "c12"],
      },
      {
        category: "Clean regulatory footprint",
        detail:
          "ADV and Form D filings current and consistent; no disciplinary disclosures; ERA status appropriate for AUM.",
        citation_ids: ["c2", "c1"],
      },
      {
        category: "Institutional back office",
        detail:
          "RSM as auditor and Gen II as administrator — verified via ADV Schedule D, both Tier-1 for the segment.",
        citation_ids: ["c2"],
      },
    ],
    key_risks: [
      {
        category: "Attribution integrity",
        detail:
          "Press records name Whitfield as co-lead or supporting partner on 5 of the 11 Granite Peak buyouts marketed as deals he 'led'.",
        citation_ids: ["c6", "c11"],
      },
      {
        category: "Performance reporting gap",
        detail:
          "Marketed Fund I net IRR of 19% vs 17.8% in Washington SIB's quarterly report (Q4 2025).",
        citation_ids: ["c3", "c4"],
      },
      {
        category: "Documentation gaps at terms level",
        detail:
          "No key person provision, sub-line policy, or recycling terms discoverable in any public or provided source.",
        citation_ids: ["c10"],
      },
      {
        category: "Mid-period senior departure",
        detail:
          "VP K. Brennan departed for a competing platform in mid-2025, during Fund I's investment period.",
        citation_ids: ["c15", "c16"],
      },
    ],
  },
  factsheet: {
    fields: [
      { key: "fund_name", label: "Fund", value: "Harborline Capital Partners Fund II, L.P.", unit: null, group: "identity", provenance: "verified", citation_ids: ["c1"] },
      { key: "gp", label: "General Partner", value: "Harborline Capital Management LLC", unit: null, group: "identity", provenance: "verified", citation_ids: ["c2"] },
      { key: "strategy", label: "Strategy", value: "Control buyouts — industrial & facility services, N. America", unit: null, group: "identity", provenance: "disclosed_only", citation_ids: [] },
      { key: "domicile", label: "Structure / Domicile", value: "Delaware LP + Cayman feeder", unit: null, group: "identity", provenance: "verified", citation_ids: ["c1"] },
      { key: "target_size", label: "Target Size", value: "300", unit: "$M", group: "scale", provenance: "verified", citation_ids: ["c1"] },
      { key: "hard_cap", label: "Hard Cap", value: "350", unit: "$M", group: "scale", provenance: "disclosed_only", citation_ids: [] },
      { key: "first_close", label: "First Close", value: "$145M — Jan 2026", unit: null, group: "scale", provenance: "verified", citation_ids: ["c1"] },
      { key: "step_up", label: "Step-up vs Fund I", value: "2.5", unit: "x", group: "scale", provenance: "verified", citation_ids: ["c1", "c5"] },
      { key: "mgmt_fee", label: "Management Fee", value: "2.0% committed, step-down post-IP", unit: null, group: "economics", provenance: "verified", citation_ids: ["c10"] },
      { key: "carry", label: "Carried Interest", value: "20", unit: "%", group: "economics", provenance: "verified", citation_ids: ["c10"] },
      { key: "hurdle", label: "Preferred Return", value: "8", unit: "%", group: "economics", provenance: "verified", citation_ids: ["c10"] },
      { key: "waterfall", label: "Waterfall", value: "European (whole-fund)", unit: null, group: "economics", provenance: "verified", citation_ids: ["c10"] },
      { key: "gp_commit", label: "GP Commitment", value: "2% — cash", unit: null, group: "economics", provenance: "verified", citation_ids: ["c2", "c10"] },
      { key: "term", label: "Term", value: "10 yr + two 1-yr extensions", unit: null, group: "economics", provenance: "disclosed_only", citation_ids: [] },
      { key: "key_person", label: "Key Person Provision", value: null, unit: null, group: "governance", provenance: "not_disclosed", citation_ids: [] },
      { key: "subline", label: "Subscription Line Policy", value: null, unit: null, group: "governance", provenance: "not_disclosed", citation_ids: [] },
      { key: "recycling", label: "Recycling Provisions", value: null, unit: null, group: "governance", provenance: "not_disclosed", citation_ids: [] },
      { key: "auditor", label: "Auditor", value: "RSM US LLP", unit: null, group: "providers", provenance: "verified", citation_ids: ["c2"] },
      { key: "administrator", label: "Fund Administrator", value: "Gen II Fund Services", unit: null, group: "providers", provenance: "verified", citation_ids: ["c2"] },
      { key: "counsel", label: "Fund Counsel", value: "Kirkland & Ellis LLP", unit: null, group: "providers", provenance: "disclosed_only", citation_ids: [] },
    ],
  },
  claims_ledger: {
    claims: [
      { id: "cl1", category: "fund", entity: "Harborline Fund I", claim: "Fund I net IRR of 19% since inception", disposition: "CONTRADICTED", severity: "WARNING", evidence: "Washington SIB Q4 2025 PE report shows Harborline Fund I net IRR 17.8%, TVPI 1.58x.", citation_ids: ["c3", "c4"] },
      { id: "cl2", category: "fund", entity: "Harborline Fund I", claim: "Top-quartile performance for its vintage", disposition: "UNVERIFIABLE", severity: "WARNING", evidence: "No benchmark, vintage basis, or metric cited; 2021 vintage quartile data ambiguous at this AUM band.", citation_ids: ["c4"] },
      { id: "cl3", category: "company", entity: "Harborline Capital", claim: "$450M cumulative AUM across funds and co-invest", disposition: "CONFIRMED", severity: "INFO", evidence: "ADV Part 1A reports $452M RAUM as of Mar 2026.", citation_ids: ["c2"] },
      { id: "cl4", category: "person", entity: "J. Whitfield", claim: "Led 11 platform buyouts at Granite Peak Partners", disposition: "CONTRADICTED", severity: "CRITICAL", evidence: "Deal press names Whitfield lead on 6 of 11; 5 name another partner as lead with Whitfield co-lead or supporting.", citation_ids: ["c6", "c11"] },
      { id: "cl5", category: "fund", entity: "Fund II", claim: "$300M target, $145M first close January 2026", disposition: "CONFIRMED", severity: "INFO", evidence: "Form D filed 2026-01-22 reports $145.2M sold; target consistent with offering size.", citation_ids: ["c1"] },
      { id: "cl6", category: "fund", entity: "Fund I", claim: "Nine platform investments completed in Fund I", disposition: "CONFIRMED", severity: "INFO", evidence: "All nine platforms confirmed via press releases and portfolio company registrations.", citation_ids: ["c5", "c9"] },
      { id: "cl7", category: "company", entity: "Harborline Capital", claim: "Institutional service stack: RSM audit, Gen II administration", disposition: "CONFIRMED", severity: "INFO", evidence: "ADV Schedule D 7.B.1 lists both as engaged providers for Fund I and Fund II vehicles.", citation_ids: ["c2"] },
      { id: "cl8", category: "company", entity: "Harborline Capital", claim: "Team of 11 full-time professionals", disposition: "CONFIRMED", severity: "INFO", evidence: "ADV Item 5 reports 11 employees; LinkedIn roster reconciles at 11 (one title variance).", citation_ids: ["c2", "c15"] },
      { id: "cl9", category: "fund", entity: "Fund II", claim: "70% of deal flow from proprietary sourcing relationships", disposition: "UNVERIFIABLE", severity: "WARNING", evidence: "No independent source can substantiate sourcing-channel mix; no intermediary data available.", citation_ids: [] },
      { id: "cl10", category: "fund", entity: "Fund I", claim: "Average entry multiple of 6.2x EV/EBITDA", disposition: "CONFIRMED", severity: "INFO", evidence: "Six of nine entries had disclosed terms averaging 6.3x; remaining three undisclosed but consistent with niche pricing.", citation_ids: ["c9", "c12"] },
      { id: "cl11", category: "fund", entity: "Fund II", claim: "GP commitment of 2%, fully in cash", disposition: "CONFIRMED", severity: "INFO", evidence: "Pension commitment memo and ADV ownership schedule consistent with cash commitment, no fee-waiver financing indicated.", citation_ids: ["c10", "c2"] },
      { id: "cl12", category: "company", entity: "Harborline Capital", claim: "Key person insurance in place on both founders", disposition: "UNVERIFIABLE", severity: "INFO", evidence: "Not verifiable from any public source; requires LPA or insurance certificate.", citation_ids: [] },
      { id: "cl13", category: "fund", entity: "Fund II", claim: "Delaware LP with Cayman feeder for non-US investors", disposition: "CONFIRMED", severity: "INFO", evidence: "Both entities located: Delaware registration and Cayman feeder Form D co-filing.", citation_ids: ["c1"] },
      { id: "cl14", category: "person", entity: "A. Osei", claim: "Wharton MBA; previously Principal at Granite Peak", disposition: "CONFIRMED", severity: "INFO", evidence: "Degree verified via alumni directory; Granite Peak tenure 2014–2021 confirmed via archived team pages.", citation_ids: ["c8", "c15"] },
    ],
  },
  flags: {
    items: [
      { id: "f1", severity: "CRITICAL", category: "Attribution", tokens: ["ATTRIBUTION_WASHING"], statement: "Founding partner's headline claim of leading 11 Granite Peak buyouts is contradicted on 5 of 11 by contemporaneous deal press.", evidence: "Lead-partner naming in press releases and trade coverage at deal close.", citation_ids: ["c6", "c11"], question_refs: ["q1", "q2"] },
      { id: "f2", severity: "WARNING", category: "Performance Reporting", tokens: ["PERFORMANCE_DISCREPANCY"], statement: "Marketed Fund I net IRR (19%) exceeds pension-reported figure (17.8%) with no reconciliation note.", evidence: "WSIB quarterly PE performance table, Q4 2025.", citation_ids: ["c3", "c4"], question_refs: ["q3"] },
      { id: "f3", severity: "WARNING", category: "Fund Terms", tokens: ["SUBLINE_POLICY_NOT_FOUND", "KEY_PERSON_PROVISION_NOT_FOUND"], statement: "Subscription-line policy and key person provision are not discoverable in any available source while IRR is actively marketed.", evidence: "Searched pension packets, Form D, marketing materials — no hit.", citation_ids: ["c10"], question_refs: ["q4"] },
      { id: "f4", severity: "WARNING", category: "Team Stability", tokens: ["SENIOR_DEPARTURE_CLUSTER"], statement: "VP K. Brennan departed mid-2025, inside Fund I's investment period, for a competing platform.", evidence: "LinkedIn transition + archived team page delta (Mar → Sep 2025).", citation_ids: ["c15", "c16"], question_refs: ["q5"] },
      { id: "f5", severity: "WARNING", category: "Sourcing", tokens: ["UNVERIFIED"], statement: "The 70% proprietary-sourcing claim — central to the thesis — has no independently verifiable support.", evidence: "No intermediary, banker coverage, or process data located.", citation_ids: [], question_refs: ["q6"] },
      { id: "f6", severity: "WARNING", category: "Operations", tokens: ["FRACTIONAL_OPS_UNDISCLOSED"], statement: "CFO title appears to be held by an outsourced provider's professional rather than a dedicated internal hire; materials do not disclose this.", evidence: "Named CFO concurrently listed at a fractional-CFO services firm.", citation_ids: ["c15"], question_refs: ["q7"] },
    ],
    questions: [
      { id: "q1", text: "For each of the 11 Granite Peak deals marketed as 'led', who originated, who held the board seat, and who signed the IC memo? Attribution letters from Granite Peak would settle this.", why: "Press contradicts lead status on 5 of 11 — the deals are the core of the track-record narrative.", flag_ref: "f1" },
      { id: "q2", text: "Will Granite Peak provide consent for reference calls on the disputed deals?", why: "Independent confirmation path if attribution letters are not available.", flag_ref: "f1" },
      { id: "q3", text: "Provide the Fund I capital account statement and reconcile 19% marketed net IRR vs 17.8% in WSIB reporting — is the delta timing, fees, or facility usage?", why: "A 120bps gap is explainable, but the explanation must be documented.", flag_ref: "f2" },
      { id: "q4", text: "What are the sub-line size/tenor limits and the key person trigger in the Fund II LPA? Do you report IRR with and without the facility?", why: "Both terms are undiscoverable; sub-line use directly affects the marketed IRR.", flag_ref: "f3" },
      { id: "q5", text: "What were the circumstances of K. Brennan's 2025 departure, and what carry did he hold?", why: "A mid-period senior departure is a pattern question for an emerging firm.", flag_ref: "f4" },
      { id: "q6", text: "Walk through the last six platform deals: how was each sourced, and what was paid vs the banked-process alternative?", why: "Tests the 70% proprietary claim with deal-level specifics rather than aggregates.", flag_ref: "f5" },
      { id: "q7", text: "Is the CFO function internal or outsourced, at what weekly commitment, and what is the plan to internalize at Fund II scale?", why: "Fractional ops at $450M AUM is workable but must be disclosed and time-bound.", flag_ref: "f6" },
      { id: "q8", text: "Please complete our standard DDQ and provide the draft Fund II LPA.", why: "Baseline documentation request.", flag_ref: null },
      { id: "q9", text: "Provide the Fund I LP list with re-up indications for Fund II.", why: "Re-up rate is the strongest external quality signal; first close composition was not disclosed.", flag_ref: null },
    ],
  },
  modules: [
    {
      key: "thesis", title: "Thesis", verdict_chip: "Credible niche, capacity watch",
      narrative_md: "Harborline buys founder-owned industrial and facility-services companies at $4–12M EBITDA, professionalizes operations, and exits to consolidators. The inefficiency claim — fragmented sellers, thin intermediary coverage — is consistent with the verified universe of ~1,400 in-profile companies and ~120 niche transactions per year. The open question is capacity: a 2.5x step-up implies roughly $75M deployed annually versus a demonstrated Fund I pace of ~$40M.",
      kpis: [
        { label: "Target universe", value: "~1,400", unit: "companies", benchmark: null, delta: null, citation_ids: ["c12"] },
        { label: "Niche deal volume", value: "~120", unit: "deals/yr", benchmark: null, delta: null, citation_ids: ["c12"] },
        { label: "Step-up vs Fund I", value: "2.5", unit: "x", benchmark: "2.5x threshold", delta: "at threshold", citation_ids: ["c1", "c5"] },
      ],
      facts: [
        { statement: "Fund I deployed $118M of $120M over 38 months (~$37M/yr).", source_tier: "OFFICIAL_FILING", citation_id: "c5" },
        { statement: "Stated Fund II check size $25–40M across 10–12 platforms.", source_tier: "COMPANY_SELF", citation_id: "c16" },
      ],
      flag_refs: ["f5"],
    },
    {
      key: "macro", title: "Macro", verdict_chip: "Mixed tailwinds",
      narrative_md: "Deployment conditions favor the strategy: sector entry multiples (6.8x current vs 7.4x ten-year mean) and normalized financing spreads (B-rated ~310bps over) support disciplined buying. Exit conditions do not: sponsor-to-sponsor volume in the segment is ~18% below the five-year trend and the IPO channel is irrelevant at this size. Record LMM dry powder (~$87B) is the crowding risk to monitor.",
      kpis: [
        { label: "Sector entry multiple", value: "6.8", unit: "x EV/EBITDA", benchmark: "7.4x 10-yr mean", delta: "-0.6x", citation_ids: ["c12"] },
        { label: "B-spread (financing)", value: "~310", unit: "bps", benchmark: "10-yr mean ~350bps", delta: "-40bps", citation_ids: ["c13"] },
        { label: "LMM dry powder", value: "~87", unit: "$B", benchmark: "5-yr avg ~$64B", delta: "+36%", citation_ids: ["c14"] },
        { label: "Exit volume vs trend", value: "-18", unit: "%", benchmark: "5-yr trend", delta: "below", citation_ids: ["c14"] },
      ],
      facts: [
        { statement: "Independent outlooks describe industrial-services demand as resilient to rate path; reshoring tailwind cited by two major-bank sector notes (2026).", source_tier: "SECONDARY", citation_id: "c13" },
      ],
      flag_refs: [],
    },
    {
      key: "track_record", title: "Track Record", verdict_chip: "Solid, attribution caveats",
      narrative_md: "Fund I (2021, $120M): nine platforms, one impairment, verified 1.58x TVPI and 0.4x DPI at Q4 2025 per pension reporting. Two realized exits returned a blended 2.3x gross. The record is genuinely good — which is why the two integrity findings (IRR delta, prior-firm attribution) matter: they are about reporting discipline, not performance.",
      kpis: [
        { label: "TVPI (verified)", value: "1.58", unit: "x", benchmark: null, delta: null, citation_ids: ["c3"] },
        { label: "DPI (verified)", value: "0.4", unit: "x", benchmark: null, delta: null, citation_ids: ["c3"] },
        { label: "Net IRR", value: "17.8 verified / 19 marketed", unit: "%", benchmark: null, delta: "-120bps", citation_ids: ["c3", "c4"] },
        { label: "Loss ratio", value: "1 of 9", unit: "platforms", benchmark: null, delta: null, citation_ids: ["c9"] },
      ],
      facts: [
        { statement: "Both realized exits independently confirmed via buyer press releases with disclosed enterprise values.", source_tier: "PRIMARY_PRESS", citation_id: "c9" },
        { statement: "Impaired platform (HVAC roll-up) restructured Q3 2024; carried at 0.4x per pension mark.", source_tier: "INSTITUTIONAL_DISCLOSURE", citation_id: "c3" },
      ],
      flag_refs: ["f1", "f2"],
    },
    {
      key: "team", title: "Team", verdict_chip: "Strong, one departure",
      narrative_md: "Founders Whitfield (ex-Granite Peak Partner, 2012–2021) and Osei (ex-Granite Peak Principal, 2014–2021) have nine verified overlapping years and deployed together across two prior funds — rare and real cohesion for an emerging GP. Eleven FTEs reconcile to filings. The 2025 VP departure inside the investment period is the one stability question; the fractional CFO arrangement is workable but undisclosed.",
      kpis: [
        { label: "Founder overlap", value: "9", unit: "years", benchmark: null, delta: null, citation_ids: ["c8", "c15"] },
        { label: "Team size", value: "11", unit: "FTE", benchmark: null, delta: null, citation_ids: ["c2"] },
        { label: "Senior departures (5yr)", value: "1", unit: "", benchmark: null, delta: "2025, in-period", citation_ids: ["c15", "c16"] },
      ],
      facts: [
        { statement: "No disciplinary records for either founder across IAPD, FINRA, or court searches (incl. Delaware Chancery, PACER).", source_tier: "REGULATOR_DB", citation_id: "c7" },
        { statement: "Credentials verified: Whitfield (Cornell BS, Booth MBA), Osei (LSE BSc, Wharton MBA).", source_tier: "SECONDARY", citation_id: "c8" },
      ],
      flag_refs: ["f4", "f6"],
    },
    {
      key: "economics", title: "Fund Economics", verdict_chip: "Market standard, document gaps",
      narrative_md: "Verified terms are institutional-standard for the segment: 2.0% on committed with post-IP step-down, 20% carry over an 8% preferred, European waterfall, 2% cash GP commitment. What's missing is as informative as what's present — key person provision, sub-line policy, and recycling terms are undiscoverable, all three of which belong in the meeting.",
      kpis: [
        { label: "Management fee", value: "2.0", unit: "%", benchmark: "LMM range 1.75–2.0%", delta: "in range", citation_ids: ["c10"] },
        { label: "Carry / hurdle", value: "20 / 8", unit: "%", benchmark: "market", delta: "standard", citation_ids: ["c10"] },
        { label: "Waterfall", value: "European", unit: "", benchmark: "ILPA-preferred", delta: "aligned", citation_ids: ["c10"] },
        { label: "GP commitment", value: "2 (cash)", unit: "%", benchmark: "2–3% institutional floor", delta: "at floor", citation_ids: ["c10"] },
      ],
      facts: [
        { statement: "Fee offsets stated at 100% of monitoring/transaction fees in pension memo summary.", source_tier: "INSTITUTIONAL_DISCLOSURE", citation_id: "c10" },
      ],
      flag_refs: ["f3"],
    },
  ],
  agenda: {
    objective:
      "Resolve the two integrity findings (attribution, IRR reconciliation) and close the three terms gaps — sufficient to move Harborline Fund II to full diligence or decline within one meeting.",
    items: [
      { order: 1, topic: "Granite Peak deal attribution", minutes: 15, what_to_validate: "Whitfield's actual role on the 11 marketed deals — origination, board seat, IC signature.", question_refs: ["q1", "q2"], listen_for: { strong: "Offers attribution letters or Granite Peak references unprompted; distinguishes his 6 leads from 5 co-leads without defensiveness.", weak: "'It was a team effort' framing, or attacks the press record rather than documenting his role." } },
      { order: 2, topic: "Fund I performance reconciliation", minutes: 10, what_to_validate: "The 120bps gap between marketed and pension-reported net IRR, and sub-line usage in the calculation.", question_refs: ["q3", "q4"], listen_for: { strong: "Names the cause precisely (e.g., facility-adjusted vs unadjusted, as-of dates) and offers the capital account statement.", weak: "Doesn't know which figure the pension reports, or dismisses the delta as immaterial." } },
      { order: 3, topic: "Team stability & succession", minutes: 10, what_to_validate: "Brennan departure circumstances, carry treatment, and retention economics for the remaining senior team.", question_refs: ["q5"], listen_for: { strong: "Transparent on reasons, names the carry disposition, describes broadened Fund II carry participation.", weak: "Vague on reasons or reveals carry concentrated >90% in founders." } },
      { order: 4, topic: "Sourcing engine reality check", minutes: 10, what_to_validate: "The 70% proprietary claim, deal by deal, for the last six platforms.", question_refs: ["q6"], listen_for: { strong: "Walks each deal's origin specifically (founder call, operator intro, banker miss) with names.", weak: "Retreats to aggregate percentages or redefines 'proprietary' mid-answer." } },
      { order: 5, topic: "Operational setup", minutes: 5, what_to_validate: "CFO arrangement disclosure and internalization plan.", question_refs: ["q7"], listen_for: { strong: "Acknowledges the fractional arrangement plainly with a dated internalization plan tied to first close.", weak: "Presents the fractional CFO as full-time internal staff." } },
    ],
    standalone_asks: ["q8", "q9"],
    materials_request: [
      { item: "Attribution letters or board records for the 11 Granite Peak deals", reason: "Resolves the CRITICAL attribution flag", claim_refs: ["cl4"] },
      { item: "Fund I audited financials + latest capital account statement", reason: "Reconciles the IRR discrepancy", claim_refs: ["cl1"] },
      { item: "Draft Fund II LPA", reason: "Closes the key person / sub-line / recycling gaps", claim_refs: ["cl12"] },
      { item: "Fund I LP schedule with Fund II re-up indications", reason: "Independent quality signal not otherwise verifiable", claim_refs: ["cl2"] },
    ],
    decision_rule:
      "If attribution and IRR reconcile with documents (items 1–2), advance to full diligence. If attribution letters are refused or the IRR delta is facility-driven and undisclosed, decline. Terms gaps (item 3) are negotiable, not gating.",
  },
  sources: [
    { id: "c1", title: "Form D — Harborline Capital Partners Fund II, L.P. (and Cayman feeder co-filing)", publisher: "SEC EDGAR", url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany", date: "2026-01-22", tier: "OFFICIAL_FILING" },
    { id: "c2", title: "Form ADV — Harborline Capital Management LLC (Part 1A, Schedule D)", publisher: "SEC IAPD", url: "https://adviserinfo.sec.gov", date: "2026-03-30", tier: "REGULATOR_DB" },
    { id: "c3", title: "Quarterly Private Equity Performance Report — Q4 2025", publisher: "Washington State Investment Board", url: "https://www.sib.wa.gov", date: "2026-02-15", tier: "INSTITUTIONAL_DISCLOSURE" },
    { id: "c4", title: "Private Equity Commitment Memo — Harborline Fund II", publisher: "(Public pension agenda packet)", url: null, date: "2025-11-04", tier: "INSTITUTIONAL_DISCLOSURE" },
    { id: "c5", title: "Form D filings — Harborline Fund I and amendments (deployment pacing)", publisher: "SEC EDGAR", url: "https://www.sec.gov", date: "2021-2024", tier: "OFFICIAL_FILING" },
    { id: "c6", title: "Deal announcement coverage — Granite Peak platform acquisitions (2013–2021)", publisher: "PE Hub / Buyouts (compiled)", url: null, date: "2013-2021", tier: "PRIMARY_PRESS" },
    { id: "c7", title: "IAPD / FINRA BrokerCheck / PACER / Delaware Chancery searches — both founders", publisher: "(Composite regulatory & court search)", url: null, date: "2026-06-10", tier: "COURT_RECORD" },
    { id: "c8", title: "Alumni directory + degree verification — Whitfield, Osei", publisher: "(University registrars)", url: null, date: "2026-06-09", tier: "SECONDARY" },
    { id: "c9", title: "Portfolio exit announcements — buyer press releases with disclosed EVs", publisher: "(Acquirer newsrooms)", url: null, date: "2024-2025", tier: "PRIMARY_PRESS" },
    { id: "c10", title: "Investment staff memo — fee/terms summary, Harborline Fund II", publisher: "(Public pension agenda packet)", url: null, date: "2025-11-04", tier: "INSTITUTIONAL_DISCLOSURE" },
    { id: "c11", title: "Trade coverage naming lead partners on disputed deals", publisher: "Buyouts / S&P MA coverage", url: null, date: "2016-2020", tier: "SECONDARY" },
    { id: "c12", title: "Industrial services M&A pricing study — entry multiples by size band", publisher: "(Sector investment bank, annual report)", url: null, date: "2026-01", tier: "SECONDARY" },
    { id: "c13", title: "US leveraged finance update — B-rated spreads", publisher: "(Rating agency / FRED series)", url: null, date: "2026-05", tier: "SECONDARY" },
    { id: "c14", title: "Global Private Markets Report 2026 — LMM dry powder & exit volumes", publisher: "(Annual consultancy report)", url: null, date: "2026-02", tier: "SECONDARY" },
    { id: "c15", title: "LinkedIn roster + archived team pages (Wayback Machine deltas 2023–2026)", publisher: "LinkedIn / Internet Archive", url: null, date: "2026-06-08", tier: "SOCIAL" },
    { id: "c16", title: "Harborline Capital website — team & strategy pages", publisher: "harborlinecap.com", url: null, date: "2026-06-08", tier: "COMPANY_SELF" },
  ],
  methodology: {
    coverage: [
      { topic: "regulatory-disclosures", venues_searched: 6, hits: 4 },
      { topic: "performance-returns / pension NAV trail", venues_searched: 9, hits: 3 },
      { topic: "portfolio deal verification", venues_searched: 11, hits: 9 },
      { topic: "person research (2 principals, full; 3 extended, shallow)", venues_searched: 14, hits: 10 },
      { topic: "fund terms & economics", venues_searched: 8, hits: 3 },
      { topic: "market regime facts", venues_searched: 7, hits: 6 },
      { topic: "team stability (archived rosters)", venues_searched: 5, hits: 4 },
      { topic: "sanctions / PEP screening", venues_searched: 4, hits: 0 },
    ],
    completeness_pct: 78,
  },
};