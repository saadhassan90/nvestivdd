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
    staffing: buildStaffing(team),
    people_process_systems: buildPeopleProcessSystems(providers, team),
    fund_terms: buildFundTerms(project, fees),
    discrepancy_register: buildDiscrepancyRegister(flags),
    sources_appendix: buildSourcesAppendix(sources, project),
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
    `**Verdict:** ${stabilityFlags.length === 0 ? "Stable" : "Conditional — flagged items below"}`,
    "",
    `**Entity:** ${gp}  `,
    `**Domicile:** ${domicile}  `,
    `**Inception:** ${inception}  `,
    `**Stated AUM / Fund size:** ${aum}  `,
    `**Regulatory status:** ${reg}`,
    "",
    "### Ownership & Capitalization",
    `${gp} reports a stable ownership structure. No material changes in beneficial ownership were identified in the prior 24 months based on Daseti disclosures cross-referenced with public registry data.`,
    "",
    "### Regulatory & Litigation",
    stabilityFlags.length
      ? stabilityFlags.map((f) => `- **${f.title}** — ${f.description || f.issue || ""}`).join("\n")
      : "No adverse regulatory actions, sanctions, or material litigation surfaced in primary records reviewed.",
    "",
    "### Going-Concern Assessment",
    "Operating cash runway, management-company economics, and balance-sheet disclosures are consistent with continued ordinary-course operations through the fund's investment period.",
  ].join("\n");
}

function buildStaffing(team: any[]): string {
  const key = team.filter((t) => t.is_key_person);
  const keyLines = (key.length ? key : team.slice(0, 4)).map(
    (t) =>
      `| ${t.name} | ${t.title || t.role_category || "—"} | ${t.years_experience ?? "—"} yrs | ${t.verification_status || "unverified"} |`,
  );
  const adverse = team.filter((t) => t.adverse_findings && t.adverse_finding_severity);

  return [
    `**Headcount reviewed:** ${team.length}  `,
    `**Designated key persons:** ${key.length}`,
    "",
    "### Key Persons",
    "| Name | Role | Experience | Verification |",
    "|---|---|---|---|",
    ...(keyLines.length ? keyLines : ["| _No team disclosed_ | — | — | — |"]),
    "",
    "### Background Verification",
    adverse.length
      ? adverse
          .map(
            (t) =>
              `- **${t.name}** (${t.adverse_finding_severity}) — ${t.adverse_findings}`,
          )
          .join("\n")
      : "Background reviews returned clean across all key persons. Education, prior affiliations, and regulatory records reconciled to disclosures.",
    "",
    "### Compensation & Retention",
    "Carry economics and vesting schedules align with ADIA peer-group norms. No unusual side-letter compensation arrangements were identified.",
  ].join("\n");
}

function buildPeopleProcessSystems(providers: any[], team: any[]): string {
  const byType = providers.reduce<Record<string, any[]>>((acc, p) => {
    const k = p.provider_type || "other";
    (acc[k] ??= []).push(p);
    return acc;
  }, {});
  const providerLines = Object.entries(byType).map(
    ([type, ps]) =>
      `- **${type}:** ${ps.map((p) => p.provider_name || "Undisclosed").join(", ")}`,
  );

  return [
    "### Investment Process",
    "Sourcing → screening → IC → execution → portfolio monitoring is documented and consistently applied. Decision rights and IC quorum requirements are codified in the LPA.",
    "",
    "### Service Providers",
    providerLines.length ? providerLines.join("\n") : "_No service providers disclosed in source data._",
    "",
    "### Systems & Operational Infrastructure",
    `- Portfolio accounting and investor reporting handled by the disclosed fund administrator with monthly reconciliations.`,
    `- Cybersecurity posture: MFA enforced, SOC 2 Type II at primary service providers, documented incident-response plan.`,
    `- Business continuity: documented BCP / DRP with annual tabletop testing.`,
    "",
    "### Operating Team Capacity",
    `Operational headcount of ${team.filter((t) => /ops|finance|cfo|coo|compliance/i.test(t.role_category || t.title || "")).length || "—"} dedicated personnel supports current AUM with capacity for stated fundraising target.`,
  ].join("\n");
}

function buildFundTerms(project: any, fees: any[]): string {
  const feeLines = fees.map(
    (f) =>
      `| ${f.component} | ${f.share_class || "—"} | ${f.value} | ${f.assessment || "—"} |`,
  );

  return [
    `**Strategy:** ${project.strategy || project.asset_class || "—"}  `,
    `**Vintage:** ${project.vintage || "—"}  `,
    `**Target size:** ${project.fund_size_estimated || "—"}`,
    "",
    "### Economic Terms",
    "| Component | Share Class | Value | Assessment |",
    "|---|---|---|---|",
    ...(feeLines.length ? feeLines : ["| _No fee terms disclosed_ | — | — | — |"]),
    "",
    "### Governance & LPAC",
    "LPAC composition, voting thresholds, and key-person provisions are consistent with ILPA standards. Removal-for-cause and no-fault divorce mechanics are present.",
    "",
    "### Alignment",
    "GP commitment is disclosed and funded in cash, not via management-fee offset.",
  ].join("\n");
}

function buildDiscrepancyRegister(flags: any[]): string {
  if (!flags.length) {
    return "No material discrepancies identified between Daseti disclosures and supporting documentation reviewed.";
  }
  return [
    "| # | Item | Severity | Implication | Resolution |",
    "|---|---|---|---|---|",
    ...flags.map(
      (f, i) =>
        `| ${i + 1} | ${f.title} | ${f.severity || "—"} | ${(f.implication || f.description || "—").replace(/\n/g, " ")} | ${f.resolution || "Open — follow-up required"} |`,
    ),
  ].join("\n");
}

function buildSourcesAppendix(sources: any[], project: any): string {
  const lines = sources.map(
    (s, i) => `${i + 1}. [${s.title}](${s.url})${s.source_category ? ` — *${s.source_category}*` : ""}`,
  );
  return [
    "### Documents Reviewed",
    "- Daseti operational due diligence export",
    "- Limited Partnership Agreement (LPA)",
    "- Private Placement Memorandum (PPM)",
    "- ILPA DDQ responses",
    "- Audited financial statements (most recent two years)",
    "- Compliance manual & policies",
    "",
    "### External Research Sources",
    lines.length ? lines.join("\n") : "_No external sources logged for this fund._",
    "",
    `**Analysis date:** ${project.analysis_date || new Date().toISOString().slice(0, 10)}`,
  ].join("\n");
}