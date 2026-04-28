import { Shield, Scale, Building2, FileCheck2, ListChecks, AlertOctagon, HelpCircle } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import { HardFloorBanner } from "@/components/project/primitives/HardFloorBanner";
import { TierPill, tierFromScore } from "@/components/project/primitives/VerdictBadges";
import { EmptyChip, ValueOrEmpty } from "@/components/project/primitives/EmptyChip";
import type { Tables } from "@/integrations/supabase/types";

interface RegulatoryOpsTabProps {
  project: Tables<"projects">;
  moduleScoresData: any[];
  submissionQuality: any[];
  serviceProviders: any[];
  interrogatoryItems: Tables<"interrogatory_items">[];
  redFlags: Tables<"red_flags">[];
}

// PRD v2.0 §3.7 — Hard floor gate definitions (mirrors L1 hardfloor schema)
const HARD_FLOOR_GATES = [
  { key: "team_integrity", label: "Team Integrity", description: "No undisclosed adverse personal findings on principals" },
  { key: "entity_legitimacy", label: "Entity Legitimacy", description: "Sponsor entity verified via regulator filings" },
  { key: "track_record_contradiction", label: "Track Record Contradiction", description: "Claimed returns reconcile with public records" },
];

// PRD v2.0 §3.7 — Required service provider categories
const REQUIRED_PROVIDERS = [
  { type: "auditor", label: "Auditor", importance: "critical" },
  { type: "fund_administrator", label: "Fund Administrator", importance: "critical" },
  { type: "legal_counsel", label: "Legal Counsel", importance: "critical" },
  { type: "custodian", label: "Custodian / Prime Broker", importance: "standard" },
  { type: "tax_advisor", label: "Tax Advisor", importance: "standard" },
];

// PRD v2.0 §3.7 — Operational sub-scores
const SUB_SCORES = [
  { key: "registration", label: "Registration & Regulatory", weight: 30 },
  { key: "service_providers", label: "Service Provider Quality", weight: 25 },
  { key: "domicile", label: "Domicile & Structure", weight: 15 },
  { key: "submission_quality", label: "Submission Quality", weight: 15 },
  { key: "compliance", label: "Compliance Posture", weight: 15 },
];

function findGate(submissionQuality: any[], key: string) {
  return submissionQuality.find(
    (sq) =>
      sq.category === key ||
      sq.category === `hard_floor_${key}` ||
      sq.category_label?.toLowerCase().includes(key.replace(/_/g, " ")),
  );
}

function findProvider(providers: any[], type: string) {
  return providers.find(
    (p) => p.provider_type === type || p.provider_type?.toLowerCase().replace(/[\s/]/g, "_").includes(type),
  );
}

const STATUS_TONE: Record<string, string> = {
  pass: "border-score-strong/40 bg-score-strong/10 text-score-strong",
  cleared: "border-score-strong/40 bg-score-strong/10 text-score-strong",
  present: "border-score-strong/40 bg-score-strong/10 text-score-strong",
  warning: "border-severity-elevated/40 bg-severity-elevated/10 text-severity-elevated",
  flagged: "border-severity-elevated/40 bg-severity-elevated/10 text-severity-elevated",
  fail: "border-severity-critical/40 bg-severity-critical/10 text-severity-critical",
  triggered: "border-severity-critical/40 bg-severity-critical/10 text-severity-critical",
};

