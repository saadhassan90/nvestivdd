export type RaiseStatus = "Live" | "In setup" | "Closing";
export type DdqProvenance = "ILPA" | "IRIS" | "LP-direct";
export type DdqState = "answered" | "unanswered" | "suggested";
export type ConsentState = "pending" | "shared" | "withdrawn";

export type PipelineStage =
  | "sent"
  | "requested_dataroom"
  | "nda_sent"
  | "nda_signed"
  | "dataroom_sent"
  | "opened"
  | "ic_ready"
  | "declined"
  | "ready_to_invest"
  | "current_investor";

export const PIPELINE_STAGES: { id: PipelineStage; label: string }[] = [
  { id: "sent", label: "Sent" },
  { id: "requested_dataroom", label: "Requested Dataroom" },
  { id: "nda_sent", label: "NDA Sent" },
  { id: "nda_signed", label: "NDA Signed" },
  { id: "dataroom_sent", label: "Dataroom Sent" },
  { id: "opened", label: "Opened" },
  { id: "ic_ready", label: "IC Ready" },
  { id: "declined", label: "Declined Investment" },
  { id: "ready_to_invest", label: "Ready to Invest" },
  { id: "current_investor", label: "Current Investor" },
];

export const PIPELINE_STAGE_LABEL: Record<PipelineStage, string> = PIPELINE_STAGES.reduce(
  (acc, s) => ({ ...acc, [s.id]: s.label }),
  {} as Record<PipelineStage, string>,
);

export interface DataroomFile {
  id: string;
  name: string;
  category: "Fund docs" | "Track record" | "Team" | "Operations" | "Legal";
  version: number;
  sizeKb: number;
  uploadedAt: string; // ISO
  uploadedBy: string;
}

export interface DdqItem {
  id: string;
  question: string;
  answer?: string;
  provenance: DdqProvenance;
  state: DdqState;
  section: string;
  updatedAt: string;
}

export interface ReportSection {
  id: string;
  title: string;
  score: number; // 0-100
  summary: string;
  lastSynth: string;
}

export interface L2Lp {
  id: string;
  name: string;
  type: "Pension" | "Endowment" | "Family Office" | "Insurance" | "SWF";
  consent: ConsentState;
  lastActivity: string;
  questions: number;
  ndaSignedAt: string;
  stage?: PipelineStage;
}

export interface Raise {
  id: string;
  name: string;
  vintage: number;
  strategy: string;
  targetSize: string;
  status: RaiseStatus;
  completion: {
    dataroom: number;
    report: number;
    ddq: number;
    interview: number;
  };
  dataroom: DataroomFile[];
  ddq: DdqItem[];
  report: ReportSection[];
  lps: L2Lp[];
}

