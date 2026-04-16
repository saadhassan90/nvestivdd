import { useState } from "react";
import { TrendingUp, DollarSign, AlertTriangle } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";
import { MagicCard } from "@/components/magicui/MagicCard";
import { MarkdownSectionCards } from "@/components/project/MarkdownSectionCards";
import type { Tables } from "@/integrations/supabase/types";

interface PerformanceTabProps {
  metrics: Tables<"performance_metrics">[];
  fees: Tables<"fee_structure">[];
  engagementCaseStudies: Tables<"engagement_case_studies">[];
  performanceWriteup?: { section_title: string | null; content: string | null };
  feesWriteup?: { section_title: string | null; content: string | null };
  reportMarkdown?: string | null;
  moduleScore?: number | null;
}

const ASSESSMENT_COLORS: Record<string, string> = {
  favorable: "text-score-strong bg-score-strong/10",
  at_market: "text-muted-foreground bg-muted",
  below_market: "text-score-strong bg-score-strong/10",
  above_market: "text-severity-elevated bg-severity-elevated/10",
  not_disclosed: "text-severity-critical bg-severity-critical/10",
  critical_gap: "text-severity-critical bg-severity-critical/10",
};

const VERIFICATION_DOT: Record<string, { color: string; label: string }> = {
  verified: { color: "bg-score-strong", label: "Verified" },
  flagged: { color: "bg-severity-elevated", label: "Flagged" },
  unverified: { color: "bg-severity-elevated", label: "Unverified" },
  positive: { color: "bg-score-strong", label: "Positive" },
  mixed: { color: "bg-severity-elevated", label: "Mixed" },
  negative: { color: "bg-severity-critical", label: "Negative" },
};

type ViewTab = "performance" | "fees";

