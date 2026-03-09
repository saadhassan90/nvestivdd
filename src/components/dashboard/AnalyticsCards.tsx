import { MagicCard } from "@/components/magicui/MagicCard";
import { NumberTicker } from "@/components/magicui/NumberTicker";
import { BlurFade } from "@/components/magicui/BlurFade";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface AnalyticsCardsProps {
  projects: Tables<"projects">[];
  flagCount: number;
}

export function AnalyticsCards({ projects, flagCount }: AnalyticsCardsProps) {
  const totalDeals = projects.length;
  const activeReviews = projects.filter(p => p.status === 'processing').length;
  const avgScore = projects.length > 0
    ? Math.round(projects.reduce((sum, p) => sum + (p.composite_score || 0), 0) / projects.length)
    : 0;

  const cards = [
    { label: "TOTAL DEALS", value: totalDeals, trend: "+12%", trendUp: true },
    { label: "ACTIVE REVIEWS", value: activeReviews, trend: "0", trendUp: true },
    { label: "AVG. SCORE", value: avgScore, suffix: "/100", trend: "+2.5%", trendUp: true },
    { label: "PENDING FLAGS", value: flagCount, trend: "-8%", trendUp: false },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <BlurFade key={card.label} delay={i * 0.1}>
          <MagicCard>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {card.label}
            </p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-3xl font-bold text-foreground">
                <NumberTicker value={card.value} suffix={card.suffix} />
              </span>
              {card.trend !== "0" && (
                <span className={`flex items-center gap-0.5 text-xs font-medium ${card.trendUp ? 'text-trend-positive' : 'text-trend-negative'}`}>
                  {card.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {card.trend}
                </span>
              )}
            </div>
          </MagicCard>
        </BlurFade>
      ))}
    </div>
  );
}
