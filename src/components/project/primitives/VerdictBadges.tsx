import { cn } from "@/lib/utils";

export type Recommendation = "MEET" | "CONDITIONAL MEET" | "NO MEET" | null | undefined;
export type Tier = "Strong Advance" | "Advance" | "Review" | "Decline" | null | undefined;

/** Maps a 0-100 composite score to the canonical 4-tier UI scale. */
export function tierFromScore(score: number | null | undefined): Tier {
  if (score == null) return null;
  if (score >= 85) return "Strong Advance";
  if (score >= 70) return "Advance";
  if (score >= 50) return "Review";
  return "Decline";
}

/** Maps a 0-100 composite score to the 3-tier recommendation scale. */
export function recommendationFromScore(score: number | null | undefined): Recommendation {
  if (score == null) return null;
  if (score >= 65) return "MEET";
  if (score >= 50) return "CONDITIONAL MEET";
  return "NO MEET";
}

const TIER_STYLE: Record<NonNullable<Tier>, string> = {
  "Strong Advance": "border-score-strong/40 text-score-strong bg-score-strong/10",
  Advance: "border-score-advance/40 text-score-advance bg-score-advance/10",
  Review: "border-score-review/40 text-score-review bg-score-review/10",
  Decline: "border-severity-critical/40 text-severity-critical bg-severity-critical/10",
};

const REC_STYLE: Record<NonNullable<Recommendation>, string> = {
  MEET: "bg-score-strong text-background",
  "CONDITIONAL MEET": "bg-severity-elevated text-background",
  "NO MEET": "bg-severity-critical text-background",
};

export function TierPill({ tier, className }: { tier: Tier; className?: string }) {
  if (!tier) {
    return (
      <span className={cn("inline-flex items-center rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground", className)}>
        Tier —
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
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
      <span className={cn("inline-flex items-center rounded-md border border-dashed border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground", className)}>
        Recommendation —
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider",
        REC_STYLE[recommendation],
        className,
      )}
    >
      {recommendation}
    </span>
  );
}

const BAND_STYLE: Record<string, string> = {
  Strong: "bg-score-strong/10 text-score-strong border-score-strong/30",
  Adequate: "bg-score-advance/10 text-score-advance border-score-advance/30",
  Caution: "bg-score-review/10 text-score-review border-score-review/30",
  "Significant Concerns": "bg-severity-elevated/10 text-severity-elevated border-severity-elevated/30",
  Weak: "bg-severity-critical/10 text-severity-critical border-severity-critical/30",
};

export function BandBadge({ band }: { band: string | null | undefined }) {
  if (!band) {
    return <span className="inline-flex items-center rounded border border-dashed border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">Band —</span>;
  }
  const style = BAND_STYLE[band] || "bg-muted text-muted-foreground border-border";
  return (
    <span className={cn("inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", style)}>
      {band}
    </span>
  );
}

export function bandFromScore(scorePct: number): string {
  if (scorePct >= 0.85) return "Strong";
  if (scorePct >= 0.7) return "Adequate";
  if (scorePct >= 0.5) return "Caution";
  if (scorePct >= 0.3) return "Significant Concerns";
  return "Weak";
}