export const RAISES: Raise[] = [
  {
    id: "fund-001",
    name: "Meridian Credit Opportunities III",
    vintage: 2026,
    strategy: "Opportunistic private credit",
    targetSize: "$1.2B",
    status: "Live",
    completion: { dataroom: 92, report: 85, ddq: 64, interview: 70 },
    dataroom: [
      { id: "f1", name: "PPM_v4.pdf", category: "Fund docs", version: 4, sizeKb: 4820, uploadedAt: "2026-05-12T10:14:00Z", uploadedBy: "J. Park" },
      { id: "f2", name: "LPA_redline_v2.pdf", category: "Legal", version: 2, sizeKb: 1240, uploadedAt: "2026-05-09T16:02:00Z", uploadedBy: "Counsel" },
      { id: "f3", name: "Track_record_2014-2025.xlsx", category: "Track record", version: 7, sizeKb: 612, uploadedAt: "2026-05-14T09:30:00Z", uploadedBy: "M. Liu" },
      { id: "f4", name: "Team_bios_2026.pdf", category: "Team", version: 1, sizeKb: 980, uploadedAt: "2026-04-22T11:00:00Z", uploadedBy: "HR" },
      { id: "f5", name: "Ops_DDQ_responses.docx", category: "Operations", version: 3, sizeKb: 320, uploadedAt: "2026-05-15T14:48:00Z", uploadedBy: "J. Park" },
      { id: "f6", name: "Case_studies_2026.pdf", category: "Track record", version: 1, sizeKb: 2100, uploadedAt: "2026-05-01T08:10:00Z", uploadedBy: "M. Liu" },
    ],
    ddq: [
      { id: "d1", question: "Describe the firm's ownership structure and any changes in the past 5 years.", answer: "100% employee-owned since 2019 spinout. No external GP stakes.", provenance: "ILPA", state: "answered", section: "Firm", updatedAt: "2026-05-10" },
      { id: "d2", question: "Detail the investment committee voting protocol.", answer: "5 voting members, supermajority (4/5) required. CIO holds tie-break only in 50/50 splits.", provenance: "ILPA", state: "answered", section: "Governance", updatedAt: "2026-05-10" },
      { id: "d3", question: "What is the projected loss ratio across the realized portfolio?", provenance: "IRIS", state: "suggested", section: "Track record", updatedAt: "2026-05-15" },
      { id: "d4", question: "Provide ESG integration framework, including SFDR classification.", provenance: "ILPA", state: "unanswered", section: "ESG", updatedAt: "2026-05-08" },
      { id: "d5", question: "How is the GP commit funded and over what period?", answer: "3% GP commit, funded in cash at first close, sourced from partner balance sheet.", provenance: "ILPA", state: "answered", section: "Alignment", updatedAt: "2026-05-11" },
      { id: "d6", question: "Walk through underwriting on the 3 largest realized losses.", provenance: "LP-direct", state: "unanswered", section: "Track record", updatedAt: "2026-05-16" },
      { id: "d7", question: "Clarify the recycling provision mechanics and cap.", provenance: "IRIS", state: "suggested", section: "Terms", updatedAt: "2026-05-15" },
    ],
    report: [
      { id: "r1", title: "Thesis", score: 78, summary: "Differentiated origination in mid-market sponsor-backed credit; thesis holds through the cycle but spread compression is a watch item.", lastSynth: "2026-05-14" },
      { id: "r2", title: "Market", score: 82, summary: "Tailwind from bank retrenchment; competitive set remains crowded at the upper end.", lastSynth: "2026-05-14" },
      { id: "r3", title: "Team", score: 88, summary: "Senior team intact across 3 funds; second-line bench has strengthened materially since Fund II.", lastSynth: "2026-05-12" },
      { id: "r4", title: "Track record", score: 74, summary: "Gross IRR 17.4% / DPI 1.3x on Fund II. Loss ratio elevated vs. peers; concentrated in 2022 vintage deals.", lastSynth: "2026-05-15" },
      { id: "r5", title: "Economics", score: 70, summary: "Mgmt fee 1.5% on invested; carry 15% over 7% pref. European waterfall. GP commit 3%.", lastSynth: "2026-05-13" },
    ],
    lps: [
      { id: "lp1", name: "Atlas State Pension", type: "Pension", consent: "shared", lastActivity: "2h ago", questions: 12, ndaSignedAt: "2026-04-30" },
      { id: "lp2", name: "Westbrook Endowment", type: "Endowment", consent: "shared", lastActivity: "1d ago", questions: 7, ndaSignedAt: "2026-05-02" },
      { id: "lp3", name: "Harlow Family Office", type: "Family Office", consent: "pending", lastActivity: "3d ago", questions: 3, ndaSignedAt: "2026-05-09" },
      { id: "lp4", name: "Northern Mutual", type: "Insurance", consent: "shared", lastActivity: "5h ago", questions: 9, ndaSignedAt: "2026-05-05" },
    ],
  },
  {
    id: "fund-002",
    name: "Aspen Growth Equity II",
    vintage: 2026,
    strategy: "B2B SaaS growth equity",
    targetSize: "$450M",
    status: "In setup",
    completion: { dataroom: 48, report: 35, ddq: 30, interview: 55 },
    dataroom: [
      { id: "f1", name: "PPM_draft.pdf", category: "Fund docs", version: 1, sizeKb: 3200, uploadedAt: "2026-05-18T12:00:00Z", uploadedBy: "S. Reyes" },
      { id: "f2", name: "Fund_I_TVPI_summary.xlsx", category: "Track record", version: 2, sizeKb: 280, uploadedAt: "2026-05-17T10:00:00Z", uploadedBy: "S. Reyes" },
    ],
    ddq: [
      { id: "d1", question: "Describe the firm's ownership structure.", provenance: "ILPA", state: "unanswered", section: "Firm", updatedAt: "2026-05-18" },
      { id: "d2", question: "What is the typical check size and ownership target?", provenance: "IRIS", state: "suggested", section: "Strategy", updatedAt: "2026-05-18" },
    ],
    report: [
      { id: "r1", title: "Thesis", score: 62, summary: "Vertical SaaS focus is timely; needs sharper articulation of edge vs. crossover funds re-entering growth stage.", lastSynth: "2026-05-18" },
      { id: "r2", title: "Team", score: 58, summary: "First-time institutional fund for two partners; reference checks pending.", lastSynth: "2026-05-18" },
    ],
    lps: [],
  },
  {
    id: "fund-003",
    name: "Northwind Infra Yield",
    vintage: 2025,
    strategy: "Core+ digital infrastructure",
    targetSize: "$2.5B",
    status: "Closing",
    completion: { dataroom: 100, report: 96, ddq: 92, interview: 100 },
    dataroom: [
      { id: "f1", name: "PPM_final.pdf", category: "Fund docs", version: 6, sizeKb: 5400, uploadedAt: "2026-03-01T09:00:00Z", uploadedBy: "K. Tan" },
      { id: "f2", name: "LPA_final.pdf", category: "Legal", version: 4, sizeKb: 1820, uploadedAt: "2026-03-05T11:00:00Z", uploadedBy: "Counsel" },
      { id: "f3", name: "Asset_level_model.xlsx", category: "Track record", version: 9, sizeKb: 940, uploadedAt: "2026-04-12T15:00:00Z", uploadedBy: "K. Tan" },
      { id: "f4", name: "ESG_report_2025.pdf", category: "Operations", version: 2, sizeKb: 1180, uploadedAt: "2026-04-20T10:00:00Z", uploadedBy: "Sustainability" },
    ],
    ddq: Array.from({ length: 9 }).map((_, i) => ({
      id: `d${i + 1}`,
      question: `Northwind DDQ item ${i + 1}: standard ILPA response on governance, risk, and operations.`,
      answer: i < 8 ? "Documented in the data room. See referenced section." : undefined,
      provenance: (i % 3 === 0 ? "IRIS" : "ILPA") as DdqProvenance,
      state: (i < 8 ? "answered" : "unanswered") as DdqState,
      section: "Operations",
      updatedAt: "2026-04-22",
    })),
    report: [
      { id: "r1", title: "Thesis", score: 90, summary: "Clear differentiation in hyperscaler-adjacent digital infra; contracted cash flows underpin downside.", lastSynth: "2026-04-25" },
      { id: "r2", title: "Market", score: 88, summary: "AI-driven capex super-cycle remains the dominant tailwind; supply of investible assets is the binding constraint.", lastSynth: "2026-04-25" },
      { id: "r3", title: "Team", score: 92, summary: "Best-in-class senior team with prior fund continuity; clear succession plan.", lastSynth: "2026-04-22" },
      { id: "r4", title: "Track record", score: 94, summary: "Fund II realised at 1.9x net DPI; consistent execution across vintages.", lastSynth: "2026-04-25" },
      { id: "r5", title: "Economics", score: 86, summary: "Mgmt fee 1.25%, carry 20% over 8% pref. GP commit 5%.", lastSynth: "2026-04-22" },
    ],
    lps: [
      { id: "lp1", name: "Atlas State Pension", type: "Pension", consent: "shared", lastActivity: "4h ago", questions: 22, ndaSignedAt: "2026-02-10" },
      { id: "lp2", name: "Crown Sovereign", type: "SWF", consent: "shared", lastActivity: "1d ago", questions: 31, ndaSignedAt: "2026-02-12" },
      { id: "lp3", name: "Westbrook Endowment", type: "Endowment", consent: "shared", lastActivity: "6h ago", questions: 14, ndaSignedAt: "2026-02-15" },
      { id: "lp4", name: "Northern Mutual", type: "Insurance", consent: "shared", lastActivity: "2d ago", questions: 18, ndaSignedAt: "2026-02-20" },
      { id: "lp5", name: "Pinecrest Pension", type: "Pension", consent: "shared", lastActivity: "3h ago", questions: 9, ndaSignedAt: "2026-02-22" },
      { id: "lp6", name: "Halcyon Endowment", type: "Endowment", consent: "shared", lastActivity: "1d ago", questions: 11, ndaSignedAt: "2026-02-28" },
      { id: "lp7", name: "Meridian Family Office", type: "Family Office", consent: "pending", lastActivity: "5d ago", questions: 4, ndaSignedAt: "2026-03-08" },
      { id: "lp8", name: "Cascade Insurance Group", type: "Insurance", consent: "shared", lastActivity: "8h ago", questions: 15, ndaSignedAt: "2026-03-12" },
      { id: "lp9", name: "Greycliff Family Office", type: "Family Office", consent: "withdrawn", lastActivity: "12d ago", questions: 2, ndaSignedAt: "2026-03-01" },
    ],
  },
];

