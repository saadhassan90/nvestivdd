import { supabase } from "@/integrations/supabase/client";
import { ODD_SECTIONS, type OddSectionKey, assembleOddMarkdown } from "@/lib/odd-template";

/**
 * Build a mock ODD report by pulling existing L1 data for the project
 * (team, providers, fees, red flags, sources) and assembling six
 * ADIA-format sections. Writes directly to odd_reports +
 * odd_section_results with complete status so the canvas renders
 * immediately — no pipeline / file upload needed.
 */
export async function generateMockOddReport(projectId: string, fundName: string) {
  const [projectRes, teamRes, providersRes, feesRes, flagsRes, sourcesRes] = await Promise.all([
    supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
    supabase.from("team_members").select("*").eq("project_id", projectId).order("order_index"),
    supabase.from("service_providers").select("*").eq("project_id", projectId),
    supabase.from("fee_structure").select("*").eq("project_id", projectId).order("order_index"),
    supabase.from("red_flags").select("*").eq("project_id", projectId).order("order_index"),
    supabase.from("research_sources").select("*").eq("project_id", projectId).limit(20),
  ]);

  const project: any = projectRes.data ?? {};
  const team: any[] = teamRes.data ?? [];
  const providers: any[] = providersRes.data ?? [];
  const fees: any[] = feesRes.data ?? [];
  const flags: any[] = flagsRes.data ?? [];
  const sources: any[] = sourcesRes.data ?? [];

  const sectionContent: Record<OddSectionKey, string> = {
    firm_stability: buildFirmStability(project, flags),
    staffing: buildStaffing(team, providers),
    people_process_systems: buildPeopleProcessSystems(providers, team, project),
    fund_terms: buildFundTerms(project, fees),
    discrepancy_register: buildDiscrepancyRegister(flags),
    sources_appendix: buildSourcesAppendix(sources, project, team, fees, providers),
  };

  const riskRating = deriveRiskRating(flags, project);

  // Upsert report row
  const fullMd = assembleOddMarkdown({ fundName, sectionContent });
  await supabase
    .from("odd_reports")
    .upsert(
      {
        project_id: projectId,
        content_json: [],
        content_markdown: fullMd,
        risk_rating: riskRating,
        version: 1,
      },
      { onConflict: "project_id" },
    );

  // Upsert all six sections as complete with verified status
  const rows = ODD_SECTIONS.map((s) => ({
    project_id: projectId,
    section_key: s.key,
    status: "complete" as const,
    content_markdown: sectionContent[s.key],
    verification_status: "verified" as const,
    flag_count: 0,
    error_message: null,
  }));
  await supabase
    .from("odd_section_results")
    .upsert(rows, { onConflict: "project_id,section_key" });
}

function deriveRiskRating(flags: any[], project: any): "low" | "medium" | "high" {
  const critical = flags.filter((f) => f.severity === "critical" || f.severity === "high").length;
  if (critical >= 2) return "high";
  if (critical === 1) return "medium";
  const score = project.composite_score ?? 0;
  if (score >= 75) return "low";
  if (score >= 55) return "medium";
  return "high";
}

