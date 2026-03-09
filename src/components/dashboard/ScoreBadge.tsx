import { getScoreTier } from "@/lib/score-utils";

interface ScoreBadgeProps {
  score: number | null;
  size?: "sm" | "md" | "lg";
}

export function ScoreBadge({ score, size = "md" }: ScoreBadgeProps) {
  if (score === null) return <span className="text-muted-foreground">—</span>;

  const tier = getScoreTier(score);
  const colorMap: Record<string, string> = {
    strong_advance: "border-score-strong text-score-strong",
    advance: "border-score-advance text-score-advance",
    review: "border-score-review text-score-review",
    decline: "border-score-decline text-score-decline",
  };

  const sizeMap = {
    sm: "h-7 w-9 text-xs",
    md: "h-9 w-12 text-sm",
    lg: "h-12 w-16 text-lg",
  };

  return (
    <div className={`inline-flex items-center justify-center rounded-lg border-2 font-bold ${colorMap[tier]} ${sizeMap[size]}`}>
      {score}
    </div>
  );
}
