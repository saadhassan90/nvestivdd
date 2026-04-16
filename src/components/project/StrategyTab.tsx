import { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, AlertCircle, ShieldCheck } from "lucide-react";
import { MagicCard } from "@/components/magicui/MagicCard";
import { BlurFade } from "@/components/magicui/BlurFade";
import { MarkdownSectionCards } from "@/components/project/MarkdownSectionCards";
import type { Tables } from "@/integrations/supabase/types";

interface StrategyTabProps {
  thesisValidations: Tables<"thesis_validations">[];
  competitors: Tables<"competitive_landscape">[];
  marketFactors: Tables<"market_factors">[];
  reportSection?: { section_title: string | null; content: string | null };
  reportMarkdown?: string | null;
  moduleScore?: number | null;
  fundName?: string;
}

const VALIDATION_ICON: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  verified: { icon: CheckCircle2, color: "text-score-strong" },
  partially_verified: { icon: AlertTriangle, color: "text-severity-elevated" },
  unverified: { icon: AlertCircle, color: "text-muted-foreground" },
  contradicted: { icon: XCircle, color: "text-severity-critical" },
};

const CONFIDENCE_BAR: Record<string, string> = {
  high: "bg-score-strong w-4/5",
  medium: "bg-severity-elevated w-3/5",
  low: "bg-severity-critical w-2/5",
};

type ViewTab = "thesis" | "market" | "competitors";