function buildFirmStability(project: any, flags: any[]): string {
  const gp = project.gp_entity_name || project.fund_name || "The GP";
  const inception = project.fund_inception_date || project.established_year || "—";
  const domicile = project.domicile || "—";
  const reg = project.regulatory_status || "Disclosure not confirmed";
  const aum = project.fund_size_estimated || "—";
  const stabilityFlags = flags.filter((f) =>
    /firm|stability|regulator|litigation|ownership/i.test(`${f.title} ${f.module ?? ""}`),
  );

  return [
    `**Risk rating (this section):** ${stabilityFlags.length === 0 ? "Low" : stabilityFlags.length > 1 ? "Medium" : "Low–Medium"}`,
    "",
    `${gp} was established in ${inception} and is domiciled in ${domicile}. The firm is ${reg.toLowerCase().includes("not") ? "operating without confirmed regulatory registration in primary jurisdictions reviewed" : `registered as ${reg}`}, with stated assets under management of ${aum}. Across its history the firm has raised a single-strategy family of vehicles and continues to manage prior vintages alongside the fund under review.`,
    "",
    "### Founding & ownership history",
    `${gp} was founded by its current senior partners and remains majority-owned by the founding investment team, with the balance held by long-tenured operating partners. No material transfers of beneficial ownership were identified in the prior 24 months based on Daseti disclosures cross-referenced with Form ADV Part 1 (Item 7A) and public registry data. The ownership structure is straightforward, with no holding company layers, no external strategic shareholders, and no minority stakes held by third-party GP stake investors.`,
    "",
    "### Business lines & scale",
    `The firm runs a single strategy out of one investment team, which reduces operational complexity and conflicts that typically arise where multi-strategy platforms share resources. Historical track record shows multiple prior vintages with capital deployed across the strategy's target deal size. Reported AUM and fund count reconcile to Form ADV Part 1 Item 5 and Form D filings within rounding.`,
    "",
    "### Breakeven AUM, GP commitment & insurance",
    `Breakeven AUM is not formally disclosed; based on management-company headcount and disclosed overhead, the firm is assessed to operate comfortably above breakeven at current AUM. The GP commitment to the fund is funded in cash by the partners (not via management-fee waiver or credit line), which the team views as a meaningful alignment signal. Insurance coverage in force includes E&O, D&O, and cyber policies at limits consistent with peer-group practice; no prior claims have been disclosed.`,
    "",
    "### Financial stability & flagged items",
    stabilityFlags.length
      ? stabilityFlags.map((f) => `- **${f.title}** — ${f.description || f.issue || ""}`).join("\n")
      : "No material financial distress, revenue concentration, or going-concern indicators were identified. Operating cash runway, management-company economics, and balance-sheet disclosures are consistent with continued ordinary-course operations through the fund's investment period.",
  ].join("\n");
}

function buildStaffing(team: any[], providers: any[]): string {
  const key = team.filter((t) => t.is_key_person);
  const adverse = team.filter((t) => t.adverse_findings && t.adverse_finding_severity);
  const investmentCount = team.filter((t) => /invest|partner|principal|associate|analyst/i.test(t.role_category || t.title || "")).length;
  const nonInvestCount = team.filter((t) => /ops|finance|cfo|coo|compliance|legal|it|tech|hr/i.test(t.role_category || t.title || "")).length;
  const keyNames = (key.length ? key : team.slice(0, 3)).map((t) => t.name).filter(Boolean).join(", ") || "the founding partners";

  return [
    `**Risk rating (this section):** ${adverse.length ? "Medium" : "Low"}`,
    "",
    `Total disclosed headcount is ${team.length || "—"}, split between approximately ${investmentCount} investment professionals and ${nonInvestCount || "a small"} non-investment staff covering operations, finance, compliance, legal, and IT. Non-investment staffing is the more telling figure for ODD purposes, and at current AUM the bench is assessed as adequate, though several functions are leanly resourced and depend on external service providers for capacity (notably ${providers.slice(0, 3).map((p) => p.provider_name).filter(Boolean).join(", ") || "the administrator, auditor, and outside counsel"}).`,
    "",
    "### Locations & outsourcing",
    `The firm operates from a single primary office in its home jurisdiction with no satellite investment teams. Outsourced functions include fund administration, audit, tax, and primary legal counsel. Each outsourced provider is based in the same regulatory jurisdiction as the GP, which simplifies oversight and avoids cross-border supervisory gaps.`,
    "",
    "### Succession & key-person risk",
    `Designated key persons are ${keyNames}. A formal, documented succession plan covering departure of any single key person is in place; given firm size, succession depth beyond the founding partners is limited but consistent with peers of comparable scale. The LPA key-person clause suspends the investment period upon a qualifying event, providing LP protection while the GP cures.`,
    "",
    "### Background checks",
    adverse.length
      ? `Pre-hire background checks are performed by a recognized third-party provider; periodic refresh checks are not consistently applied. Adverse findings identified during this review:\n${adverse.map((t) => `- **${t.name}** (${t.adverse_finding_severity}) — ${t.adverse_findings}`).join("\n")}`
      : `Pre-hire background checks are performed by a recognized third-party provider; periodic refresh checks are documented but ad hoc in cadence. Public regulatory records (BrokerCheck, equivalent local registries) returned clean across all named principals, with education, prior affiliations, and regulatory history reconciled to firm disclosures.`,
    "",
    "### Alignment of interest",
    `The GP commitment is meaningful relative to the target fund size and is funded in cash. Carried interest is shared broadly with investment staff; the firm did not disclose the carry split percentages, which is consistent with industry practice but limits independent assessment of internal alignment. No unusual side-letter compensation arrangements between the firm and individual partners were identified.`,
  ].join("\n");
}

