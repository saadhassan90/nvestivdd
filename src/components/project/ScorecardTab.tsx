import { useState } from "react";
import { Gauge, Shield, ListChecks, ClipboardList, BookOpen, ChevronDown } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import { TierPill, RecommendationBadge, recommendationFromScore, tierFromScore, BandBadge, bandFromScore } from "@/components/project/primitives/VerdictBadges";
import { HardFloorBanner } from "@/components/project/primitives/HardFloorBanner";
import { EmptyChip } from "@/components/project/primitives/EmptyChip";
import type { Tables } from "@/integrations/supabase/types";

interface ScorecardTabProps {
  project: Tables<"projects">;
  moduleScores: any[];
  submissionQuality?: any[];
}

const HARD_FLOOR_GATES = [
  { key: "team_integrity", label: "Team Integrity", description: "No undisclosed adverse personal findings" },
  { key: "entity_legitimacy", label: "Entity Legitimacy", description: "Sponsor entity verified via regulator filings" },
  { key: "track_record_contradiction", label: "Track Record Contradiction", description: "Claimed returns reconcile with public records" },
];

const FIVE_DIMENSIONS = [
  { key: "team", label: "Manager & Team", max: 25 },
  { key: "track_record", label: "Track Record", max: 25 },
  { key: "strategy", label: "Strategy", max: 20 },
  { key: "domain", label: "Domain", max: 20 },
  { key: "structural", label: "Structural", max: 10 },
];

function findGate(submissionQuality: any[], key: string) {
  return submissionQuality.find(
    (sq) => sq.category === key || sq.category === `hard_floor_${key}` || sq.category_label?.toLowerCase().includes(key.replace(/_/g, " ")),
  );
}

function findDimension(modules: any[], key: string) {
  return modules.find((m) => m.module_key?.toLowerCase().includes(key) || m.module_label?.toLowerCase().includes(key.replace(/_/g, " ")));
}