export function RegulatoryOpsTab({
  project,
  moduleScoresData,
  submissionQuality,
  serviceProviders,
  interrogatoryItems,
  redFlags,
}: RegulatoryOpsTabProps) {
  const moduleScore = moduleScoresData.find(
    (m) => m.module_key?.includes("regulatory") || m.module_key?.includes("operations") || m.module_key?.includes("structural"),
  );
  const score = moduleScore?.score ?? null;
  const tier = tierFromScore(score);

  const hardFloors = submissionQuality.filter(
    (sq: any) => sq.severity === "hard_floor" || sq.category?.includes("hard_floor"),
  );
  const triggered = hardFloors.some((h: any) => h.status === "fail" || h.status === "flagged");
  const triggeredFloor = hardFloors.find((h: any) => h.status === "fail" || h.status === "flagged");

  const opsRedFlags = redFlags.filter((rf) =>
    ["regulatory", "operations", "structural", "compliance", "service_providers"].some((k) =>
      rf.module?.toLowerCase().includes(k) || rf.source_module?.toLowerCase().includes(k),
    ),
  );

  const opsQuestions = interrogatoryItems.filter((q) =>
    ["regulatory", "operations", "structural", "compliance", "service"].some((k) =>
      q.module?.toLowerCase().includes(k) || q.source_module?.toLowerCase().includes(k),
    ),
  );

  // Operational submission quality items (exclude hard floors)
  const opsQuality = submissionQuality.filter(
    (sq: any) => sq.severity !== "hard_floor" && !sq.category?.includes("hard_floor"),
  );

  return (
    <div className="space-y-5">
      {/* Score Header */}
      <BlurFade>
        <SectionCard
          title="Regulatory & Operations"
          subtitle="Hard floors, registration, service providers, and operational integrity"
          icon={<Scale className="h-4 w-4" />}
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold tabular-nums text-foreground">{score ?? "—"}</span>
                <span className="text-base text-muted-foreground">/10</span>
              </div>
              <div className="flex items-center gap-2 mt-2.5">
                <TierPill tier={tier} />
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {moduleScore?.confidence || "Confidence not parsed"}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground sm:text-right max-w-md leading-relaxed">
              {moduleScore?.summary_assessment || "Operational assessment narrative not generated at L1."}
            </p>
          </div>
        </SectionCard>
      </BlurFade>

      {/* Hard floor banner */}
      {triggered && (
        <BlurFade delay={0.02}>
          <HardFloorBanner
            triggered
            floorId={triggeredFloor?.category}
            floorTitle={triggeredFloor?.category_label}
            reason={triggeredFloor?.assessment_detail || triggeredFloor?.evidence_text}
          />
        </BlurFade>
      )}

      {/* Hard Floor Gates */}
      <BlurFade delay={0.04}>
        <SectionCard
          title="Hard Floor Gates"
          subtitle="Three pass/fail gates from the L1 hardfloor schema"
          icon={<Shield className="h-4 w-4" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {HARD_FLOOR_GATES.map((gate) => {
              const data = findGate(submissionQuality, gate.key);
              const status = (data?.status || "").toLowerCase();
              const tone = STATUS_TONE[status] || "border-border bg-card text-muted-foreground";
              return (
                <div key={gate.key} className={`rounded-lg border p-3 ${tone}`}>
                  <p className="text-xs font-semibold text-foreground">{gate.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{gate.description}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider mt-2">
                    {data?.status?.replace(/_/g, " ") || "Pending verification"}
                  </p>
                  {data?.confidence && (
                    <p className="text-[10px] text-muted-foreground mt-1">Confidence: {data.confidence}</p>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>
      </BlurFade>

      {/* Registration & Domicile Strip */}
      <BlurFade delay={0.06}>
        <SectionCard
          title="Registration & Domicile"
          subtitle="Regulatory status and structural domicile"
          icon={<Building2 className="h-4 w-4" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-lg border border-border bg-card px-3.5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Regulatory Status</p>
              <div className="mt-1.5">
                <ValueOrEmpty value={project.regulatory_status} />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card px-3.5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Domicile</p>
              <div className="mt-1.5">
                <ValueOrEmpty value={project.domicile} />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card px-3.5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">GP Entity</p>
              <div className="mt-1.5">
                <ValueOrEmpty value={project.gp_entity_name} />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card px-3.5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Inception</p>
              <div className="mt-1.5">
                <ValueOrEmpty value={project.fund_inception_date} />
              </div>
            </div>
          </div>
        </SectionCard>
      </BlurFade>

      {/* Service Providers Matrix */}
      <BlurFade delay={0.08}>
        <SectionCard
          title="Service Provider Verification"
          subtitle="Required institutional providers — disclosed and verified"
          icon={<FileCheck2 className="h-4 w-4" />}
          empty={serviceProviders.length === 0}
          emptyMessage="No service provider disclosures parsed at L1."
        >
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="font-semibold py-2 pr-3">Type</th>
                  <th className="font-semibold py-2 pr-3">Provider</th>
                  <th className="font-semibold py-2 pr-3">Disclosed</th>
                  <th className="font-semibold py-2 pr-3">Verified</th>
                  <th className="font-semibold py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {REQUIRED_PROVIDERS.map((req) => {
                  const p = findProvider(serviceProviders, req.type);
                  return (
                    <tr key={req.type} className="border-b border-border/40 last:border-0">
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground">{req.label}</span>
                          {req.importance === "critical" && (
                            <span className="text-[9px] uppercase tracking-wider text-severity-elevated">required</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3">
                        {p?.provider_name ? (
                          <span className="text-foreground">{p.provider_name}</span>
                        ) : (
                          <EmptyChip />
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        {p?.is_disclosed ? (
                          <span className="text-score-strong font-medium">Yes</span>
                        ) : (
                          <span className="text-severity-elevated font-medium">No</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        {p?.is_verified === true ? (
                          <span className="text-score-strong font-medium">Verified</span>
                        ) : p?.is_verified === false ? (
                          <span className="text-severity-elevated font-medium">Unverified</span>
                        ) : (
                          <EmptyChip label="PENDING" />
                        )}
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        {p?.verification_detail || p?.notes || <EmptyChip />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </BlurFade>

      {/* Operational Submission Quality */}
      <BlurFade delay={0.1}>
        <SectionCard
          title="Operational Quality Checks"
          subtitle="Non-floor submission quality categories"
          icon={<ListChecks className="h-4 w-4" />}
          empty={opsQuality.length === 0}
          emptyMessage="No operational quality items parsed at L1."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {opsQuality.map((sq: any) => {
              const tone = STATUS_TONE[(sq.status || "").toLowerCase()] || "border-border bg-card";
              return (
                <div key={sq.id} className={`rounded-md border p-2.5 ${tone}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground truncate">{sq.category_label || sq.category}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider shrink-0">
                      {sq.status?.replace(/_/g, " ") || "—"}
                    </span>
                  </div>
                  {sq.severity && sq.severity !== "none" && (
                    <p className="text-[10px] text-muted-foreground mt-1">Severity: {sq.severity}</p>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>
      </BlurFade>

      {/* Sub-Score Breakdown */}
      <BlurFade delay={0.12}>
        <SectionCard
          title="Sub-Score Breakdown"
          subtitle="Weighted contributors to the Regulatory & Operations score"
          icon={<ListChecks className="h-4 w-4" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {SUB_SCORES.map((s) => (
              <div key={s.key} className="rounded-md border border-border bg-card px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <EmptyChip />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Weight: {s.weight}%</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] italic text-muted-foreground mt-3">
            Sub-score decomposition will populate once Phase 7.3 operational scoring lands.
          </p>
        </SectionCard>
      </BlurFade>

      {/* Operations Red Flags */}
      {opsRedFlags.length > 0 && (
        <BlurFade delay={0.14}>
          <SectionCard
            title="Operational Red Flags"
            subtitle="Filtered from the global red-flag inventory"
            icon={<AlertOctagon className="h-4 w-4" />}
          >
            <ul className="space-y-2">
              {opsRedFlags.slice(0, 6).map((rf) => (
                <li
                  key={rf.id}
                  className="rounded-md border border-border bg-card px-3 py-2 flex items-start gap-2.5"
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider shrink-0 mt-0.5 ${
                      rf.severity === "critical"
                        ? "text-severity-critical"
                        : rf.severity === "elevated"
                          ? "text-severity-elevated"
                          : "text-muted-foreground"
                    }`}
                  >
                    {rf.severity}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">{rf.title}</p>
                    {rf.implication && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{rf.implication}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </BlurFade>
      )}

      {/* Diligence Questions */}
      <BlurFade delay={0.16}>
        <SectionCard
          title="Operational Diligence Questions"
          subtitle="Operations-scoped follow-ups for the GP"
          icon={<HelpCircle className="h-4 w-4" />}
          empty={opsQuestions.length === 0}
          emptyMessage="No operations-scoped questions generated at L1."
        >
          <ul className="space-y-2">
            {opsQuestions.slice(0, 5).map((q) => (
              <li key={q.id} className="rounded-md border border-border bg-card px-3 py-2">
                <div className="flex items-start gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider shrink-0 mt-0.5 ${
                      q.priority === "critical"
                        ? "text-severity-critical"
                        : q.priority === "high"
                          ? "text-severity-elevated"
                          : "text-muted-foreground"
                    }`}
                  >
                    {q.priority}
                  </span>
                  <p className="text-xs text-foreground leading-relaxed">{q.question}</p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </BlurFade>
    </div>
  );
}