import { BlurFade } from "@/components/magicui/BlurFade";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Target, TrendingUp, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useState } from "react";
import { getVerdict, getVerdictLabel, getVerdictColor } from "@/lib/verdict-utils";
import type { Tables } from "@/integrations/supabase/types";

interface ScorecardTabProps {
  project: Tables<"projects">;
  moduleScores: any[];
}

const RUBRIC_TIERS = [
  { range: "85–100", label: "Strong Advance", description: "Exceptional fund — institutional-grade evidence across all modules.", color: "text-score-strong", bg: "bg-score-strong/10", border: "border-score-strong/30" },
  { range: "70–84", label: "Advance", description: "Strong fund with minor gaps — proceed to deeper diligence.", color: "text-score-advance", bg: "bg-score-advance/10", border: "border-score-advance/30" },
  { range: "50–69", label: "Review", description: "Material concerns — conditional advancement requires resolution.", color: "text-score-review", bg: "bg-score-review/10", border: "border-score-review/30" },
  { range: "0–49", label: "Decline", description: "Hard floor triggered — fundamental gaps prevent advancement.", color: "text-severity-critical", bg: "bg-severity-critical/10", border: "border-severity-critical/30" },
];

const CONFIDENCE_LABELS: Record<string, { label: string; color: string }> = {
  high: { label: "High confidence", color: "text-score-strong" },
  medium_high: { label: "Medium-high", color: "text-score-advance" },
  medium: { label: "Medium", color: "text-score-review" },
  medium_low: { label: "Medium-low", color: "text-severity-monitor" },
  low: { label: "Low confidence", color: "text-severity-critical" },
};

function getModuleTierColor(score: number) {
  if (score >= 85) return { text: "text-score-strong", bg: "bg-score-strong", border: "border-score-strong/30", soft: "bg-score-strong/10" };
  if (score >= 70) return { text: "text-score-advance", bg: "bg-score-advance", border: "border-score-advance/30", soft: "bg-score-advance/10" };
  if (score >= 50) return { text: "text-score-review", bg: "bg-score-review", border: "border-score-review/30", soft: "bg-score-review/10" };
  return { text: "text-severity-critical", bg: "bg-severity-critical", border: "border-severity-critical/30", soft: "bg-severity-critical/10" };
}

function getModuleTierLabel(score: number) {
  if (score >= 85) return "Strong Advance";
  if (score >= 70) return "Advance";
  if (score >= 50) return "Review";
  return "Decline";
}

