import { Building2, Layers, Sparkles, ClipboardList, ListChecks, AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import { KpiTile } from "@/components/project/primitives/KpiTile";
import { FieldValueGrid } from "@/components/project/primitives/FieldValueGrid";
import { TierPill, RecommendationBadge, recommendationFromScore, tierFromScore } from "@/components/project/primitives/VerdictBadges";
import { HardFloorBanner } from "@/components/project/primitives/HardFloorBanner";
import { getSectionTier, SCORE_TIER_LABELS, type ScoreTier } from "@/lib/score-utils";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

interface OverviewTabProps {
  project: Tables<"projects">;
  redFlags: Tables<"red_flags">[];
  reportSections: Tables<"report_sections">[];
  documents: Tables<"documents">[];
  moduleScoresData?: any[];
  submissionQuality?: any[];
  docQualityFlags?: any[];
  criticalInfoGaps?: any[];
  onRerunAnalysis: () => void;
  reportMarkdown?: string | null;
}

export function OverviewTab({
  project,
  redFlags,
  moduleScoresData = [],
  submissionQuality = [],
  criticalInfoGaps = [],
}: OverviewTabProps) {
  const composite = project.composite_score ?? null;
  const tier = tierFromScore(composite);
  const rec = recommendationFromScore(composite);
  const criticalCount = redFlags.filter((f) => f.severity === "critical").length;
  const completenessPct =
    (project as any).completeness_pct ??
    project.completeness_score ??
    null;
  const confidenceTier =
    (project as any).confidence_tier ??
    deriveConfidenceTier(completenessPct);
  const confidenceReason = (project as any).confidence_reason ?? null;

  const hardFloors = submissionQuality.filter((sq: any) =>
    sq.severity === "hard_floor" || sq.category?.includes("hard_floor"),
  );
  const hardFloorTriggered = hardFloors.some((h: any) => h.status === "fail" || h.status === "flagged");

  // Executive summary inputs (Phase 3.1 §Exec Summary card)
  const verdictLine =
    (project as any).final_assessment_narrative ||
    (project as any).executive_summary_narrative ||
    null;
  const keyStrengths = ((project as any).key_strengths as any[] | null) || [];
  const keyRisks = ((project as any).key_risks as any[] | null) || [];
  const top3Strengths = keyStrengths.slice(0, 3);
  const top3Risks = keyRisks.slice(0, 3);
  const dataGaps = (criticalInfoGaps || []).slice(0, 3);

  // Fund snapshot — full 6-group restructure ships in Phase 3.10. Keep flat list for now.
  const fundSnapshotRows = [
    { label: "Fund Name", value: project.fund_name },
    { label: "GP Entity", value: (project as any).gp_entity_name },
    { label: "Asset Class", value: project.asset_class },
    { label: "Strategy", value: project.strategy },
    { label: "Vintage", value: project.vintage },
    { label: "Inception", value: (project as any).fund_inception_date },
    { label: "Domicile", value: (project as any).domicile },
    { label: "Regulatory Status", value: (project as any).regulatory_status },
    { label: "Fund Size (target)", value: (project as any).fund_size_estimated },
    { label: "Document Type", value: project.document_type },
    { label: "Established", value: (project as any).established_year },
    { label: "Submitter", value: (project as any).submitter_name },
    { label: "Submitter Org", value: (project as any).submitter_company },
    { label: "Analysis Date", value: (project as any).analysis_date },
  ];

  // PRD §3.1 — All Scores Summary table (5 dimensions + Reg & Ops separate)
  const dimensionScores = buildDimensionScores(moduleScoresData);

  return (
    <div className="space-y-5">
      {/* 1. HERO — Composite + tier + Recommendation + Confidence */}
      <BlurFade>
        <SectionCard
          title="Verdict Snapshot"
          subtitle="Composite score · Recommendation · Confidence"
          icon={<Sparkles className="h-4 w-4" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Composite + tier */}
            <div className="flex flex-col items-start gap-2 md:border-r md:border-border/60 md:pr-6">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Composite Score</p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold tabular-nums text-foreground">
                  {composite ?? "—"}
                </span>
                <span className="text-base text-muted-foreground">/100</span>
              </div>
              <TierPill tier={tier} />
            </div>

            {/* Recommendation */}
            <div className="flex flex-col items-start gap-2 md:border-r md:border-border/60 md:pr-6">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Recommendation</p>
              <RecommendationBadge recommendation={rec} className="text-sm px-3 py-1" />
              {hardFloorTriggered && (
                <p className="text-[10px] text-severity-critical font-medium">Forced by hard floor</p>
              )}
            </div>

            {/* Confidence */}
            <div className="flex flex-col items-start gap-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tabular-nums text-foreground">
                  {completenessPct != null ? `${completenessPct}` : "—"}
                </span>
                <span className="text-xs text-muted-foreground">% complete</span>
              </div>
              <ConfidencePill tier={confidenceTier} />
              {confidenceReason && (
                <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">{confidenceReason}</p>
              )}
            </div>
          </div>
        </SectionCard>
      </BlurFade>

      {/* 2. HARD FLOOR BANNER (conditional) */}
      {hardFloorTriggered && (
        <BlurFade delay={0.02}>
          <HardFloorBanner triggered reason="One or more hard-floor gates failed during L1 triage." />
        </BlurFade>
      )}

      {/* 3. FINDINGS tiles */}
      <BlurFade delay={0.06}>
        <SectionCard
          title="Findings Overview"
          subtitle="At-a-glance verdict signals"
          icon={<Layers className="h-4 w-4" />}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KpiTile label="Composite" value={composite != null ? `${composite}/100` : null} />
            <KpiTile
              label="Recommendation"
              value={rec ?? null}
              tone={
                rec === "ADVANCE"
                  ? "good"
                  : rec === "DECLINE"
                    ? "bad"
                    : "warn"
              }
            />
            <KpiTile label="Hard Floor" value={hardFloorTriggered ? "TRIGGERED" : "Pass"} tone={hardFloorTriggered ? "bad" : "good"} />
            <KpiTile label="Critical Flags" value={criticalCount} tone={criticalCount > 0 ? "bad" : "good"} />
            <KpiTile label="Completeness" value={completenessPct != null ? `${completenessPct}%` : null} />
          </div>
        </SectionCard>
      </BlurFade>

      {/* 4. EXECUTIVE SUMMARY card — verdict line + Top 3 strengths + Top 3 risks + data gaps */}
      <BlurFade delay={0.08}>
        <SectionCard
          title="Executive Summary"
          subtitle="One-line verdict, top strengths, top risks, data gaps"
          icon={<ClipboardList className="h-4 w-4" />}
        >
          <div className="space-y-4">
            {/* Verdict line */}
            <div className="rounded-md border border-border/50 bg-muted/30 p-3">
              {verdictLine ? (
                <p className="text-sm leading-relaxed text-foreground/90">{verdictLine}</p>
              ) : (
                <p className="text-xs italic text-muted-foreground">Verdict line not yet synthesized at L1.</p>
              )}
            </div>

            {/* 3-column: Strengths · Risks · Data Gaps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SummaryColumn
                title="Top Strengths"
                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                tone="good"
                items={top3Strengths.map(itemToText)}
                emptyMessage="No strengths captured."
              />
              <SummaryColumn
                title="Top Risks"
                icon={<AlertTriangle className="h-3.5 w-3.5" />}
                tone="bad"
                items={top3Risks.map(itemToText)}
                emptyMessage="No material risks captured."
              />
              <SummaryColumn
                title="Data Gaps"
                icon={<HelpCircle className="h-3.5 w-3.5" />}
                tone="warn"
                items={dataGaps.map((g: any) => g.gap_title || g.gap_description || "Gap")}
                emptyMessage="No critical data gaps."
              />
            </div>
          </div>
        </SectionCard>
      </BlurFade>

      {/* 5. FUND SNAPSHOT — flat list today; PRD §3.10 will regroup into 6 sections */}
      <BlurFade delay={0.1}>
        <SectionCard
          title="Fund Snapshot"
          subtitle="Identity · Scale · Strategy · Economics · Lifecycle · Portfolio (Phase 3.10 will regroup)"
          icon={<Building2 className="h-4 w-4" />}
        >
          <FieldValueGrid rows={fundSnapshotRows} columns={2} />
        </SectionCard>
      </BlurFade>

      {/* 6. ALL SCORES SUMMARY table */}
      <BlurFade delay={0.12}>
        <SectionCard
          title="All Scores Summary"
          subtitle="5-dimension rubric · Reg & Ops emits Pass/Conditional/Fail (excluded from composite)"
          icon={<ListChecks className="h-4 w-4" />}
          empty={dimensionScores.length === 0}
          emptyMessage="Dimension scores not yet populated."
        >
          {dimensionScores.length > 0 && <ScoresSummaryTable rows={dimensionScores} />}
        </SectionCard>
      </BlurFade>
    </div>
  );
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */

function deriveConfidenceTier(pct: number | null | undefined): "High" | "Medium" | "Low" | "Very Low" | null {
  if (pct == null) return null;
  if (pct >= 70) return "High";
  if (pct >= 50) return "Medium";
  if (pct >= 30) return "Low";
  return "Very Low";
}

function ConfidencePill({ tier }: { tier: "High" | "Medium" | "Low" | "Very Low" | null }) {
  if (!tier) {
    return (
      <span className="inline-flex items-center rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Confidence —
      </span>
    );
  }
  const styles = {
    High: "border-score-strong/40 text-score-strong bg-score-strong/10",
    Medium: "border-score-advance/40 text-score-advance bg-score-advance/10",
    Low: "border-score-review/40 text-score-review bg-score-review/10",
    "Very Low": "border-severity-critical/40 text-severity-critical bg-severity-critical/10",
  } as const;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", styles[tier])}>
      {tier}
    </span>
  );
}

function itemToText(it: any): string {
  if (!it) return "";
  if (typeof it === "string") return it;
  return it.title || it.description || it.text || it.label || JSON.stringify(it);
}

function SummaryColumn({
  title,
  icon,
  tone,
  items,
  emptyMessage,
}: {
  title: string;
  icon: React.ReactNode;
  tone: "good" | "bad" | "warn";
  items: string[];
  emptyMessage: string;
}) {
  const toneClass =
    tone === "good" ? "text-score-strong" : tone === "bad" ? "text-severity-critical" : "text-score-review";
  return (
    <div className="rounded-md border border-border/50 bg-card p-3">
      <div className={cn("flex items-center gap-1.5 mb-2 text-[11px] font-semibold uppercase tracking-wider", toneClass)}>
        {icon}
        <span>{title}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs italic text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ol className="space-y-1.5 text-xs text-foreground/85">
          {items.map((t, i) => (
            <li key={i} className="flex gap-2 leading-snug">
              <span className="text-muted-foreground tabular-nums">{i + 1}.</span>
              <span className="min-w-0">{t}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ─── All-Scores summary table ─────────────────────────────────────────── */

type DimensionRow = {
  key: string;
  label: string;
  weight: number;
  score10: number | null;
  tier: ScoreTier;
};

const PRD_DIMENSIONS: { key: string; label: string; weight: number; aliases: string[] }[] = [
  { key: "thesis", label: "Investment Thesis", weight: 15, aliases: ["thesis", "module_c", "strategy"] },
  { key: "market", label: "Market Reality", weight: 20, aliases: ["market", "module_d", "domain"] },
  { key: "team", label: "Team & Manager", weight: 25, aliases: ["team", "module_b", "manager"] },
  { key: "track_record", label: "Track Record", weight: 20, aliases: ["track", "performance", "module_a", "financial"] },
  { key: "economics", label: "Economics", weight: 20, aliases: ["terms", "economics", "fee", "module_d_terms"] },
];

function buildDimensionScores(modules: any[]): DimensionRow[] {
  if (!modules?.length) return [];
  return PRD_DIMENSIONS.map((d) => {
    const m = modules.find((row) =>
      d.aliases.some(
        (a) =>
          row.module_key?.toLowerCase().includes(a) ||
          row.module_label?.toLowerCase().includes(a),
      ),
    );
    const raw = m?.score ?? null;
    const score10 = raw == null ? null : raw > 10 ? Math.round((raw / 10) * 10) / 10 : raw;
    return {
      key: d.key,
      label: d.label,
      weight: d.weight,
      score10,
      tier: getSectionTier(score10),
    };
  });
}

function ScoresSummaryTable({ rows }: { rows: DimensionRow[] }) {
  const tierClass = (t: ScoreTier) => {
    switch (t) {
      case "exceptional":
      case "strong": return "text-score-strong";
      case "adequate": return "text-score-advance";
      case "below_average": return "text-score-review";
      case "concerning": return "text-severity-critical";
      case "insufficient_data": return "text-muted-foreground";
    }
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/60 text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="text-left font-semibold py-2">Dimension</th>
            <th className="text-right font-semibold py-2 w-20">Weight</th>
            <th className="text-right font-semibold py-2 w-20">Score</th>
            <th className="text-right font-semibold py-2 w-32">Tier</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-border/30 last:border-0">
              <td className="py-2 text-foreground font-medium">{r.label}</td>
              <td className="py-2 text-right tabular-nums text-muted-foreground">{r.weight}%</td>
              <td className="py-2 text-right tabular-nums font-semibold text-foreground">
                {r.score10 != null ? r.score10.toFixed(1) : "─"}
              </td>
              <td className={cn("py-2 text-right font-semibold uppercase tracking-wider text-[10px]", tierClass(r.tier))}>
                {SCORE_TIER_LABELS[r.tier]}
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-border bg-muted/20">
            <td className="py-2 text-[10px] uppercase tracking-wider text-muted-foreground" colSpan={4}>
              Regulatory & Operational Hygiene emits Pass / Conditional / Fail — see Reg & Ops tab.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
