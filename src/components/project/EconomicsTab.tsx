import { Wallet, Scale, ListChecks, MessageSquare, BarChart3, Percent } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import { KpiTile } from "@/components/project/primitives/KpiTile";
import { EmptyChip } from "@/components/project/primitives/EmptyChip";
import { getSectionTier, SCORE_TIER_LABELS, type ScoreTier } from "@/lib/score-utils";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

/**
 * PRD v2.0 §3.6 — Economics tab.
 *
 * Replaces the old fee block embedded inside Performance/Track Record. Surfaces:
 *  1. Score header (1–10 + tier)
 *  2. Headline economics tiles (Mgmt Fee, Carry, Hurdle, Catch-up, Fee Offsets, GP Commit)
 *  3. Key Takeaways (institutional reads from fee_structure assessments)
 *  4. Fee benchmark table (component / fund value / market range / deviation flag)
 *  5. Sub-scores (Mgmt Fee 25 / Carry & Hurdle 25 / Alignment 20 / Fee Offsets 15 / Transparency 15)
 *  6. Diligence Questions (2–4 economics-scoped)
 *
 * Benchmark deviation flags & sub-score values populated by Phase 7.2/7.4 — for now
 * we render scaffolds with EmptyChip where data is absent.
 */

interface EconomicsTabProps {
  fees: Tables<"fee_structure">[];
  redFlags?: Tables<"red_flags">[];
  interrogatoryItems?: Tables<"interrogatory_items">[];
  moduleScoresData?: any[];
  project?: Tables<"projects">;
}

const SUB_SCORES = [
  { key: "mgmt_fee", label: "Management Fee", weight: 25 },
  { key: "carry_hurdle", label: "Carry & Hurdle", weight: 25 },
  { key: "alignment", label: "GP Alignment", weight: 20 },
  { key: "fee_offsets", label: "Fee Offsets", weight: 15 },
  { key: "transparency", label: "Transparency", weight: 15 },
];

type DeviationFlag =
  | "MATCH"
  | "AT_RANGE_TOP"
  | "AT_RANGE_BOTTOM"
  | "OUT_OF_RANGE_HIGH"
  | "OUT_OF_RANGE_LOW"
  | "MISMATCH"
  | "NO_BENCHMARK";

const DEVIATION_STYLE: Record<DeviationFlag, string> = {
  MATCH: "border-score-strong/40 text-score-strong bg-score-strong/10",
  AT_RANGE_TOP: "border-severity-elevated/40 text-severity-elevated bg-severity-elevated/10",
  AT_RANGE_BOTTOM: "border-severity-elevated/40 text-severity-elevated bg-severity-elevated/10",
  OUT_OF_RANGE_HIGH: "border-severity-critical/40 text-severity-critical bg-severity-critical/10",
  OUT_OF_RANGE_LOW: "border-severity-critical/40 text-severity-critical bg-severity-critical/10",
  MISMATCH: "border-severity-critical/40 text-severity-critical bg-severity-critical/10",
  NO_BENCHMARK: "border-border text-muted-foreground bg-muted/30",
};

const DEVIATION_LABEL: Record<DeviationFlag, string> = {
  MATCH: "In Range",
  AT_RANGE_TOP: "At Range Top",
  AT_RANGE_BOTTOM: "At Range Bottom",
  OUT_OF_RANGE_HIGH: "Above Range",
  OUT_OF_RANGE_LOW: "Below Range",
  MISMATCH: "Mismatch",
  NO_BENCHMARK: "No Benchmark",
};

function findFee(fees: Tables<"fee_structure">[], pattern: RegExp) {
  return fees.find((f) => pattern.test(f.component));
}

const TIER_PILL_CLASSES: Record<ScoreTier, string> = {
  exceptional: "bg-score-strong/15 text-score-strong border-score-strong/30",
  strong: "bg-score-strong/15 text-score-strong border-score-strong/30",
  adequate: "bg-score-advance/15 text-score-advance border-score-advance/30",
  below_average: "bg-score-review/15 text-score-review border-score-review/30",
  concerning: "bg-severity-critical/15 text-severity-critical border-severity-critical/30",
  insufficient_data: "bg-muted/40 text-muted-foreground border-border",
};