function buildPeopleProcessSystems(providers: any[], team: any[], project: any): string {
  const byType = providers.reduce<Record<string, any[]>>((acc, p) => {
    const k = p.provider_type || "other";
    (acc[k] ??= []).push(p);
    return acc;
  }, {});
  const named = (type: string) =>
    (byType[type] || []).map((p) => p.provider_name).filter(Boolean).join(", ") || "—";
  const admin = named("administrator") || named("admin");
  const auditor = named("auditor") || named("audit");
  const bank = named("bank") || named("custodian");
  const legal = named("legal") || named("counsel");

  return [
    `**Risk rating (this section):** Low–Medium`,
    "",
    "### 3.1 Investment process & governance",
    `The Investment Committee comprises the senior investment partners and operates under a documented charter requiring unanimous consent for new commitments above stated thresholds and majority consent for follow-ons and exits. Sourcing → screening → IC pre-read → confirmatory diligence → final IC → execution → portfolio monitoring is consistently applied; due diligence is led by deal teams with external advisors (commercial, financial, legal, ESG) engaged on a per-deal basis. Approval mechanics for both investments and exits are codified in the LPA and IC charter.`,
    "",
    "### 3.2 Internal controls",
    `Fund administration is performed by ${admin}, with the internal finance team reconciling administrator NAV calculations, capital activity, and investor statements on a quarterly basis. Cash controls require dual authorization for outbound payments above de-minimis thresholds; payment initiation is segregated from approval. ADIA issued standardized out-of-band questionnaires directly to the fund's bank (${bank}) and administrator; both returned responses consistent with manager disclosures.`,
    "",
    "### 3.3 Allocation policy",
    `A written allocation policy is in place covering pro-rata allocation across vehicles with overlapping mandates. Given the firm runs a single-strategy fund family, the only overlap is the successor-fund period at the end of the current fund's investment phase; conflict risk during overlap is assessed as low and is governed by the policy.`,
    "",
    "### 3.4 Administration & accounting",
    `Administrator: ${admin} — full-scope engagement covering books and records, capital activity, investor reporting, and NAV. Auditor: ${auditor} — independence confirmed; most recent audit issued an unqualified opinion. Valuation is performed quarterly under a written policy with a Valuation Committee composed of investment and finance staff; the Committee composition skews toward investment staff, which is noted as an item for monitoring (ADIA preference is a non-investment majority). An external valuation agent is not currently engaged for Level 3 holdings.`,
    "",
    "### 3.5 Compliance & regulatory",
    `The firm is registered in its primary jurisdiction(s) and has been subject to routine regulatory examination with no material findings disclosed. Compliance is led by a named Chief Compliance Officer supported by an external compliance consultant. The Code of Ethics covers personal account dealing (pre-clearance required), gifts and entertainment (logging plus thresholds), expert-network usage (pre-approval and call logs), outside business activities (annual disclosure), and political contributions (pre-clearance). Annual employee attestations and an annual policy review are documented. No conflicts of interest involving employee co-investment vehicles were disclosed beyond the standard partner co-invest sleeve.`,
    "",
    "### 3.6 Legal",
    `No ongoing or pending material litigation involving the firm was disclosed or surfaced through public-records search. No regulatory enforcement actions are pending. Outside legal counsel for the fund is ${legal}. No placement agents were used for this fund; the firm raised capital direct from LPs.`,
    "",
    "### 3.7 Technology & systems",
    `IT infrastructure is predominantly cloud-based across major SaaS platforms (portfolio management, CRM, document management) with MFA enforced firm-wide and SSO at primary providers. Cybersecurity controls are self-reported and include endpoint protection, mandatory training, and an incident-response plan; SOC 2 Type II reports are in place at primary outsourced providers. A formal AI use policy was adopted in 2025 covering permitted tools, data-handling restrictions for confidential information, and prohibition of client/deal data input into public model interfaces. A documented BCP/DRP is in place with annual tabletop testing and supports remote-working continuity.`,
  ].join("\n");
}

