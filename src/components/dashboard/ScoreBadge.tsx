import {
  getScoreTier,
  getTierBorderClass,
  getTierTextClass,
  SCORE_TIER_LABELS,
} from "@/lib/score-utils";

interface ScoreBadgeProps {
  score: number | null;
  size?: "sm" | "md" | "lg";
  /** When true, render the tier label next to the numeric score. */
  showTier?: boolean;
}

export function ScoreBadge({ score, size = "md", showTier = false }: ScoreBadgeProps) {
  const tier = getScoreTier(score);
  const borderCls = getTierBorderClass(tier);
  const textCls = getTierTextClass(tier);

  const sizeMap = {
    sm: "h-7 w-9 text-xs",
    md: "h-9 w-12 text-sm",
    lg: "h-12 w-16 text-lg",
  } as const;

  const badge = (
    <div
      className={`inline-flex items-center justify-center rounded-lg border-2 font-bold ${borderCls} ${textCls} ${sizeMap[size]}`}
    >
      {tier === "insufficient_data" ? "—" : score}
    </div>
  );

  if (!showTier) return badge;

  return (
    <div className="inline-flex items-center gap-2">
      {badge}
      <span className={`text-[11px] font-semibold uppercase tracking-wider ${textCls}`}>
        {SCORE_TIER_LABELS[tier]}
      </span>
    </div>
  );
}
