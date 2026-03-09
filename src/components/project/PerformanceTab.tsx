import { useState } from "react";
import { TrendingUp, DollarSign } from "lucide-react";
import { MagicCard } from "@/components/magicui/MagicCard";
import { BlurFade } from "@/components/magicui/BlurFade";
import { MarkdownContent } from "@/components/project/MarkdownContent";

interface PerformanceMetric {
  id: string;
  fund_name: string;
  metric_name: string;
  metric_category: string;
  value: string;
  value_numeric: number | null;
  benchmark_name: string | null;
  benchmark_value: string | null;
  alpha: string | null;
  as_of_date: string | null;
  order_index: number | null;
}

interface FeeItem {
  id: string;
  share_class: string;
  component: string;
  value: string;
  asset_class_norm: string | null;
  assessment: string | null;
  assessment_detail: string | null;
  is_disclosed: boolean;
  order_index: number | null;
}

interface PerformanceTabProps {
  metrics: PerformanceMetric[];
  fees: FeeItem[];
  reportSections?: { section_title: string | null; content: string | null; section_key: string }[];
}

const CATEGORY_LABELS: Record<string, string> = {
  return: "Returns",
  risk: "Risk Metrics",
  portfolio_characteristic: "Portfolio Characteristics",
  fee: "Fee Metrics",
};

const ASSESSMENT_COLORS: Record<string, string> = {
  favorable: "text-score-strong bg-score-strong/10",
  at_market: "text-muted-foreground bg-muted",
  below_market: "text-score-strong bg-score-strong/10",
  above_market: "text-severity-elevated bg-severity-elevated/10",
  not_disclosed: "text-severity-critical bg-severity-critical/10",
  critical_gap: "text-severity-critical bg-severity-critical/10",
};

export function PerformanceTab({ metrics, fees }: PerformanceTabProps) {
  const [activeSection, setActiveSection] = useState<"performance" | "fees">("performance");
  // Group metrics by category
  const metricsByCategory: Record<string, PerformanceMetric[]> = {};
  metrics.forEach(m => {
    if (!metricsByCategory[m.metric_category]) metricsByCategory[m.metric_category] = [];
    metricsByCategory[m.metric_category].push(m);
  });

  // Group fees by share class
  const feesByClass: Record<string, FeeItem[]> = {};
  fees.forEach(f => {
    if (!feesByClass[f.share_class]) feesByClass[f.share_class] = [];
    feesByClass[f.share_class].push(f);
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <BlurFade>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground">Performance & Fees</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Track record metrics, benchmarking, and fee structure analysis.</p>
        </div>
      </BlurFade>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveSection("performance")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            activeSection === "performance" ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Performance ({metrics.length})</span>
        </button>
        <button
          onClick={() => setActiveSection("fees")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            activeSection === "fees" ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Fee Structure ({fees.length})</span>
        </button>
      </div>

      {activeSection === "performance" && (
        <div className="space-y-6">
          {metrics.length === 0 ? (
            <MagicCard>
              <p className="text-sm text-muted-foreground text-center py-8">No performance data available yet.</p>
            </MagicCard>
          ) : (
            Object.entries(metricsByCategory).map(([cat, catMetrics]) => (
              <BlurFade key={cat}>
                <MagicCard>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    {CATEGORY_LABELS[cat] || cat}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 pr-4">Metric</th>
                          <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 pr-4">Fund</th>
                          <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 pr-4">Benchmark</th>
                          <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2">Alpha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catMetrics.map(m => (
                          <tr key={m.id} className="border-b border-border/50 last:border-0">
                            <td className="py-2 pr-4">
                              <p className="font-medium text-foreground text-xs">{m.metric_name}</p>
                              {m.as_of_date && <p className="text-[10px] text-muted-foreground">as of {m.as_of_date}</p>}
                            </td>
                            <td className="text-right py-2 pr-4 font-semibold text-foreground text-xs">{m.value}</td>
                            <td className="text-right py-2 pr-4 text-xs text-muted-foreground">
                              {m.benchmark_value || '—'}
                              {m.benchmark_name && <span className="block text-[9px]">{m.benchmark_name}</span>}
                            </td>
                            <td className={`text-right py-2 text-xs font-semibold ${
                              m.alpha?.startsWith('+') ? 'text-score-strong' : m.alpha?.startsWith('-') ? 'text-severity-critical' : 'text-muted-foreground'
                            }`}>
                              {m.alpha || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </MagicCard>
              </BlurFade>
            ))
          )}
        </div>
      )}

      {activeSection === "fees" && (
        <div className="space-y-6">
          {fees.length === 0 ? (
            <MagicCard>
              <p className="text-sm text-muted-foreground text-center py-8">No fee structure data available yet.</p>
            </MagicCard>
          ) : (
            Object.entries(feesByClass).map(([cls, classItems]) => (
              <BlurFade key={cls}>
                <MagicCard>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">{cls}</p>
                  <div className="space-y-3">
                    {classItems.map(fee => (
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
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${ASSESSMENT_COLORS[fee.assessment] || 'text-muted-foreground bg-muted'}`}>
                            {fee.assessment.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </MagicCard>
              </BlurFade>
            ))
          )}
        </div>
      )}

      {/* Full Report Sections */}
      {reportSections.filter(s => s.content).map(rs => (
        <BlurFade key={rs.section_key} delay={0.1}>
          <MagicCard>
            <button onClick={() => setShowReport(!showReport)} className="flex items-center justify-between w-full">
              <p className="text-sm font-semibold text-foreground">{rs.section_title || 'Full Analysis Report'}</p>
              {showReport ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showReport && (
              <div className="mt-4 pt-4 border-t border-border">
                <MarkdownContent content={rs.content!} />
              </div>
            )}
          </MagicCard>
        </BlurFade>
      ))}
    </div>
  );
}