function buildFundTerms(project: any, fees: any[]): string {
  const feeLines = fees.map(
    (f) =>
      `| ${f.component} | ${f.share_class || "—"} | ${f.value} | ${(f.assessment || "—").replace(/\n/g, " ")} |`,
  );

  return [
    `**Risk rating (this section):** Low`,
    "",
    `Strategy: ${project.strategy || project.asset_class || "—"}. Target fund size: ${project.fund_size_estimated || "—"}. Vintage: ${project.vintage || "—"}. Terms below are sourced from the LPA where available, with PPM and ILPA DDQ as supplementary references.`,
    "",
    "### Economic terms",
    "| Component | Share class | Value | Assessment |",
    "|---|---|---|---|",
    ...(feeLines.length ? feeLines : ["| _No fee terms disclosed_ | — | — | — |"]),
    "",
    "### Key man, GP commitment & waterfall",
    `The key-person clause names the firm's senior partners and triggers automatic suspension of the investment period upon a qualifying departure or reduction in time-commitment, cured by partner replacement subject to LPAC consent. GP commitment is funded in cash. Carried interest follows a European whole-fund waterfall with a customary preferred return and full GP catch-up; clawback is fund-level, secured by a partner-level guarantee and escrow of a percentage of distributions.`,
    "",
    "### Fees, expenses & leverage",
    `Affiliate and transaction fees charged to portfolio companies are offset 100% against the management fee. Organizational expenses are capped at a market-standard amount. A subscription credit facility is in place with a permitted borrowing duration that is consistent with current ILPA guidance; fund-level leverage outside the sub-line is not contemplated.`,
    "",
    "### LPAC & transfer restrictions",
    `The LPAC composition, voting requirements, and matters requiring LPAC consent are consistent with ILPA standards. Removal-for-cause and no-fault divorce mechanics are present at market thresholds. LP transfers require GP consent (not to be unreasonably withheld) with standard ERISA/tax carve-outs.`,
  ].join("\n");
}

function buildDiscrepancyRegister(flags: any[]): string {
  const header = [
    `**Verification scope:** Form ADV, Form D, BrokerCheck, public litigation databases, firm website cross-check, administrator out-of-band response, bank/custodian out-of-band response.`,
    "",
  ].join("\n");
  if (!flags.length) {
    return (
      header +
      "No material discrepancies identified between Daseti / GP disclosures and independently sourced public data. Form ADV AUM reconciles to Daseti; Form D fund-raise figures reconcile to PPM target; BrokerCheck disclosures match compliance self-certification; administrator and bank responses are consistent with manager disclosures."
    );
  }
  return header + [
    "| # | Item | Severity | Implication | Resolution |",
    "|---|---|---|---|---|",
    ...flags.map(
      (f, i) =>
        `| ${i + 1} | ${f.title} | ${f.severity || "—"} | ${(f.implication || f.description || "—").replace(/\n/g, " ")} | ${f.resolution || "Open — follow-up required"} |`,
    ),
  ].join("\n");
}

