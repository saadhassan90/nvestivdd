import { MagicCard } from "@/components/magicui/MagicCard";
import { NumberTicker } from "@/components/magicui/NumberTicker";
import { BlurFade } from "@/components/magicui/BlurFade";
import { FolderOpen, CheckCircle2, RefreshCw, AlertCircle, Gauge } from "lucide-react";
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

  // L1 PRD §6.5 — average completeness across completed deals (null-safe).
  const completenessSamples = projects
    .map((p) => (p as { completeness_pct?: number | null }).completeness_pct)
    .filter((v): v is number => typeof v === "number");
  const avgCompleteness = completenessSamples.length
    ? Math.round(completenessSamples.reduce((a, b) => a + b, 0) / completenessSamples.length)
    : null;

  const cards = [
    { label: "Total Funds", value: total, icon: FolderOpen, iconColor: "text-muted-foreground" },
    { label: "Completed", value: completed, icon: CheckCircle2, iconColor: "text-score-strong" },
    { label: "Processing", value: processing, icon: RefreshCw, iconColor: "text-severity-monitor" },
    { label: "Failed", value: failed, icon: AlertCircle, iconColor: "text-severity-critical" },
    {
      label: "Avg Confidence",
      value: avgCompleteness ?? 0,
      suffix: avgCompleteness == null ? "—" : "%",
      icon: Gauge,
      iconColor: "text-severity-monitor",
    },
  ];

  return (
    <>
      {/* Desktop */}
      <div className="hidden sm:grid sm:grid-cols-5 gap-2">
        {cards.map((card, i) => (
          <BlurFade key={card.label} delay={i * 0.05}>
            <MagicCard>
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">
                    {card.label}
                  </p>
                  <span className="mt-0.5 block text-xl font-bold text-foreground">
                    {(card as { suffix?: string }).suffix === "—" ? (
                      "—"
                    ) : (
                      <>
                        <NumberTicker value={card.value} />
                        {(card as { suffix?: string }).suffix === "%" && (
                          <span className="text-xs ml-0.5">%</span>
                        )}
                      </>
                    )}
                  </span>
                </div>
                <card.icon className={`h-4 w-4 shrink-0 ${card.iconColor}`} />
              </div>
            </MagicCard>
          </BlurFade>
        ))}
      </div>

      {/* Mobile: compact 5-col */}
      <BlurFade>
        <div className="sm:hidden grid grid-cols-5 gap-1.5">
          {cards.map((card) => (
            <div key={card.label} className="rounded-md border border-border bg-card px-2 py-1.5">
              <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground leading-tight truncate">
                {card.label}
              </p>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-sm font-bold text-foreground leading-none">
                  {(card as { suffix?: string }).suffix === "—"
                    ? "—"
                    : `${card.value}${(card as { suffix?: string }).suffix ?? ""}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </BlurFade>
    </>
  );
}