export function getRaise(id: string | undefined): Raise | undefined {
  return RAISES.find((r) => r.id === id);
}

export function overallCompletion(r: Raise): number {
  const v = r.completion;
  return Math.round((v.dataroom + v.report + v.ddq + v.interview) / 4);
}

type RaiseDraft = {
  name: string;
  strategy?: string;
  targetSize?: string;
  vintage?: number;
  files: { name: string; sizeKb: number; category: DataroomFile["category"] }[];
  submitter: { name: string; company: string; email: string };
};

const listeners = new Set<() => void>();
export function subscribeRaises(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
function emit() { listeners.forEach((f) => f()); }

export function createRaise(draft: RaiseDraft): Raise {
  const id = `fund-${String(RAISES.length + 1).padStart(3, "0")}`;
  const now = new Date().toISOString();
  const dataroom: DataroomFile[] = draft.files.map((f, i) => ({
    id: `nf${i + 1}`,
    name: f.name,
    category: f.category,
    version: 1,
    sizeKb: f.sizeKb,
    uploadedAt: now,
    uploadedBy: draft.submitter.name || "You",
  }));
  const raise: Raise = {
    id,
    name: draft.name,
    vintage: draft.vintage ?? new Date().getFullYear(),
    strategy: draft.strategy || "Strategy TBD",
    targetSize: draft.targetSize || "TBD",
    status: "In setup",
    completion: {
      dataroom: Math.min(100, draft.files.length * 12),
      report: 0,
      ddq: 0,
      interview: 0,
    },
    dataroom,
    ddq: [],
    report: [],
    lps: [],
  };
  RAISES.push(raise);
  emit();
  return raise;
}

export function deleteRaise(id: string): void {
  const idx = RAISES.findIndex((r) => r.id === id);
  if (idx >= 0) {
    RAISES.splice(idx, 1);
    emit();
  }
}

export function dropLpFromPipeline(raiseId: string, lpId: string): void {
  const r = RAISES.find((x) => x.id === raiseId);
  if (!r) return;
  const lp = r.lps.find((l) => l.id === lpId);
  if (!lp) return;
  lp.consent = "withdrawn";
  lp.stage = "declined";
  emit();
}

export function setLpStage(raiseId: string, lpId: string, stage: PipelineStage): void {
  const r = RAISES.find((x) => x.id === raiseId);
  if (!r) return;
  const lp = r.lps.find((l) => l.id === lpId);
  if (!lp) return;
  lp.stage = stage;
  emit();
}