function buildSourcesAppendix(
  sources: any[],
  project: any,
  team: any[],
  fees: any[],
  providers: any[],
): string {
  const lines = sources.map(
    (s, i) => `${i + 1}. [${s.title}](${s.url})${s.source_category ? ` — *${s.source_category}*` : ""}`,
  );
  const named = (type: string) =>
    providers.find((p) => (p.provider_type || "").toLowerCase().includes(type))?.provider_name || "—";

  return [
    "### 6.1 Source list",
    "| # | Source | Type | Date / Version |",
    "|---|---|---|---|",
    "| 1 | Daseti Firm Questionnaire | Structured questionnaire | Current |",
    "| 2 | Daseti Fund Questionnaire | Structured questionnaire | Current |",
    "| 3 | ILPA DDQ | Standard questionnaire | Current |",
    "| 4 | LPA | Legal document | Latest executed |",
    "| 5 | PPM | Offering document | Current |",
    "| 6 | Audited Financial Statements | Financial document | Most recent two FYs |",
    "| 7 | Compliance Policies | Policy document | Current |",
    "| 8 | Marketing Presentation | GP-provided | Current |",
    "| 9 | Form ADV | SEC filing | Retrieved for this review |",
    "| 10 | Form D | SEC filing | Retrieved for this review |",
    "| 11 | BrokerCheck — Firm | FINRA | Retrieved for this review |",
    "| 12 | BrokerCheck — Key Persons | FINRA | Retrieved for this review |",
    "| 13 | Administrator Questionnaire Response | Out-of-band email | Received |",
    "| 14 | Bank/Custodian Questionnaire Response | Out-of-band email | Received |",
    "",
    "### 6.2 Firm appendix",
    `- **Firm name:** ${project.gp_entity_name || project.fund_name || "—"}`,
    `- **Headquarters:** ${project.domicile || "—"}`,
    `- **Year founded:** ${project.established_year || project.fund_inception_date || "—"}`,
    `- **AUM (total):** ${project.fund_size_estimated || "—"}`,
    `- **Number of strategies:** 1 (single-strategy)`,
    `- **Employees (investment):** ${team.filter((t) => /invest|partner|principal|associate|analyst/i.test(t.role_category || t.title || "")).length || "—"}`,
    `- **Employees (non-investment):** ${team.filter((t) => /ops|finance|cfo|coo|compliance|legal|it/i.test(t.role_category || t.title || "")).length || "—"}`,
    `- **Outsourced functions:** Administration, audit, tax, primary legal`,
    `- **Regulatory registrations:** ${project.regulatory_status || "—"}`,
    `- **Any regulatory findings:** No (per disclosure)`,
    `- **Any litigation:** No (per disclosure)`,
    `- **Insurance — types in force:** E&O, D&O, cyber`,
    `- **Breakeven AUM:** Not disclosed (assessed comfortably above current AUM)`,
    "",
    "### 6.3 Fund appendix",
    `- **Fund name:** ${project.fund_name || "—"}`,
    `- **Domicile:** ${project.domicile || "—"}`,
    `- **Fund size (target):** ${project.fund_size_estimated || "—"}`,
    `- **Strategy:** ${project.strategy || project.asset_class || "—"}`,
    `- **Vintage:** ${project.vintage || "—"}`,
    `- **Administrator:** ${named("admin")}`,
    `- **Auditor:** ${named("audit")}`,
    `- **Legal counsel:** ${named("legal") || named("counsel")}`,
    `- **Subscription line lender:** ${named("bank")}`,
    "",
    "### 6.4 Methodology reference",
    "This review was conducted in accordance with ADIA's ODD methodology for closed-ended private markets funds. The review covers firm stability, staffing, people/process/systems, and fund-specific documentation. Independent verification was conducted against public regulatory filings (SEC EDGAR, BrokerCheck) and via direct out-of-band questionnaires to the fund's administrator and banking institution. The overall risk rating reflects the analyst's judgment across all dimensions reviewed and is not a mechanical score.",
    "",
    "**Risk rating guidance:** *Low* — no material issues identified. *Medium* — items requiring follow-up, enhanced monitoring, or specific LP protections. *High* — material issues that must be resolved before investment can proceed.",
    "",
    "### External research sources",
    lines.length ? lines.join("\n") : "_No external sources logged for this fund._",
    "",
    `**Analysis date:** ${project.analysis_date || new Date().toISOString().slice(0, 10)}`,
  ].join("\n");
}