export function EconomicsTab({
  fees,
  redFlags = [],
  interrogatoryItems = [],
  moduleScoresData = [],
  project,
}: EconomicsTabProps) {
  const moduleScore = moduleScoresData.find((m) => m.module_key === "economics" || m.module_key === "fees");
  const score = moduleScore?.score ?? null;
  const tier = getSectionTier(score);
  const summary = moduleScore?.summary_assessment ?? null;

  const mgmtFee = findFee(fees, /management.*fee|mgmt/i);
  const carry = findFee(fees, /carr(y|ied)|performance.*fee|incentive/i);
  const hurdle = findFee(fees, /hurdle|preferred.*return/i);
  const catchUp = findFee(fees, /catch.?up/i);
  const feeOffset = findFee(fees, /offset|transaction.*fee/i);
  const gpCommit = findFee(fees, /gp.*commit|sponsor.*commit/i);

  const takeaways = fees
    .filter((f) => f.assessment_detail || f.assessment)
    .slice(0, 5)
    .map((f, i) => ({
      idx: i + 1,
      label: f.component,
      detail: f.assessment_detail ?? f.assessment ?? "",
      rating: f.assessment ?? null,
    }));

  const diligence = interrogatoryItems
    .filter((q) =>
      /econom|fee|carr|hurdle|catch|offset|gp.*commit|alignment/i.test(
        `${q.module ?? ""} ${q.source_module ?? ""} ${q.question ?? ""}`,
      ),
    )
    .slice(0, 4);

  return (
    <div className="space-y-4">
      {/* 1. Score Header */}
      <BlurFade delay={0.05}>
        <SectionCard
          title="Economics"
          subtitle="Fee structure, alignment & benchmark deviation"
          icon={<Wallet className="h-4 w-4" />}
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold tabular-nums text-foreground">
                {score ?? "—"}
                <span className="text-lg font-medium text-muted-foreground">/10</span>
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                  TIER_PILL_CLASSES[tier],
                )}
              >
                {SCORE_TIER_LABELS[tier]}
              </span>
            </div>
            {summary ? (
              <p className="max-w-2xl text-xs text-muted-foreground leading-relaxed">{summary}</p>
            ) : (
              <EmptyChip label="ASSESSMENT PENDING" />
            )}
          </div>
        </SectionCard>
      </BlurFade>

      {/* 2. Headline Economics Tiles */}
      <BlurFade delay={0.1}>
        <SectionCard title="Headline Economics" icon={<Percent className="h-4 w-4" />}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <KpiTile label="Mgmt Fee" value={mgmtFee?.value ?? null} subValue={mgmtFee?.share_class ?? undefined} />
            <KpiTile label="Carry" value={carry?.value ?? null} subValue={carry?.share_class ?? undefined} />
            <KpiTile label="Hurdle" value={hurdle?.value ?? null} />
            <KpiTile label="Catch-up" value={catchUp?.value ?? null} />
            <KpiTile label="Fee Offsets" value={feeOffset?.value ?? null} />
            <KpiTile label="GP Commit" value={gpCommit?.value ?? null} />
          </div>
        </SectionCard>
      </BlurFade>

      {/* 3. Key Takeaways */}
      <BlurFade delay={0.15}>
        <SectionCard
          title="Key Takeaways"
          icon={<ListChecks className="h-4 w-4" />}
          empty={takeaways.length === 0}
          emptyMessage="No fee assessments available at L1."
        >
          <ol className="space-y-2.5">
            {takeaways.map((t) => (
              <li key={t.idx} className="flex gap-3 text-sm">
                <span className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted/60 text-[11px] font-semibold text-muted-foreground">
                  {t.idx}
                </span>
                <div className="min-w-0">
                  <p className="text-foreground">
                    <span className="font-medium">{t.label}:</span>{" "}
                    <span className="text-muted-foreground">{t.detail}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </SectionCard>
      </BlurFade>

      {/* 4. Fee Benchmark Table */}
      <BlurFade delay={0.2}>
        <SectionCard
          title="Fee Benchmark"
          subtitle="Fund terms vs market range (asset class normalized)"
          icon={<Scale className="h-4 w-4" />}
          empty={fees.length === 0}
          emptyMessage="No fee components disclosed at L1."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border/60">
                  <th className="font-semibold py-2 pr-3">Component</th>
                  <th className="font-semibold py-2 pr-3">Share Class</th>
                  <th className="font-semibold py-2 pr-3">Fund Value</th>
                  <th className="font-semibold py-2 pr-3">Market Range</th>
                  <th className="font-semibold py-2">Deviation</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((f) => {
                  const flag: DeviationFlag = "NO_BENCHMARK"; // Phase 7.2 will populate
                  return (
                    <tr key={f.id} className="border-b border-border/30 last:border-0">
                      <td className="py-2 pr-3 font-medium text-foreground">{f.component}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{f.share_class || "—"}</td>
                      <td className="py-2 pr-3 tabular-nums text-foreground">
                        {f.is_disclosed ? f.value : <EmptyChip />}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        <EmptyChip label="BENCHMARK PENDING" />
                      </td>
                      <td className="py-2">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                            DEVIATION_STYLE[flag],
                          )}
                        >
                          {DEVIATION_LABEL[flag]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </BlurFade>

      {/* 5. Sub-Scores */}
      <BlurFade delay={0.25}>
        <SectionCard
          title="Sub-Score Breakdown"
          subtitle="Weighted contributions to the Economics score"
          icon={<BarChart3 className="h-4 w-4" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
            {SUB_SCORES.map((s) => (
              <div key={s.key} className="rounded-lg border border-border bg-card px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </p>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <EmptyChip label="PENDING" />
                  <span className="text-[10px] text-muted-foreground">·{s.weight}%</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </BlurFade>

      {/* 6. Diligence Questions */}
      <BlurFade delay={0.3}>
        <SectionCard
          title="Diligence Questions"
          subtitle="Top economics-scoped questions for L2 follow-up"
          icon={<MessageSquare className="h-4 w-4" />}
          empty={diligence.length === 0}
          emptyMessage="No economics-specific questions surfaced at L1."
        >
          <ol className="space-y-2.5">
            {diligence.map((q, i) => (
              <li key={q.id} className="flex gap-3 text-sm">
                <span className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted/60 text-[11px] font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-foreground">{q.question}</p>
                  {q.rationale && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{q.rationale}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </SectionCard>
      </BlurFade>
    </div>
  );
}
