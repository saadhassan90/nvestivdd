import { cn } from "@/lib/utils";
import { getScoreTier, SCORE_TIER_LABELS, type ScoreTier } from "@/lib/score-utils";
import { getVerdict, getVerdictLabel, type Verdict } from "@/lib/verdict-utils";

/**
 * L1 PRD v2.0 — 4-tier verdict scale (was 3-tier MEET/CONDITIONAL/NO MEET).
 * Kept the legacy type aliases so older imports still type-check.
 */
export type Recommendation =
  | "ADVANCE"
  | "CONDITIONAL ADVANCE"
  | "DEFER"
  | "DECLINE"
  | null
  | undefined;
export type Tier =
  | "Exceptional"
  | "Strong"
  | "Adequate"
  | "Below Average"
  | "Concerning"
  | "Insufficient Data"
  | null
  | undefined;

/** Maps a 0-100 composite score to the PRD v2.0 6-tier scale. */
export function tierFromScore(score: number | null | undefined): Tier {
  if (score == null) return null;
  const tier = getScoreTier(score);
  return SCORE_TIER_LABELS[tier] as Tier;
}

/** Maps a 0-100 composite score to the PRD v2.0 4-tier recommendation. */
export function recommendationFromScore(score: number | null | undefined): Recommendation {
  if (score == null) return null;
  const verdict: Verdict = getVerdict(score, "complete");
  if (verdict === "advance") return "ADVANCE";
  if (verdict === "conditional_advance") return "CONDITIONAL ADVANCE";
  if (verdict === "defer") return "DEFER";
  if (verdict === "decline") return "DECLINE";
  return null;
}

const TIER_STYLE: Record<NonNullable<Tier>, string> = {
  Exceptional: "border-score-strong/40 text-score-strong bg-score-strong/10",
  Strong: "border-score-strong/40 text-score-strong bg-score-strong/10",
  Adequate: "border-score-advance/40 text-score-advance bg-score-advance/10",
  "Below Average": "border-score-review/40 text-score-review bg-score-review/10",
  Concerning: "border-severity-critical/40 text-severity-critical bg-severity-critical/10",
  "Insufficient Data": "border-dashed border-border text-muted-foreground bg-muted/30",
};

const REC_STYLE: Record<NonNullable<Recommendation>, string> = {
  ADVANCE: "bg-score-strong text-background",
  "CONDITIONAL ADVANCE": "bg-severity-monitor text-background",
  DEFER: "bg-score-review text-foreground",
  DECLINE: "bg-severity-critical text-background",
};

export function TierPill({ tier, className }: { tier: Tier; className?: string }) {
  if (!tier) {
    return (
      <span className={cn("inline-flex items-center rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] font-bold text-muted-foreground", className)}>
        Tier —
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold",
        TIER_STYLE[tier],
        className,
      )}
    >
      {tier}
    </span>
  );
}

export function RecommendationBadge({ recommendation, className }: { recommendation: Recommendation; className?: string }) {
  if (!recommendation) {
    return (
      <span className={cn("inline-flex items-center rounded-md border border-dashed border-border px-2 py-0.5 text-[10px] font-bold text-muted-foreground", className)}>
        Recommendation —
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-extrabold",
        REC_STYLE[recommendation],
        className,
      )}
    >
      {recommendation}
    </span>
  );
}

const BAND_STYLE: Record<string, string> = {
  Exceptional: "bg-score-strong/10 text-score-strong border-score-strong/30",
  Strong: "bg-score-strong/10 text-score-strong border-score-strong/30",
  Adequate: "bg-score-advance/10 text-score-advance border-score-advance/30",
  "Below Average": "bg-score-review/10 text-score-review border-score-review/30",
  Concerning: "bg-severity-critical/10 text-severity-critical border-severity-critical/30",
  "Insufficient Data": "bg-muted/30 text-muted-foreground border-dashed border-border",
};

export function BandBadge({ band }: { band: string | null | undefined }) {
  if (!band) {
    return <span className="inline-flex items-center rounded border border-dashed border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">Band —</span>;
  }
  const style = BAND_STYLE[band] || "bg-muted text-muted-foreground border-border";
  return (
    <span className={cn("inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold", style)}>
      {band}
    </span>
  );
}

export function bandFromScore(scorePct: number): string {
  // Accepts either 0–1 ratio or raw 0–100 score.
  const score = scorePct <= 1 ? scorePct * 100 : scorePct;
  return SCORE_TIER_LABELS[getScoreTier(score)];
}
