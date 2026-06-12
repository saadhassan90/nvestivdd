/**
 * L1 Render Contract (v1.0)
 * Mirrors render-fixture-demo-fund.json exactly. The fixture is canonical;
 * where the PRD and the fixture disagree, the fixture wins.
 */

export type Maturity = "Emerging" | "Established" | "Institutional";

export type SectionKey =
  | "verdict"
  | "executive_summary"
  | "factsheet"
  | "claims_ledger"
  | "flags"
  | "modules"
  | "agenda"
  | "sources"
  | "esg"
  | "science";

export interface RenderMeta {
  schema_version: string;
  project_id: string;
  run_id: string;
  agent_version: string;
  generated_at: string;
  maturity: Maturity | string;
  asset_class: string;
  sections_present: SectionKey[];
}

export type NorthStarAnswer = "ADVANCE" | "CONDITIONAL" | "DECLINE";
export type VerdictTier =
  | "advance"
  | "advance_with_diligence"
  | "defer"
  | "decline";

export type ModuleKey =
  | "thesis"
  | "macro"
  | "track_record"
  | "team"
  | "economics";

export interface VerdictModuleChip {
  key: ModuleKey;
  label: string;
  score: number; // 0–100
  verdict_label: string;
  rationale: string;
  citation_ids: string[];
}

export interface ClaimsTally {
  confirmed: number;
  contradicted: number;
  unverifiable: number;
}

export type ChangeOurMindDirection = "would_advance" | "would_decline";

export interface ChangeOurMindItem {
  item: string;
  direction: ChangeOurMindDirection;
  question_refs: string[];
}

export interface Verdict {
  north_star: { answer: NorthStarAnswer; statement: string };
  composite_score: number; // 0–100
  tier: VerdictTier;
  modules: VerdictModuleChip[];
  claims_tally: ClaimsTally;
  change_our_mind: ChangeOurMindItem[];
}

export interface ExecBullet {
  category: string;
  detail: string;
  citation_ids: string[];
}

export interface ExecutiveSummary {
  narrative: string;
  key_strengths: ExecBullet[];
  key_risks: ExecBullet[];
}

export type Provenance = "verified" | "disclosed_only" | "not_disclosed";
export type FactsheetGroup =
  | "identity"
  | "scale"
  | "economics"
  | "governance"
  | "providers";

export interface FactsheetField {
  key: string;
  label: string;
  value: string | null;
  unit: string | null;
  group: FactsheetGroup;
  provenance: Provenance;
  citation_ids: string[];
}

export interface Factsheet {
  fields: FactsheetField[];
}

export type ClaimCategory = "fund" | "company" | "person";
export type Disposition = "CONFIRMED" | "CONTRADICTED" | "UNVERIFIABLE";
export type ClaimSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface Claim {
  id: string;
  category: ClaimCategory;
  entity: string;
  claim: string;
  disposition: Disposition;
  severity: ClaimSeverity;
  evidence: string;
  citation_ids: string[];
}

export interface ClaimsLedger {
  claims: Claim[];
}

export type FlagSeverity = "CRITICAL" | "WARNING";

export interface Flag {
  id: string;
  severity: FlagSeverity;
  category: string;
  tokens: string[];
  statement: string;
  evidence: string;
  citation_ids: string[];
  question_refs: string[];
}

export interface FlagQuestion {
  id: string;
  text: string;
  why: string;
  flag_ref: string | null;
}

export interface Flags {
  items: Flag[];
  questions: FlagQuestion[];
}

export interface ModuleKpi {
  label: string;
  value: string;
  unit: string | null;
  benchmark: string | null;
  delta: string | null;
  citation_ids: string[];
}

export type SourceTier =
  | "OFFICIAL_FILING"
  | "REGULATOR_DB"
  | "COURT_RECORD"
  | "PRIMARY_PRESS"
  | "INSTITUTIONAL_DISCLOSURE"
  | "COMPANY_SELF"
  | "SECONDARY"
  | "SOCIAL";

export interface ModuleFact {
  statement: string;
  source_tier: SourceTier;
  citation_id: string;
}

export interface Module {
  key: ModuleKey;
  title: string;
  verdict_chip: string;
  narrative_md: string;
  kpis: ModuleKpi[];
  facts: ModuleFact[];
  flag_refs: string[];
}

export interface AgendaItem {
  order: number;
  topic: string;
  minutes: number;
  what_to_validate: string;
  question_refs: string[];
  listen_for: { strong: string; weak: string };
}

export interface MaterialsRequest {
  item: string;
  reason: string;
  claim_refs: string[];
}

export interface Agenda {
  objective: string;
  items: AgendaItem[];
  standalone_asks: string[];
  materials_request: MaterialsRequest[];
  decision_rule: string;
}

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string | null;
  date: string;
  tier: SourceTier;
}

export interface MethodologyCoverage {
  topic: string;
  venues_searched: number;
  hits: number;
}

export interface Methodology {
  coverage: MethodologyCoverage[];
  completeness_pct: number;
}

export interface RenderPayload {
  meta: RenderMeta;
  verdict: Verdict;
  executive_summary: ExecutiveSummary;
  factsheet: Factsheet;
  claims_ledger: ClaimsLedger;
  flags: Flags;
  modules: Module[];
  agenda: Agenda;
  sources: Source[];
  methodology: Methodology;
}

export const MODULE_ORDER: ModuleKey[] = [
  "thesis",
  "macro",
  "track_record",
  "team",
  "economics",
];

export const MODULE_LABEL: Record<ModuleKey, string> = {
  thesis: "Thesis",
  macro: "Macro",
  track_record: "Track Record",
  team: "Team",
  economics: "Fund Economics",
};