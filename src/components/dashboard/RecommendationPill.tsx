import { getRecommendationLabel } from "@/lib/score-utils";

interface RecommendationPillProps {
  recommendation: string | null;
  scoreTier: string | null;
}

export function RecommendationPill({ recommendation, scoreTier }: RecommendationPillProps) {
  const label = getRecommendationLabel(recommendation);

  const styleMap: Record<string, string> = {
    strong_advance: "bg-score-strong text-primary-foreground",
    advance: "bg-score-advance text-primary-foreground",
    review: "bg-score-review text-foreground",
    decline: "border border-score-decline text-score-decline bg-transparent",
  };

  const style = scoreTier ? styleMap[scoreTier] || "bg-muted text-muted-foreground" : "bg-muted text-muted-foreground";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style}`}>
      {label}
    </span>
  );
}
