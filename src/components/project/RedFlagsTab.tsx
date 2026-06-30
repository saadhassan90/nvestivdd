import { useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { Shield, AlertOctagon, AlertTriangle, Eye, Layers, Scale, Gavel, Link2, ArrowUpRight } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import { KpiTile } from "@/components/project/primitives/KpiTile";
import { FlagLane } from "@/components/project/primitives/FlagLane";
import { HardFloorBanner } from "@/components/project/primitives/HardFloorBanner";
import { EmptyChip } from "@/components/project/primitives/EmptyChip";
import type { Tables } from "@/integrations/supabase/types";

interface RedFlagsTabProps {
  redFlags: Tables<"red_flags">[];
  reportMarkdown?: string | null;
  moduleScore?: number | null;
  fundName?: string;
  submissionQuality?: Tables<"submission_quality">[];
  criticalInfoGaps?: Tables<"critical_info_gaps">[];
}

// PRD v2.0 §3.8 — categories aligned to new tab taxonomy (§2.1)
const CATEGORIES = [
  "all",
  "team",
  "track_record",
  "investment_thesis",
  "market_reality",
  "economics",
  "regulatory_ops",
] as const;
type Cat = typeof CATEGORIES[number];

const CAT_LABEL: Record<Cat, string> = {
  all: "All",
  team: "Team",
  track_record: "Track Record",
  investment_thesis: "Investment Thesis",
  market_reality: "Macro Context",
  economics: "Economics",
  regulatory_ops: "Reg & Ops",
};

function categoryOf(flag: Tables<"red_flags">): Cat {
  const m = (flag.module || flag.source_module || "").toLowerCase();
  if (m.includes("team") || m.includes("manager")) return "team";
  if (m.includes("track") || m.includes("performance") || m.includes("financial")) return "track_record";
  if (m.includes("thesis") || m.includes("strateg")) return "investment_thesis";
  if (m.includes("market") || m.includes("domain") || m.includes("competit")) return "market_reality";
  if (m.includes("fee") || m.includes("econ") || m.includes("alignment") || m.includes("term")) return "economics";
  if (m.includes("regul") || m.includes("operation") || m.includes("structur") || m.includes("compliance") || m.includes("service"))
    return "regulatory_ops";
  return "all";
}

const CAT_TAB_SLUG: Record<Exclude<Cat, "all">, string> = {
  team: "team",
  track_record: "track_record",
  investment_thesis: "investment_thesis",
  market_reality: "market_reality",
  economics: "economics",
  regulatory_ops: "regulatory_ops",
};

export function RedFlagsTab({ redFlags, submissionQuality = [], criticalInfoGaps = [] }: RedFlagsTabProps) {
  const [cat, setCat] = useState<Cat>("all");
  const { id: projectId } = useParams<{ id: string }>();

  const filtered = cat === "all" ? redFlags : redFlags.filter((f) => categoryOf(f) === cat);

  const critical = filtered.filter((f) => f.severity === "critical");
  const elevated = filtered.filter((f) => f.severity === "elevated");
  const monitor = filtered.filter((f) => f.severity === "monitor");

  const hardFloors = submissionQuality.filter((sq) => sq.severity === "hard_floor" || sq.category?.includes("hard_floor"));
  const triggered = hardFloors.some((h) => h.status === "fail" || h.status === "flagged");

  return (
    <div className="space-y-5">
      <HardFloorBanner triggered={triggered} />

      {/* Severity Summary Strip */}
      <BlurFade>
        <SectionCard
          title="Severity Summary"
          subtitle="Critical · Elevated · Monitor — totals are global (unaffected by category filter)"
          icon={<Shield className="h-4 w-4" />}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiTile label="Critical" value={redFlags.filter((f) => f.severity === "critical").length} tone="bad" />
            <KpiTile label="Elevated" value={redFlags.filter((f) => f.severity === "elevated").length} tone="warn" />
            <KpiTile label="Monitor" value={redFlags.filter((f) => f.severity === "monitor").length} />
            <KpiTile label="Inherited" value={null} subValue="Carry-forward (Phase 8)" />
          </div>
        </SectionCard>
      </BlurFade>

      {/* Category sub-tabs — aligned to PRD v2.0 §2.1 tab taxonomy */}
      <BlurFade delay={0.04}>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => {
            const count = c === "all" ? redFlags.length : redFlags.filter((f) => categoryOf(f) === c).length;
            return (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors flex items-center gap-1.5 ${
                  cat === c
                    ? "bg-foreground text-background"
                    : "border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{CAT_LABEL[c]}</span>
                <span className={`text-[10px] tabular-nums ${cat === c ? "opacity-70" : "opacity-60"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </BlurFade>

      {/* Critical Cards — full PRD §3.8 layout with origin-tab cross-link */}
      <BlurFade delay={0.06}>
        <SectionCard
          title="CRITICAL Flags"
          subtitle="Issue · Implication · Resolution · Origin tab"
          icon={<AlertOctagon className="h-4 w-4" />}
        >
          {critical.length === 0 ? (
            <p className="text-xs italic text-muted-foreground">All clear — no critical flags in this category.</p>
          ) : (
            <div className="space-y-2.5">
              {critical.map((f, i) => {
                const flagCat = categoryOf(f);
                const tabSlug = flagCat !== "all" ? CAT_TAB_SLUG[flagCat] : null;
                return (
                  <div
                    key={f.id}
                    id={`flag-${f.flag_number ?? i}`}
                    className="rounded-lg border border-severity-critical/40 border-l-4 border-l-severity-critical bg-severity-critical/5 p-3"
                  >
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono font-semibold text-severity-critical">
                        CRIT-{f.flag_number ?? i + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        {f.timeline && (
                          <span className="text-[10px] text-muted-foreground">
                            {f.timeline.replace(/_/g, " ")}
                          </span>
                        )}
                        {tabSlug && projectId && (
                          <RouterLink
                            to={`/project/${projectId}?tab=${tabSlug}`}
                            className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {CAT_LABEL[flagCat]} <ArrowUpRight className="h-2.5 w-2.5" />
                          </RouterLink>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{f.title}</p>
                    {f.issue && (
                      <p className="text-xs text-foreground/80 mt-1.5 leading-relaxed">
                        <span className="font-semibold text-[10px]">Issue: </span>
                        {f.issue}
                      </p>
                    )}
                    {f.implication && (
                      <p className="text-xs text-foreground/80 mt-1 leading-relaxed">
                        <span className="font-semibold text-[10px]">Implication: </span>
                        {f.implication}
                      </p>
                    )}
                    {f.resolution && (
                      <p className="text-xs text-foreground/80 mt-1 leading-relaxed">
                        <span className="font-semibold text-[10px]">Resolution: </span>
                        {f.resolution}
                      </p>
                    )}
                    {(f.interrogatory_question || f.data_room_action) && (
                      <div className="mt-2 pt-2 border-t border-severity-critical/20 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                        {f.interrogatory_question && projectId && (
                          <RouterLink
                            to={`/project/${projectId}?tab=interrogatory`}
                            className="inline-flex items-center gap-1 hover:text-foreground"
                          >
                            <Link2 className="h-2.5 w-2.5" /> Linked question
                          </RouterLink>
                        )}
                        {f.data_room_action && projectId && (
                          <RouterLink
                            to={`/project/${projectId}?tab=data_room`}
                            className="inline-flex items-center gap-1 hover:text-foreground"
                          >
                            <Link2 className="h-2.5 w-2.5" /> Linked data-room ask
                          </RouterLink>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </BlurFade>

      {/* Elevated Table */}
      <BlurFade delay={0.08}>
        <SectionCard title="ELEVATED Flags" subtitle="Filterable table" icon={<AlertTriangle className="h-4 w-4" />}>
          <FlagLane title="Elevated" tone="elevated" flags={elevated} />
        </SectionCard>
      </BlurFade>

      {/* Monitor Table */}
      <BlurFade delay={0.1}>
        <SectionCard title="MONITOR Flags" subtitle="Track but not deal-breaking" icon={<Eye className="h-4 w-4" />}>
          <FlagLane title="Monitor" tone="monitor" flags={monitor} />
        </SectionCard>
      </BlurFade>

      {/* Hard Floor Gate Detail */}
      <BlurFade delay={0.12}>
        <SectionCard title="Hard Floor Gate Detail" subtitle="Full reasoning per gate" icon={<Layers className="h-4 w-4" />} empty={hardFloors.length === 0} emptyMessage="No hard-floor gates evaluated at L1.">
          {hardFloors.length > 0 && (
            <ul className="space-y-2">
              {hardFloors.map((g) => (
                <li key={g.id} className="rounded-md border border-border p-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-foreground">{g.category_label}</span>
                    <span className="text-[10px] text-muted-foreground">{g.status?.replace(/_/g, " ")}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </BlurFade>

      {/* Discrepancies Found */}
      <BlurFade delay={0.14}>
        <SectionCard title="Discrepancies Found" subtitle="Deck-vs-research mismatch matrix" icon={<Scale className="h-4 w-4" />} empty={criticalInfoGaps.length === 0} emptyMessage="No deck-vs-research discrepancies parsed at L1.">
          {criticalInfoGaps.length > 0 && (
            <ul className="space-y-1.5">
              {criticalInfoGaps.map((g) => (
                <li key={g.id} className="text-xs">
                  <p className="font-medium text-foreground">{g.gap_title}</p>
                  <p className="text-muted-foreground">{g.gap_description}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </BlurFade>

      {/* Regulatory & Litigation */}
      <BlurFade delay={0.16}>
        <SectionCard title="Regulatory & Litigation" subtitle="Advisories · enforcement · court rulings" icon={<Gavel className="h-4 w-4" />} empty emptyMessage="No regulatory or litigation findings at L1." />
      </BlurFade>

      {/* Carry-forward callout */}
      <BlurFade delay={0.18}>
        <SectionCard title="Carry-forward Risk" subtitle="Inherited from prior report" icon={<Link2 className="h-4 w-4" />} empty emptyMessage="No carry-forward inheritance at L1." />
      </BlurFade>
    </div>
  );
}
