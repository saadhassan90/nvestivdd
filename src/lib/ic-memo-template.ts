import type { Tables } from "@/integrations/supabase/types";

/**
 * Build the seeded markdown skeleton for an IC Memo from the L1 report data.
 * Uses the same skeleton-first rule as the L1 report — every section is present
 * even if empty, with [NOT YET DRAFTED] placeholders so the structure is locked.
 */
export function buildIcMemoSkeletonMarkdown(opts: {
  project: Tables<"projects">;
  redFlags?: Tables<"red_flags">[];
  feeStructure?: any[];
  teamMembers?: any[];
}): string {
  const { project, redFlags = [], feeStructure = [], teamMembers = [] } = opts;
  const placeholder = "_[NOT YET DRAFTED]_";

  const fund = project.fund_name || "Untitled Fund";
  const sponsor = project.gp_entity_name || "—";
  const composite = project.composite_score ?? "—";
  const recommendation = project.recommendation || placeholder;
  const tier = project.score_tier || "—";
  const strategy = project.strategy || placeholder;
  const assetClass = project.asset_class || "—";
  const vintage = project.vintage || project.established_year || "—";
  const fundSize = project.fund_size_estimated || "—";
  const domicile = project.domicile || "—";

  const execSummary = project.executive_summary_narrative || placeholder;
  const finalAssessment = project.final_assessment_narrative || placeholder;

  const strengths = (project.key_strengths as any[] | null) || [];
  const risks = (project.key_risks as any[] | null) || [];
  const conditions = (project.conditions_for_advancement as any[] | null) || [];

  const topRedFlags = redFlags
    .slice()
    .sort((a, b) => {
      const order: Record<string, number> = { critical: 0, elevated: 1, monitor: 2 };
      return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
    })
    .slice(0, 5);

  const renderList = (items: any[]) =>
    items.length === 0
      ? placeholder
      : items
          .map((it) => `- ${typeof it === "string" ? it : it.title || it.label || JSON.stringify(it)}`)
          .join("\n");

  const feeRows =
    feeStructure.length === 0
      ? placeholder
      : `| Component | Share Class | Value | Assessment |\n|---|---|---|---|\n${feeStructure
          .map(
            (f) =>
              `| ${f.component || "—"} | ${f.share_class || "—"} | ${f.value || "—"} | ${
                f.assessment || "—"
              } |`,
          )
          .join("\n")}`;

  const keyPersons = teamMembers.filter((t) => t.is_key_person).slice(0, 6);
  const teamSummary =
    keyPersons.length === 0
      ? placeholder
      : keyPersons
          .map((t) => `- **${t.name}** — ${t.title || "—"}${t.years_experience ? ` (${t.years_experience}y)` : ""}`)
          .join("\n");

  return `# ${fund} — Investment Committee Memo

**Sponsor:** ${sponsor} · **Asset Class:** ${assetClass} · **Vintage:** ${vintage} · **Domicile:** ${domicile}

---

## Recommendation

**${recommendation}** · Composite Score: **${composite}/100** · Tier: **${tier}**

${finalAssessment}

## Executive Summary

${execSummary}

## Fund Overview

- **Fund Name:** ${fund}
- **Sponsor / GP:** ${sponsor}
- **Strategy:** ${strategy}
- **Asset Class:** ${assetClass}
- **Target Size:** ${fundSize}
- **Vintage:** ${vintage}
- **Domicile:** ${domicile}

## Team & Governance

${teamSummary}

## Strategy

${strategy === placeholder ? placeholder : strategy}

## Performance & Track Record

${placeholder}

## Fees & Terms

${feeRows}

## Risks & Mitigants

**Key Risks**
${renderList(risks)}

**Top Red Flags**
${
  topRedFlags.length === 0
    ? placeholder
    : topRedFlags
        .map(
          (f) =>
            `- **[${f.severity?.toUpperCase()}]** ${f.title}${
              f.implication ? ` — _${f.implication}_` : ""
            }`,
        )
        .join("\n")
}

**Mitigants**
${placeholder}

## Strengths

${renderList(strengths)}

## Diligence Status

${placeholder}

## Conditions for Advancement

${renderList(conditions)}

## Appendix

${placeholder}
`;
}