export function ScorecardTab({ project, moduleScores }: ScorecardTabProps) {
  const composite = project.composite_score ?? 0;
  const verdict = getVerdict(composite, project.status);
  const compositeColors = getModuleTierColor(composite);

  const sortedModules = [...moduleScores].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const totalWeight = sortedModules.reduce((sum, m) => sum + (Number(m.weight) || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Composite header */}
      <BlurFade delay={0.05}>
        <Card className="overflow-hidden border-border">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-0">
            <div className={`p-6 ${compositeColors.soft} border-r border-border flex flex-col justify-center items-center text-center`}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Composite Score</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-6xl font-bold tabular-nums ${compositeColors.text}`}>{composite}</span>
                <span className="text-xl text-muted-foreground">/100</span>
              </div>
              <Badge variant="outline" className={`mt-3 ${compositeColors.border} ${compositeColors.text} font-semibold`}>
                {getModuleTierLabel(composite)}
              </Badge>
              <p className={`mt-2 text-sm font-medium ${getVerdictColor(verdict)}`}>{getVerdictLabel(verdict)}</p>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Scoring Methodology</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The composite score is a weighted aggregate across {sortedModules.length} diligence modules. Each module receives a 0–100 score
                from the analyst pipeline, multiplied by its rubric weight. Confidence levels reflect the strength of source evidence backing each
                assessment.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {RUBRIC_TIERS.map((tier) => (
                  <div key={tier.range} className={`rounded-md border ${tier.border} ${tier.bg} px-2.5 py-2`}>
                    <p className={`text-[10px] font-bold uppercase ${tier.color}`}>{tier.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{tier.range}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </BlurFade>

      {/* Module breakdown */}
      <BlurFade delay={0.1}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Module Breakdown</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Detailed scoring across all {sortedModules.length} diligence modules · Total weight: {(totalWeight * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {sortedModules.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No module scores available yet.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {sortedModules.map((mod, idx) => (
              <ModuleScoreRow key={mod.id} module={mod} index={idx} totalWeight={totalWeight} />
            ))}
          </div>
        )}
      </BlurFade>

      {/* Rubric detail */}
      <BlurFade delay={0.15}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Rubric Reference</h2>
          </div>
          <div className="space-y-3">
            {RUBRIC_TIERS.map((tier) => (
              <div key={tier.range} className={`flex gap-3 p-3 rounded-lg border ${tier.border} ${tier.bg}`}>
                <div className="shrink-0 min-w-[80px]">
                  <p className={`text-xs font-bold ${tier.color}`}>{tier.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{tier.range}</p>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">{tier.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </BlurFade>
    </div>
  );
}

function ModuleScoreRow({ module: mod, index, totalWeight }: { module: any; index: number; totalWeight: number }) {
  const [open, setOpen] = useState(index === 0);
  const score = Number(mod.score) || 0;
  const weight = Number(mod.weight) || 0;
  const weighted = Number(mod.weighted_score) || (score * weight);
  const tier = getModuleTierColor(score);
  const conf = CONFIDENCE_LABELS[mod.confidence] || { label: mod.confidence || "—", color: "text-muted-foreground" };
  const weightPct = totalWeight > 0 ? (weight / totalWeight) * 100 : 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={`overflow-hidden transition-colors ${open ? "border-border" : "border-border/60 hover:border-border"}`}>
        <CollapsibleTrigger className="w-full text-left">
          <div className="p-4 flex items-center gap-4">
            {/* Score circle */}
            <div className={`shrink-0 h-14 w-14 rounded-lg ${tier.soft} ${tier.border} border flex flex-col items-center justify-center`}>
              <span className={`text-xl font-bold tabular-nums ${tier.text} leading-none`}>{score}</span>
              <span className="text-[9px] text-muted-foreground mt-0.5">/100</span>
            </div>

            {/* Title + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-foreground truncate">{mod.module_label}</h3>
                <Badge variant="outline" className={`${tier.border} ${tier.text} text-[10px] font-semibold`}>
                  {getModuleTierLabel(score)}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                <span>Weight: <span className="font-medium text-foreground">{(weight * 100).toFixed(0)}%</span></span>
                <span>·</span>
                <span>Weighted: <span className="font-medium text-foreground tabular-nums">{Number(weighted).toFixed(2)}</span></span>
                <span>·</span>
                <span className={`font-medium ${conf.color}`}>{conf.label}</span>
              </div>
              <div className="mt-2">
                <Progress value={score} className="h-1.5" />
              </div>
            </div>

            <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-1 border-t border-border/60 space-y-4">
            {/* Summary assessment */}
            {mod.summary_assessment && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Summary Assessment</h4>
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed">{mod.summary_assessment}</p>
              </div>
            )}

            {/* Confidence rationale */}
            {mod.confidence_rationale && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confidence Rationale</h4>
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed">{mod.confidence_rationale}</p>
              </div>
            )}

            {/* Score math */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="rounded-md bg-muted/40 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Raw Score</p>
                <p className={`text-lg font-bold tabular-nums ${tier.text} mt-0.5`}>{score}</p>
              </div>
              <div className="rounded-md bg-muted/40 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Weight</p>
                <p className="text-lg font-bold tabular-nums text-foreground mt-0.5">{(weight * 100).toFixed(0)}%</p>
                <p className="text-[10px] text-muted-foreground">{weightPct.toFixed(0)}% of total</p>
              </div>
              <div className="rounded-md bg-muted/40 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Contribution</p>
                <p className="text-lg font-bold tabular-nums text-foreground mt-0.5">{Number(weighted).toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">to composite</p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
