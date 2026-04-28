import { Globe2, ListChecks, MessageSquare, TrendingUp } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import { MarketContextStrip } from "@/components/project/typed/MarketContextStrip";
import { SectorExposureChart } from "@/components/project/typed/SectorExposureChart";
import { GeographyMap } from "@/components/project/typed/GeographyMap";
import { getSectionTier, SCORE_TIER_LABELS, type ScoreTier } from "@/lib/score-utils";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

/**
 * PRD v2.0 §3.3 — Market Reality tab
 *
 * Layout:
 *  1. Score header (1–10 + tier label)
 *  2. market_context_strip (sector_dynamics) — Phase 6.5 scaffold
 *  3. 3–5 Takeaways
 *  4. claim_vs_market paired table with deviation flags
 *  5. Sub-scores (Sector Consensus 30 / Treatment vs Selection 25 / Crowding 25 / Macro 20)
 *  6. 2–4 Diligence Questions
 */

interface MarketRealityTabProps {
  marketFactors: Tables<"market_factors">[];
  competitors: Tables<"competitive_landscape">[];
  thesisValidations: Tables<"thesis_validations">[];
  interrogatoryItems: Tables<"interrogatory_items">[];
  moduleScoresData?: any[];
  project?: Tables<"projects">;
}

const SUB_SCORES = [
  { key: "sector_consensus", label: "Sector Consensus", weight: 30 },
  { key: "treatment_vs_selection", label: "Treatment vs Selection", weight: 25 },
  { key: "crowding", label: "Crowding", weight: 25 },
  { key: "macro", label: "Macro Tailwinds/Headwinds", weight: 20 },
];

/** PRD §3.3 — 7 deviation states */
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
  AT_RANGE_TOP: "border-score-advance/40 text-score-advance bg-score-advance/10",
  AT_RANGE_BOTTOM: "border-score-review/40 text-score-review bg-score-review/10",
  OUT_OF_RANGE_HIGH: "border-severity-elevated/40 text-severity-elevated bg-severity-elevated/10",
  OUT_OF_RANGE_LOW: "border-severity-elevated/40 text-severity-elevated bg-severity-elevated/10",
  MISMATCH: "border-severity-critical/40 text-severity-critical bg-severity-critical/10",
  NO_BENCHMARK: "border-dashed border-border text-muted-foreground bg-muted/30",
};

const DEVIATION_LABEL: Record<DeviationFlag, string> = {
  MATCH: "Match",
  AT_RANGE_TOP: "At Range Top",
  AT_RANGE_BOTTOM: "At Range Bottom",
  OUT_OF_RANGE_HIGH: "Above Range",
  OUT_OF_RANGE_LOW: "Below Range",
  MISMATCH: "Mismatch",
  NO_BENCHMARK: "No Benchmark",
};