export function PerformanceTab({
  metrics,
  fees,
  engagementCaseStudies,
  performanceWriteup,
  reportMarkdown,
  moduleScore,
}: PerformanceTabProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>("performance");

  const headlineMetrics = metrics.filter(
    (m) => m.metric_category === "return" && /irr|tvpi|dpi|moic/i.test(m.metric_name)
  ).slice(0, 4);

  const CATEGORY_LABELS: Record<string, string> = {
    return: "Returns",
    risk: "Risk Metrics",
    portfolio_characteristic: "Portfolio Characteristics",
  };

  const nonHeadlineMetrics = metrics.filter((m) => !headlineMetrics.includes(m));
  const metricsByCategory: Record<string, Tables<"performance_metrics">[]> = {};
  nonHeadlineMetrics.forEach((m) => {
    if (!metricsByCategory[m.metric_category]) metricsByCategory[m.metric_category] = [];
    metricsByCategory[m.metric_category].push(m);
  });

  const feesByClass: Record<string, Tables<"fee_structure">[]> = {};
  fees.forEach((f) => {
    if (!feesByClass[f.share_class]) feesByClass[f.share_class] = [];
    feesByClass[f.share_class].push(f);
  });

  const exits = [...engagementCaseStudies].sort((a, b) => (a.order_index ?? 99) - (b.order_index ?? 99));

  const tabs: { key: ViewTab; label: string }[] = [
    { key: "performance", label: "Performance" },
    { key: "fees", label: "Fee Structure" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <BlurFade>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Performance & Track Record
            </h2>
          </div>
          {moduleScore != null && (
            <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card">
              <span className={`text-sm font-bold ${
                moduleScore >= 85 ? "text-score-strong" : moduleScore >= 70 ? "text-score-advance" : moduleScore >= 50 ? "text-score-review" : "text-severity-critical"
              }`}>{moduleScore}</span>
            </div>
          )}
        </div>
      </BlurFade>

      {/* Tabs */}
      <BlurFade delay={0.03}>
        <div className="flex items-center gap-2 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`relative pb-2.5 px-1 text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {activeTab === t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
              )}
            </button>
          ))}
        </div>
      </BlurFade>

      {/* ═══ PERFORMANCE VIEW ═══ */}
      {activeTab === "performance" && (
        <>
          {headlineMetrics.length > 0 && (
            <BlurFade delay={0.05}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {headlineMetrics.map((m) => (
                  <div key={m.id} className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{m.metric_name}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{m.value}</p>
                  </div>
                ))}
              </div>
            </BlurFade>
          )}

          {reportMarkdown && <MarkdownSectionCards content={reportMarkdown} baseDelay={0.1} />}
          {!reportMarkdown && performanceWriteup?.content && (
            <MarkdownSectionCards content={performanceWriteup.content} baseDelay={0.1} />
          )}

          {exits.some((e) => e.assessment_rating === "flagged" || e.outcome_status === "unverified") && (
            <BlurFade delay={0.15}>
              <div className="flex items-start gap-3 rounded-xl border border-severity-elevated/30 bg-severity-elevated/5 p-4">
                <AlertTriangle className="h-5 w-5 text-severity-elevated shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-severity-elevated">Verification Gap</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Some assets have not been corroborated by public filings or secondary market audit logs.
                  </p>
                </div>
              </div>
            </BlurFade>
          )}

          {Object.entries(metricsByCategory).length > 0 && (
            <div className="space-y-4">
              {Object.entries(metricsByCategory).map(([cat, catMetrics]) => (
                <BlurFade key={cat} delay={0.15}>
                  <MagicCard>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      {CATEGORY_LABELS[cat] || cat}
                    </p>
                    <div className="overflow-x-auto -mx-4 sm:-mx-5">
                      <table className="w-full text-sm min-w-[500px]">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 px-4 sm:px-5">Metric</th>
                            <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 px-4">Fund</th>
                            <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 px-4">Benchmark</th>
                            <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 px-4 sm:px-5">Alpha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {catMetrics.map((m) => (
                            <tr key={m.id} className="border-b border-border/50 last:border-0">
                              <td className="py-2.5 px-4 sm:px-5">
                                <p className="font-medium text-foreground text-xs">{m.metric_name}</p>
                                {m.as_of_date && <p className="text-[10px] text-muted-foreground">as of {m.as_of_date}</p>}
                              </td>
                              <td className="text-right py-2.5 px-4 font-semibold text-foreground text-xs">{m.value}</td>
                              <td className="text-right py-2.5 px-4 text-xs text-muted-foreground">
                                {m.benchmark_value || "—"}
                                {m.benchmark_name && <span className="block text-[9px]">{m.benchmark_name}</span>}
                              </td>
                              <td className={`text-right py-2.5 px-4 sm:px-5 text-xs font-semibold ${
                                m.alpha?.startsWith("+") ? "text-score-strong" : m.alpha?.startsWith("-") ? "text-severity-critical" : "text-muted-foreground"
                              }`}>{m.alpha || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </MagicCard>
                </BlurFade>
              ))}
            </div>
          )}

          {exits.length > 0 && (
            <BlurFade delay={0.2}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold uppercase tracking-wider text-foreground">Realized Exits</p>
                  <span className="text-xs text-muted-foreground">{exits.length} Items</span>
                </div>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 pr-4">Portfolio Company</th>
                        <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 px-4">Exit Multiple</th>
                        <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 px-4">Exit Year</th>
                        <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 pl-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exits.map((e) => {
                        const rating = e.assessment_rating || e.outcome_status || "verified";
                        const dot = VERIFICATION_DOT[rating] || VERIFICATION_DOT.verified;
                        const outcomes = e.engagement_outcomes as Record<string, any> | null;
                        const exitYear = outcomes?.exit_year || outcomes?.year || "—";
                        const exitMultiple = outcomes?.exit_multiple || outcomes?.moic || "—";
                        return (
                          <tr key={e.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="py-3 pr-4">
                              <p className="font-medium text-foreground text-sm">{e.company_name}</p>
                              <p className="text-xs text-muted-foreground">{e.sector || "—"}</p>
                            </td>
                            <td className="text-right py-3 px-4 font-semibold text-score-strong text-sm">{exitMultiple}</td>
                            <td className="text-right py-3 px-4 text-sm text-muted-foreground">{exitYear}</td>
                            <td className="text-center py-3 pl-4">
                              <span className={`inline-block h-2.5 w-2.5 rounded-full ${dot.color}`} title={dot.label} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="sm:hidden space-y-3">
                  {exits.map((e) => {
                    const outcomes = e.engagement_outcomes as Record<string, any> | null;
                    const exitMultiple = outcomes?.exit_multiple || outcomes?.moic || "—";
                    const exitYear = outcomes?.exit_year || outcomes?.year || "—";
                    return (
                      <MagicCard key={e.id}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm">{e.company_name}</p>
                            <p className="text-xs text-muted-foreground">{e.sector || "—"}</p>
                          </div>
                          <span className="text-sm font-bold text-score-strong shrink-0">{exitMultiple}</span>
                        </div>
                        <div className="flex items-center gap-6 mt-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Exit Date</p>
                            <p className="text-xs font-medium text-foreground">{exitYear}</p>
                          </div>
                        </div>
                      </MagicCard>
                    );
                  })}
                </div>
              </div>
            </BlurFade>
          )}

          {metrics.length === 0 && exits.length === 0 && !reportMarkdown && (
            <BlurFade>
              <MagicCard>
                <div className="text-center py-12">
                  <TrendingUp className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No performance data available yet.</p>
                </div>
              </MagicCard>
            </BlurFade>
          )}
        </>
      )}

      {/* ═══ FEES VIEW ═══ */}
      {activeTab === "fees" && (
        <>
          {fees.length > 0 ? (
            <BlurFade delay={0.05}>
              <div className="space-y-4">
                {Object.entries(feesByClass).map(([cls, classItems]) => (
                  <MagicCard key={cls}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">{cls}</p>
                    <div className="space-y-3">
                      {classItems.map((fee) => (
                        <div key={fee.id} className="flex items-start justify-between gap-3 py-2 border-b border-border/50 last:border-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground">{fee.component}</p>
                            <p className="text-sm font-semibold text-foreground mt-0.5">
                              {fee.is_disclosed ? fee.value : <span className="text-severity-critical italic">Not Disclosed</span>}
                            </p>
                            {fee.asset_class_norm && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">Norm: {fee.asset_class_norm}</p>
                            )}
                            {fee.assessment_detail && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">{fee.assessment_detail}</p>
                            )}
                          </div>
                          {fee.assessment && (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${ASSESSMENT_COLORS[fee.assessment] || "text-muted-foreground bg-muted"}`}>
                              {fee.assessment.replace("_", " ")}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </MagicCard>
                ))}
              </div>
            </BlurFade>
          ) : (
            <BlurFade>
              <MagicCard>
                <div className="text-center py-12">
                  <DollarSign className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No fee data available yet.</p>
                </div>
              </MagicCard>
            </BlurFade>
          )}
        </>
      )}
    </div>
  );
}
