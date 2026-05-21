export type OddSectionKey =
  | "firm_stability"
  | "staffing"
  | "people_process_systems"
  | "fund_terms"
  | "discrepancy_register"
  | "sources_appendix";

export interface OddSectionDef {
  key: OddSectionKey;
  title: string;
}

export const ODD_SECTIONS: OddSectionDef[] = [
  { key: "firm_stability", title: "Firm Stability" },
  { key: "staffing", title: "Staffing" },
  { key: "people_process_systems", title: "People / Process / Systems" },
  { key: "fund_terms", title: "Fund Terms" },
  { key: "discrepancy_register", title: "Discrepancy Register" },
  { key: "sources_appendix", title: "Sources & Appendix" },
];

export const ODD_STEP_KEY_PREFIX = "odd_";
export const oddStepKey = (key: OddSectionKey) => `${ODD_STEP_KEY_PREFIX}${key}`;

/**
 * Build the empty seed markdown for the ODD report — six fixed H2 headings
 * with placeholder bodies underneath. The pipeline replaces each section's
 * body as its job completes.
 */
export function buildOddSkeletonMarkdown(fundName: string): string {
  const lines: string[] = [];
  lines.push(`# ${fundName} — Operational Due Diligence Report`);
  lines.push("");
  for (const s of ODD_SECTIONS) {
    lines.push(`## ${s.title}`);
    lines.push("");
    lines.push("_[Generating…]_");
    lines.push("");
  }
  return lines.join("\n");
}

/**
 * Assemble the full report markdown from individual section results.
 * Sections without content show a placeholder.
 */
export function assembleOddMarkdown(opts: {
  fundName: string;
  sectionContent: Partial<Record<OddSectionKey, string | null>>;
}): string {
  const { fundName, sectionContent } = opts;
  const lines: string[] = [`# ${fundName} — Operational Due Diligence Report`, ""];
  for (const s of ODD_SECTIONS) {
    lines.push(`## ${s.title}`);
    lines.push("");
    const body = sectionContent[s.key];
    lines.push(body && body.trim().length > 0 ? body.trim() : "_[Generating…]_");
    lines.push("");
  }
  return lines.join("\n");
}