export function MarketRealityTab({
  marketFactors,
  competitors,
  thesisValidations,
  interrogatoryItems,
  moduleScoresData = [],
  project,
}: MarketRealityTabProps) {
  // Locate the Market Reality dimension score
  const marketModule = moduleScoresData.find((m) =>
    ["market", "module_d", "domain"].some(
      (a) =>
        m.module_key?.toLowerCase().includes(a) ||
        m.module_label?.toLowerCase().includes(a),
    ),
  );
  const rawScore = marketModule?.score ?? null;
  const score10 = rawScore == null ? null : rawScore > 10 ? Math.round((rawScore / 10) * 10) / 10 : rawScore;
  const tier = getSectionTier(score10);

  // Takeaways: prefer Phase 7.4 synthesized list; fallback to market_factors.
  const synthTakeaways =
    (marketModule?.takeaways as Array<{ text: string; detail?: string }> | undefined) ?? [];
  const takeaways =
    synthTakeaways.length > 0
      ? synthTakeaways.map((t, i) => ({
          id: `synth-${i}`,
          title: t.text,
          description: t.detail ?? null,
          factor_type: null as string | null,
        }))
      : marketFactors.slice(0, 5).map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          factor_type: m.factor_type,
        }));

  const synthSubScores = (marketModule?.sub_scores as Array<any> | undefined) ?? [];

  // claim_vs_market: derive from thesis validations + market factors
  // Phase 7.4 will emit this as a structured object; today we infer.
  const claims = buildClaimVsMarket(thesisValidations, marketFactors);

  // Diligence Qs scoped to market/domain
  const marketQs = interrogatoryItems
    .filter((q) =>
      (q.module || q.source_module || "").toLowerCase().match(/market|domain|module_d/),
    )
    .slice(0, 4);

  const assetClass = project?.asset_class || null;

  // Phase 7 — synthesis payloads now persisted on the projects row.
  const marketContext = ((project as any)?.market_context ?? null) as
    | { scope?: string | null; tiles?: any[]; benchmark_key?: string | null }
    | null;
  const benchmarkKey =
    marketContext?.benchmark_key ??
    (assetClass ? `${assetClass}::{subAssetClass}::{marketSegment}` : null);

  const sectorBreakdown = ((project as any)?.sector_breakdown ?? null) as
    | Array<{ sector: string; pct: number; meta?: string | null }>
    | null;
  const sectorSlices =
    sectorBreakdown && sectorBreakdown.length > 0
      ? sectorBreakdown
      : deriveSectorSlices(competitors);

  const geographyBreakdown = ((project as any)?.geography_breakdown ?? null) as
    | Array<{ region: string; pct: number; detail?: string | null }>
    | null;

  return (
    <div className="space-y-5">
      {/* 1. Score header */}
      <BlurFade>
        <SectionCard
          title="Market Reality"
          subtitle="How does the GP's read of the market square with consensus, peer activity, and macro?"
          icon={<Globe2 className="h-4 w-4" />}
          actions={<ScoreHeader score10={score10} tier={tier} />}
        >
          {marketModule?.summary_assessment ? (
            <p className="text-sm leading-relaxed text-foreground/90">{marketModule.summary_assessment}</p>
          ) : (
            <p className="text-xs italic text-muted-foreground">
              Section summary not yet synthesized at L1 — awaiting Phase 7.4 per-section synthesis.
            </p>
          )}
        </SectionCard>
      </BlurFade>

      {/* 2. market_context_strip — sector_dynamics (Phase 6.5 scaffold) */}
      <BlurFade delay={0.04}>
        <MarketContextStrip
          scope={marketContext?.scope ?? assetClass}
          tiles={(marketContext?.tiles ?? []) as any}
          benchmarkKey={benchmarkKey}
        />
      </BlurFade>

      {/* 2b. Sector exposure chart (PRD §6.2) — derived from competitive landscape */}
      <BlurFade delay={0.05}>
        <SectorExposureChart
          slices={sectorSlices}
          denominator={project?.fund_size_estimated || null}
        />
      </BlurFade>

      {/* 2c. Geography map (PRD §6.3) — typed shell, awaiting synthesis */}
      <BlurFade delay={0.055}>
        <GeographyMap
          slices={(geographyBreakdown ?? []) as any}
          statedMandate={project?.strategy || null}
        />
      </BlurFade>

      {/* 3. Takeaways */}
      <BlurFade delay={0.06}>
        <SectionCard
          title="Key Takeaways"
          subtitle="3–5 institutional reads from market factors"
          icon={<ListChecks className="h-4 w-4" />}
          empty={takeaways.length === 0}
          emptyMessage="Market takeaways not yet emitted by the synthesis pipeline."
        >
          {takeaways.length > 0 && (
            <ol className="space-y-2.5">
              {takeaways.map((t, i) => (
                <li key={t.id} className="flex gap-3 text-xs">
                  <span className="text-[10px] font-bold text-muted-foreground tabular-nums shrink-0 mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground font-medium leading-snug">{t.title}</p>
                    {t.description && (
                      <p className="text-[11px] text-muted-foreground italic mt-0.5 leading-snug">{t.description}</p>
                    )}
                  </div>
                  {t.factor_type && (
                    <span className="ml-auto shrink-0 inline-flex items-center rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {t.factor_type.replace(/_/g, " ")}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </SectionCard>
      </BlurFade>

      {/* 4. claim_vs_market paired table */}
      <BlurFade delay={0.08}>
        <SectionCard
          title="GP Claims vs Market"
          subtitle="Each thesis claim paired against benchmark range with deviation flag"
          icon={<TrendingUp className="h-4 w-4" />}
          empty={claims.length === 0}
          emptyMessage="No claim-vs-market pairs available — awaiting Phase 7.4 synthesis output."
        >
          {claims.length > 0 && <ClaimVsMarketTable rows={claims} />}
        </SectionCard>
      </BlurFade>

      {/* 5. Sub-scores panel */}
      <BlurFade delay={0.1}>
        <SectionCard
          title="Sub-Scores"
          subtitle="4 dimensions · weights sum to 100"
          icon={<ListChecks className="h-4 w-4" />}
        >
          <SubScoresPanel sectionScore10={score10} synthesized={synthSubScores} />
        </SectionCard>
      </BlurFade>

      {/* 6. Diligence Questions */}
      <BlurFade delay={0.12}>
        <SectionCard
          title="Diligence Questions"
          subtitle="2–4 market-scoped questions · L1 view"
          icon={<MessageSquare className="h-4 w-4" />}
          empty={marketQs.length === 0}
          emptyMessage="No market-scoped diligence questions emitted yet."
        >
          {marketQs.length > 0 && (
            <ul className="space-y-2">
              {marketQs.map((q) => (
                <li key={q.id} className="text-xs border-l-2 border-border pl-3">
                  <p className="text-foreground font-medium leading-snug">{q.question}</p>
                  {q.rationale && (
                    <p className="text-[11px] text-muted-foreground italic mt-1 leading-snug">{q.rationale}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </BlurFade>

    </div>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────────── */

function ScoreHeader({ score10, tier }: { score10: number | null; tier: ScoreTier }) {
  const tierClass = (() => {
    switch (tier) {
      case "exceptional":
      case "strong": return "border-score-strong/40 text-score-strong bg-score-strong/10";
      case "adequate": return "border-score-advance/40 text-score-advance bg-score-advance/10";
      case "below_average": return "border-score-review/40 text-score-review bg-score-review/10";
      case "concerning": return "border-severity-critical/40 text-severity-critical bg-severity-critical/10";
      case "insufficient_data": return "border-dashed border-border text-muted-foreground bg-muted/30";
    }
  })();
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-baseline gap-0.5 tabular-nums">
        <span className="text-2xl font-bold text-foreground">{score10 != null ? score10.toFixed(1) : "─"}</span>
        <span className="text-xs text-muted-foreground">/10</span>
      </div>
      <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", tierClass)}>
        {SCORE_TIER_LABELS[tier]}
      </span>
    </div>
  );
}

/** Derive a best-effort sector breakdown from the competitive landscape rows.
 * Phase 7.4 will replace this with a real `sector_breakdown[]` payload. */
function deriveSectorSlices(
  competitors: Tables<"competitive_landscape">[],
): Array<{ sector: string; pct: number; meta?: string | null }> {
  if (!competitors.length) return [];
  const counts = new Map<string, number>();
  for (const c of competitors) {
    const key = (c.competitor_type || c.strategy_description || "Other")
      .toString()
      .split(/[·,/]/)[0]
      .trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  if (!total) return [];
  return Array.from(counts.entries())
    .map(([sector, n]) => ({
      sector,
      pct: (n / total) * 100,
      meta: `${n} peer${n === 1 ? "" : "s"}`,
    }))
    .filter((s) => s.pct > 0);
}

/* ─── claim_vs_market table ─────────────────────────────────────────── */

type ClaimRow = {
  id: string;
  claim: string;
  source: string | null;
  benchmark: string | null;
  deviation: DeviationFlag;
};

function buildClaimVsMarket(
  validations: Tables<"thesis_validations">[],
  factors: Tables<"market_factors">[],
): ClaimRow[] {
  if (!validations.length) return [];
  return validations.slice(0, 6).map((v) => {
    // Map validation_status → deviation flag (best-effort until Phase 7.4)
    const status = (v.validation_status || "").toLowerCase();
    let deviation: DeviationFlag = "NO_BENCHMARK";
    if (status.includes("match") || status.includes("validated") || status.includes("supported")) deviation = "MATCH";
    else if (status.includes("partial") || status.includes("weak")) deviation = "AT_RANGE_BOTTOM";
    else if (status.includes("contra") || status.includes("invalid") || status.includes("fail")) deviation = "MISMATCH";
    else if (status.includes("aggressive") || status.includes("optimistic")) deviation = "OUT_OF_RANGE_HIGH";
    else if (status.includes("conservative")) deviation = "OUT_OF_RANGE_LOW";

    // Try to match a benchmark from market factors
    const benchmark = factors.find((f) =>
      v.claim?.toLowerCase().includes(f.title?.toLowerCase().slice(0, 8) || "___"),
    );

    return {
      id: v.id,
      claim: v.claim,
      source: v.claim_source,
      benchmark: benchmark?.supporting_data || benchmark?.description || null,
      deviation,
    };
  });
}

function ClaimVsMarketTable({ rows }: { rows: ClaimRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/60 text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="text-left font-semibold py-2 pr-3">GP Claim</th>
            <th className="text-left font-semibold py-2 pr-3 w-[28%]">Benchmark / Market Read</th>
            <th className="text-right font-semibold py-2 w-32">Deviation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border/30 last:border-0 align-top">
              <td className="py-2.5 pr-3">
                <p className="text-foreground font-medium leading-snug">{r.claim}</p>
                {r.source && (
                  <p className="text-[10px] text-muted-foreground italic mt-0.5">Source: {r.source}</p>
                )}
              </td>
              <td className="py-2.5 pr-3 text-muted-foreground">
                {r.benchmark || (
                  <span className="italic text-muted-foreground/70">No matched benchmark.</span>
                )}
              </td>
              <td className="py-2.5 text-right">
                <span
                  className={cn(
                    "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    DEVIATION_STYLE[r.deviation],
                  )}
                >
                  {DEVIATION_LABEL[r.deviation]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubScoresPanel({
  sectionScore10,
  synthesized = [],
}: {
  sectionScore10: number | null;
  synthesized?: Array<{ key?: string; label?: string; score?: number; weight?: number; rationale?: string }>;
}) {
  const synthMap = new Map(synthesized.map((s) => [s.key, s]));
  return (
    <div className="space-y-2">
      {SUB_SCORES.map((s) => {
        const synth = synthMap.get(s.key);
        const score = synth?.score ?? null;
        const tier = getSectionTier(score);
        return (
          <div key={s.key} className="grid grid-cols-[1fr_60px_60px_80px] items-center gap-3 text-xs py-1.5 border-b border-border/30 last:border-0">
            <div className="min-w-0">
              <p className="text-foreground font-medium truncate">{s.label}</p>
              {synth?.rationale && (
                <p className="text-[10px] text-muted-foreground italic mt-0.5 truncate">{synth.rationale}</p>
              )}
            </div>
            <span className="text-right tabular-nums text-muted-foreground">{s.weight}%</span>
            <span className="text-right tabular-nums text-foreground font-medium">
              {score != null ? score.toFixed(1) : "─"}
            </span>
            <span className="text-right text-[10px] uppercase tracking-wider text-muted-foreground">
              {SCORE_TIER_LABELS[tier]}
            </span>
          </div>
        );
      })}
      <p className="text-[10px] italic text-muted-foreground pt-2">
        Section score ({sectionScore10 != null ? sectionScore10.toFixed(1) : "—"}/10) reflects the
        weighted roll-up of the four sub-dimensions above.
      </p>
    </div>
  );
}