export function StrategyTab({
  thesisValidations,
  competitors,
  marketFactors,
  reportSection,
  reportMarkdown,
  moduleScore,
  fundName,
}: StrategyTabProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>("thesis");
  const tailwinds = marketFactors.filter((f) => f.factor_type === "tailwind");
  const headwinds = marketFactors.filter((f) => f.factor_type === "headwind");

  const tabs: { key: ViewTab; label: string }[] = [
    { key: "thesis", label: "Thesis" },
    { key: "market", label: "Market" },
    { key: "competitors", label: "Competitors" },
  ];

  const isEmpty =
    thesisValidations.length === 0 &&
    competitors.length === 0 &&
    marketFactors.length === 0 &&
    !reportMarkdown &&
    !reportSection?.content;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Header ── */}
      <BlurFade>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Strategy & Thesis
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {fundName ? `Due Diligence Ledger · ${fundName}` : "Investment thesis validation, competitive landscape, and market dynamics."}
            </p>
          </div>
          {moduleScore != null && (
            <div className="shrink-0 flex flex-col items-center">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Score</span>
                <span className={`text-lg font-bold ${
                  moduleScore >= 85 ? "text-score-strong" : moduleScore >= 70 ? "text-score-advance" : moduleScore >= 50 ? "text-score-review" : "text-severity-critical"
                }`}>{moduleScore}</span>
              </div>
            </div>
          )}
        </div>
      </BlurFade>

      {/* ── Tabs ── */}
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

      {/* ═══ THESIS TAB ═══ */}
      {activeTab === "thesis" && (
        <>
          {reportMarkdown && <MarkdownSectionCards content={reportMarkdown} baseDelay={0.05} />}
          {!reportMarkdown && reportSection?.content && (
            <MarkdownSectionCards content={reportSection.content} baseDelay={0.05} />
          )}

          {thesisValidations.length > 0 && (
            <BlurFade delay={0.1}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Strategic Pillars
                </p>
                <MagicCard>
                  <div className="space-y-3">
                    {thesisValidations.map((tv) => {
                      const vi = VALIDATION_ICON[tv.validation_status] || VALIDATION_ICON.unverified;
                      const Icon = vi.icon;
                      return (
                        <div key={tv.id} className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${vi.color}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground leading-relaxed">{tv.claim}</p>
                            {tv.validation_detail && (
                              <p className="text-xs text-muted-foreground mt-1 italic">{tv.validation_detail}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </MagicCard>
              </div>
            </BlurFade>
          )}

          {thesisValidations.length === 0 && !reportMarkdown && !reportSection?.content && (
            <BlurFade>
              <MagicCard>
                <div className="text-center py-12">
                  <ShieldCheck className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No thesis data available yet.</p>
                </div>
              </MagicCard>
            </BlurFade>
          )}
        </>
      )}

      {/* ═══ MARKET TAB ═══ */}
      {activeTab === "market" && (
        <>
          {marketFactors.length > 0 && (
            <BlurFade delay={0.05}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {marketFactors.slice(0, 4).map((f) => {
                  const barClass = CONFIDENCE_BAR[f.confidence] || "bg-muted w-1/2";
                  return (
                    <MagicCard key={f.id} className="!p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {f.title}
                      </p>
                      <p className="text-lg sm:text-xl font-bold text-foreground mt-1">
                        {f.supporting_data || f.description.split(".")[0]}
                      </p>
                      <div className="h-1 rounded-full bg-muted mt-2">
                        <div className={`h-full rounded-full ${barClass}`} />
                      </div>
                      {f.time_horizon && (
                        <p className="text-[10px] text-muted-foreground mt-1">↗ {f.time_horizon}</p>
                      )}
                    </MagicCard>
                  );
                })}
              </div>
            </BlurFade>
          )}

          {(tailwinds.length > 0 || headwinds.length > 0) && (
            <BlurFade delay={0.1}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tailwinds.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-score-strong" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-score-strong">
                        Tailwinds ({tailwinds.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {tailwinds.map((f) => (
                        <div key={f.id} className="rounded-lg border-l-2 border-l-score-strong border border-border p-3">
                          <p className="text-sm font-medium text-foreground">{f.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {f.time_horizon && (
                              <span className="text-[10px] rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                                {f.time_horizon}
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground uppercase">{f.confidence} confidence</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {headwinds.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-severity-elevated" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-severity-elevated">
                        Headwinds ({headwinds.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {headwinds.map((f) => (
                        <div key={f.id} className="rounded-lg border-l-2 border-l-severity-elevated border border-border p-3">
                          <p className="text-sm font-medium text-foreground">{f.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {f.time_horizon && (
                              <span className="text-[10px] rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                                {f.time_horizon}
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground uppercase">{f.confidence} confidence</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </BlurFade>
          )}

          {marketFactors.length === 0 && (
            <BlurFade>
              <MagicCard>
                <div className="text-center py-12">
                  <ShieldCheck className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No market data available yet.</p>
                </div>
              </MagicCard>
            </BlurFade>
          )}
        </>
      )}

      {/* ═══ COMPETITORS TAB ═══ */}
      {activeTab === "competitors" && (
        <>
          {competitors.length > 0 ? (
            <BlurFade delay={0.05}>
              <div>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 pr-4">Competitor</th>
                        <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 px-4">Type</th>
                        <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 px-4">AUM</th>
                        <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 pl-4">Differentiation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {competitors.map((c) => (
                        <tr key={c.id} className="border-b border-border/50 last:border-0 align-top">
                          <td className="py-3 pr-4">
                            <p className="font-medium text-foreground text-sm">{c.competitor_name}</p>
                            {c.strategy_description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.strategy_description}</p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              c.competitor_type === "direct"
                                ? "bg-severity-critical/10 text-severity-critical"
                                : c.competitor_type === "indirect"
                                ? "bg-severity-elevated/10 text-severity-elevated"
                                : "bg-muted text-muted-foreground"
                            }`}>{c.competitor_type}</span>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{c.aum || "—"}</td>
                          <td className="py-3 pl-4 text-xs text-muted-foreground max-w-xs">{c.differentiation_vs_fund || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden space-y-3">
                  {competitors.map((c) => (
                    <MagicCard key={c.id}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground">{c.competitor_name}</p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                          c.competitor_type === "direct"
                            ? "bg-severity-critical/10 text-severity-critical"
                            : "bg-muted text-muted-foreground"
                        }`}>{c.competitor_type}</span>
                      </div>
                      {c.aum && <p className="text-xs text-muted-foreground">AUM: {c.aum}</p>}
                      {c.differentiation_vs_fund && (
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{c.differentiation_vs_fund}</p>
                      )}
                    </MagicCard>
                  ))}
                </div>
              </div>
            </BlurFade>
          ) : (
            <BlurFade>
              <MagicCard>
                <div className="text-center py-12">
                  <ShieldCheck className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No competitor data available yet.</p>
                </div>
              </MagicCard>
            </BlurFade>
          )}
        </>
      )}
    </div>
  );
}
