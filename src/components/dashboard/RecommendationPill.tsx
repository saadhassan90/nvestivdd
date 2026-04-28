import { getRecommendationLabel } from "@/lib/score-utils";
import { normalizeRecommendation, type Verdict } from "@/lib/verdict-utils";

interface RecommendationPillProps {
  recommendation: string | null;
  /** Optional — kept for backward compatibility; styling is now derived from `recommendation`. */
  scoreTier?: string | null;
}

const VERDICT_STYLE: Record<Verdict, string> = {
  advance: "bg-score-strong text-primary-foreground",
  conditional_advance: "bg-severity-monitor text-primary-foreground",
  defer: "bg-score-review text-foreground",
  decline: "border border-severity-critical text-severity-critical bg-transparent",
  pending: "bg-muted text-muted-foreground",
  failed: "bg-muted text-muted-foreground",
};

export function RecommendationPill({ recommendation }: RecommendationPillProps) {
  const verdict = normalizeRecommendation(recommendation) ?? "pending";
  const label = getRecommendationLabel(recommendation);
  const style = VERDICT_STYLE[verdict];

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider leading-none whitespace-nowrap ${style}`}
    >
      {label}
    </span>
  );
}
