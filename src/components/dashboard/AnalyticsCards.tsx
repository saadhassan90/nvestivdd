import { MagicCard } from "@/components/magicui/MagicCard";
import { NumberTicker } from "@/components/magicui/NumberTicker";
import { BlurFade } from "@/components/magicui/BlurFade";
import { FolderOpen, CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface AnalyticsCardsProps {
  projects: Tables<"projects">[];
  flagCount?: number;
}

export function AnalyticsCards({ projects }: AnalyticsCardsProps) {
  const total = projects.length;
  const completed = projects.filter(p => p.status === "complete").length;
  const processing = projects.filter(p =>
    ["pending", "uploading", "processing", "analyzing", "extracting"].includes(p.status)
  ).length;
  const failed = projects.filter(p => p.status === "failed").length;

  const cards = [
    { label: "Total Funds", value: total, icon: FolderOpen, iconColor: "text-muted-foreground" },
    { label: "Completed", value: completed, icon: CheckCircle2, iconColor: "text-score-strong" },
    { label: "Processing", value: processing, icon: RefreshCw, iconColor: "text-severity-monitor" },
    { label: "Failed", value: failed, icon: AlertCircle, iconColor: "text-severity-critical" },
  ];

  return (
    <>
      {/* Desktop */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <BlurFade key={card.label} delay={i * 0.08}>
            <MagicCard>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {card.label}
                  </p>
                  <span className="mt-2 block text-3xl font-bold text-foreground">
                    <NumberTicker value={card.value} />
                  </span>
                </div>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </MagicCard>
          </BlurFade>
        ))}
      </div>

      {/* Mobile: compact 2x2 */}
      <BlurFade>
        <div className="sm:hidden grid grid-cols-2 gap-2">
          {cards.map((card) => (
            <div key={card.label} className="rounded-lg border border-border bg-card px-3 py-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
                {card.label}
              </p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-bold text-foreground leading-none">
                  {card.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </BlurFade>
    </>
  );
}
