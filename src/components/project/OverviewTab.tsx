import { FileText, Building2, Layers, Link2, Sparkles } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import { KpiTile } from "@/components/project/primitives/KpiTile";
import { FieldValueGrid } from "@/components/project/primitives/FieldValueGrid";
import { TierPill, RecommendationBadge, recommendationFromScore, tierFromScore } from "@/components/project/primitives/VerdictBadges";
import { HardFloorBanner } from "@/components/project/primitives/HardFloorBanner";
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
  documents,
  submissionQuality = [],
}: OverviewTabProps) {
  const composite = project.composite_score ?? null;
  const tier = tierFromScore(composite);
  const rec = recommendationFromScore(composite);
  const criticalCount = redFlags.filter((f) => f.severity === "critical").length;
  const completeness = (project.completeness_score ?? null) as number | null;

  const hardFloors = submissionQuality.filter((sq: any) =>
    sq.severity === "hard_floor" || sq.category?.includes("hard_floor"),
  );
  const hardFloorTriggered = hardFloors.some((h: any) => h.status === "fail" || h.status === "flagged");

  const abstract = (project as any).executive_summary_narrative as string | null;

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

  return (
    <div className="space-y-5">
      <HardFloorBanner triggered={hardFloorTriggered} reason="One or more hard-floor gates failed during L1 triage." />

      {/* Hero card */}
      <BlurFade>
        <SectionCard
          title="Hero — Verdict Snapshot"
          subtitle="Composite score, recommendation, and tier."
          icon={<Sparkles className="h-4 w-4" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-center">
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold tabular-nums text-foreground">
                  {composite ?? "—"}
                </span>
                <span className="text-base text-muted-foreground">/100</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <RecommendationBadge recommendation={rec} />
                <TierPill tier={tier} />
              </div>
            </div>
            <div className="space-y-2 min-w-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-xs">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sponsor</p>
                  <p className="text-foreground font-medium truncate">{(project as any).gp_entity_name || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Strategy</p>
                  <p className="text-foreground font-medium truncate">{project.asset_class || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Vintage</p>
                  <p className="text-foreground font-medium truncate">{project.vintage || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Target Size</p>
                  <p className="text-foreground font-medium truncate">{(project as any).fund_size_estimated || "—"}</p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </BlurFade>

      {/* Abstract */}
      <BlurFade delay={0.04}>
        <SectionCard
          title="Abstract"
          subtitle="Executive narrative · Section 1"
          icon={<FileText className="h-4 w-4" />}
          empty={!abstract}
          emptyMessage="Abstract not generated at L1."
        >
          {abstract && <p className="text-sm leading-relaxed text-foreground/85">{abstract}</p>}
        </SectionCard>
      </BlurFade>

      {/* Findings Overview KPI strip */}
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
            <KpiTile label="Completeness" value={completeness != null ? `${completeness}%` : null} />
          </div>
        </SectionCard>
      </BlurFade>

      {/* Fund snapshot grid */}
      <BlurFade delay={0.08}>
        <SectionCard
          title="Fund Snapshot"
          subtitle="14-row field/value table sourced from fund_overview"
          icon={<Building2 className="h-4 w-4" />}
        >
          <FieldValueGrid rows={fundSnapshotRows} columns={2} />
        </SectionCard>
      </BlurFade>

      {/* Source materials */}
      <BlurFade delay={0.1}>
        <SectionCard
          title="Source Materials"
          subtitle="Documents fed into this report"
          icon={<FileText className="h-4 w-4" />}
          empty={documents.length === 0}
          emptyMessage="No source materials uploaded."
        >
          {documents.length > 0 && (
            <ul className="divide-y divide-border/40">
              {documents.map((d) => (
                <li key={d.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium text-foreground truncate">{d.file_name}</span>
                  <span className="text-muted-foreground shrink-0">
                    {d.page_count ? `${d.page_count}p` : "—"} · {d.document_type_classified || "doc"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </BlurFade>

      {/* Cross-reference */}
      <BlurFade delay={0.12}>
        <SectionCard
          title="Cross-reference — Related Prior Report"
          subtitle="Carry-forward inheritance"
          icon={<Link2 className="h-4 w-4" />}
          empty={true}
          emptyMessage="No related prior report linked at L1."
        />
      </BlurFade>
    </div>
  );
}