export function ScorecardTab({ project, moduleScores, submissionQuality = [] }: ScorecardTabProps) {
  const composite = project.composite_score ?? null;
  const tier = tierFromScore(composite);
  const rec = recommendationFromScore(composite);

  const hardFloors = submissionQuality.filter((sq: any) =>
    sq.severity === "hard_floor" || sq.category?.includes("hard_floor"),
  );
  const triggered = hardFloors.some((h: any) => h.status === "fail" || h.status === "flagged");

  return (
    <div className="space-y-5">
      <HardFloorBanner triggered={triggered} />

      {/* Composite Hero */}
      <BlurFade>
        <SectionCard
          title="Composite Score"
          subtitle="Tier, recommendation, and hard-floor gate status"
          icon={<Gauge className="h-4 w-4" />}
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-bold tabular-nums text-foreground">{composite ?? "—"}</span>
                <span className="text-xl text-muted-foreground">/100</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <TierPill tier={tier} />
                <RecommendationBadge recommendation={rec} />
              </div>
            </div>
            <div className="text-xs text-muted-foreground sm:text-right">
              <p>4-tier UI scale drives band colors.</p>
              <p>3-tier scale drives recommendation badge.</p>
            </div>
          </div>
        </SectionCard>
      </BlurFade>

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
              const passed = ["pass", "cleared", "present"].includes(status);
              const failed = ["fail", "flagged", "triggered"].includes(status);
              return (
                <div
                  key={gate.key}
                  className={`rounded-lg border p-3 ${
                    failed
                      ? "border-severity-critical/40 bg-severity-critical/5"
                      : passed
                        ? "border-score-strong/30 bg-score-strong/5"
                        : "border-border bg-card"
                  }`}
                >
                  <p className="text-xs font-semibold text-foreground">{gate.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{gate.description}</p>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-wider mt-2 ${
                      failed ? "text-severity-critical" : passed ? "text-score-strong" : "text-muted-foreground"
                    }`}
                  >
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

      {/* 5-Dimension Rubric Grid */}
      <BlurFade delay={0.06}>
        <SectionCard
          title="5-Dimension Rubric"
          subtitle="Manager & Team · Track Record · Strategy · Domain · Structural"
          icon={<ListChecks className="h-4 w-4" />}
        >
          <div className="space-y-1.5">
            {FIVE_DIMENSIONS.map((dim, idx) => {
              const data = findDimension(moduleScores, dim.key);
              return <RubricRow key={dim.key} dim={dim} data={data} defaultOpen={idx === 0} />;
            })}
          </div>

          {/* Composite row */}
          <div className="mt-3 rounded-md border border-border bg-muted/30 px-3 py-2.5 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">Composite</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold tabular-nums text-foreground">{composite ?? "—"}/100</span>
              <TierPill tier={tier} />
            </div>
          </div>
        </SectionCard>
      </BlurFade>

      {/* Verdict & Recommendation */}
      <BlurFade delay={0.08}>
        <SectionCard
          title="Verdict & Recommendation"
          subtitle="Section 2 rationale"
          icon={<ClipboardList className="h-4 w-4" />}
          empty={!project.final_assessment_narrative && !project.executive_summary_narrative}
          emptyMessage="Verdict rationale not generated at L1."
        >
          {(project.final_assessment_narrative || project.executive_summary_narrative) && (
            <div className="text-sm text-foreground/85 leading-relaxed space-y-3">
              {project.executive_summary_narrative && <p>{project.executive_summary_narrative}</p>}
              {project.final_assessment_narrative && <p>{project.final_assessment_narrative}</p>}
            </div>
          )}
        </SectionCard>
      </BlurFade>

      {/* Meeting Conditions Panel — only meaningful for CONDITIONAL MEET */}
      <BlurFade delay={0.1}>
        <SectionCard
          title="Meeting Conditions"
          subtitle={rec === "CONDITIONAL MEET" ? "Conditions to satisfy before first meeting" : "Only rendered for CONDITIONAL MEET verdicts"}
          icon={<ClipboardList className="h-4 w-4" />}
          empty={rec !== "CONDITIONAL MEET" || !project.conditions_for_advancement}
          emptyMessage={rec === "CONDITIONAL MEET" ? "No meeting conditions parsed at L1." : "Recommendation is not CONDITIONAL MEET — section reserved."}
        >
          {rec === "CONDITIONAL MEET" && project.conditions_for_advancement && (
            <ul className="space-y-2">
              {(project.conditions_for_advancement as string[]).map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <input type="checkbox" className="mt-1 shrink-0" />
                  <span className="text-foreground">{c}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </BlurFade>

      {/* Score Tier Thresholds Legend */}
      <BlurFade delay={0.12}>
        <SectionCard
          title="Score Tier Thresholds"
          subtitle="Dual canonical scales"
          icon={<BookOpen className="h-4 w-4" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">UI Tier (4-step)</p>
              <ul className="space-y-1.5 text-xs">
                <li className="flex items-center gap-2"><TierPill tier="Strong Advance" /><span className="text-muted-foreground">85–100</span></li>
                <li className="flex items-center gap-2"><TierPill tier="Advance" /><span className="text-muted-foreground">70–84</span></li>
                <li className="flex items-center gap-2"><TierPill tier="Review" /><span className="text-muted-foreground">50–69</span></li>
                <li className="flex items-center gap-2"><TierPill tier="Decline" /><span className="text-muted-foreground">0–49</span></li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Recommendation (3-step)</p>
              <ul className="space-y-1.5 text-xs">
                <li className="flex items-center gap-2"><RecommendationBadge recommendation="MEET" /><span className="text-muted-foreground">≥65</span></li>
                <li className="flex items-center gap-2"><RecommendationBadge recommendation="CONDITIONAL MEET" /><span className="text-muted-foreground">50–64</span></li>
                <li className="flex items-center gap-2"><RecommendationBadge recommendation="NO MEET" /><span className="text-muted-foreground">&lt;50</span></li>
              </ul>
            </div>
          </div>
        </SectionCard>
      </BlurFade>
    </div>
  );
}

function RubricRow({ dim, data, defaultOpen }: { dim: { key: string; label: string; max: number }; data: any; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const score = data?.score ?? null;
  const pct = score != null ? Math.min(1, score / 100) : 0;
  const band = score != null ? bandFromScore(pct) : null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <CollapsibleTrigger className="w-full px-3 py-2 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left">
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} />
          <span className="text-xs font-semibold text-foreground w-44 truncate">{dim.label}</span>
          <div className="flex-1 min-w-0">
            <Progress value={score ?? 0} className="h-1.5" />
          </div>
          <span className="text-xs tabular-nums text-foreground shrink-0 w-12 text-right">
            {score != null ? `${score}` : "—"}
          </span>
          <BandBadge band={band} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 py-2.5 border-t border-border/60 bg-muted/20 space-y-2">
            {data?.summary_assessment ? (
              <p className="text-xs text-foreground/85 leading-relaxed">{data.summary_assessment}</p>
            ) : (
              <p className="text-xs italic text-muted-foreground">Sub-factor detail not parsed at L1.</p>
            )}
            {data?.confidence_rationale && (
              <p className="text-[11px] text-muted-foreground italic leading-relaxed">{data.confidence_rationale}</p>
            )}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence:</span>
              {data?.confidence ? (
                <span className="text-[11px] font-medium text-foreground">{data.confidence}</span>
              ) : (
                <EmptyChip />
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
