import { useState } from "react";
import { Target, Swords, Wind, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { MagicCard } from "@/components/magicui/MagicCard";
import { BlurFade } from "@/components/magicui/BlurFade";
import { ReportMarkdownSection } from "@/components/project/ReportMarkdownSection";

interface ThesisValidation {
  id: string;
  claim: string;
  claim_source: string | null;
  validation_status: string;
  confidence: string;
  validation_detail: string | null;
  order_index: number | null;
}

interface Competitor {
  id: string;
  competitor_name: string;
  competitor_type: string;
  aum: string | null;
  strategy_description: string | null;
  differentiation_vs_fund: string | null;
  competitive_assessment: string | null;
  order_index: number | null;
}

interface MarketFactor {
  id: string;
  factor_type: string;
  title: string;
  description: string;
  confidence: string;
  time_horizon: string | null;
  supporting_data: string | null;
  order_index: number | null;
}

interface StrategyTabProps {
  thesisValidations: ThesisValidation[];
  competitors: Competitor[];
  marketFactors: MarketFactor[];
  reportSection?: { section_title: string | null; content: string | null } | undefined;
  reportMarkdown?: string | null;
}

const VALIDATION_ICONS: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  verified: { icon: CheckCircle2, color: "text-score-strong" },
  partially_verified: { icon: AlertTriangle, color: "text-severity-elevated" },
  unverified: { icon: AlertTriangle, color: "text-severity-monitor" },
  contradicted: { icon: XCircle, color: "text-severity-critical" },
};

const TYPE_COLORS: Record<string, string> = {
  direct: "bg-severity-critical/10 text-severity-critical",
  indirect: "bg-severity-elevated/10 text-severity-elevated",
  adjacent: "bg-muted text-muted-foreground",
};

export function StrategyTab({ thesisValidations, competitors, marketFactors, reportSection, reportMarkdown }: StrategyTabProps) {
  const hasMarkdown = !!reportMarkdown;
  const hasStructuredData = thesisValidations.length > 0 || competitors.length > 0 || marketFactors.length > 0;

  const [activeSection, setActiveSection] = useState<"report" | "thesis" | "competitors" | "market">(
    hasMarkdown ? "report" : "market"
  );

  const tailwinds = marketFactors.filter(f => f.factor_type === "tailwind");
  const headwinds = marketFactors.filter(f => f.factor_type === "headwind");

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-foreground">Strategy & Market</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Thesis validation, competitive landscape, and market dynamics.</p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        {hasMarkdown && (
          <button
            onClick={() => setActiveSection("report")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeSection === "report" ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Report
          </button>
        )}
        {hasStructuredData && (
          <>
            {[
              { key: "market", label: "Market Factors", count: marketFactors.length, icon: Wind },
              { key: "thesis", label: "Thesis Validation", count: thesisValidations.length, icon: Target },
              { key: "competitors", label: "Competitors", count: competitors.length, icon: Swords },
            ].map(s => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key as any)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeSection === s.key ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <s.icon className="h-3.5 w-3.5" /> {s.label} ({s.count})
              </button>
            ))}
          </>
        )}
      </div>

      {activeSection === "report" && (
        <ReportMarkdownSection content={reportMarkdown ?? null} />
      )}

      {activeSection === "thesis" && (
        <div className="space-y-3">
          {thesisValidations.length === 0 ? (
            <MagicCard><p className="text-sm text-muted-foreground text-center py-8">No thesis validation data yet.</p></MagicCard>
          ) : (
            thesisValidations.map((tv, i) => {
              const vi = VALIDATION_ICONS[tv.validation_status] || VALIDATION_ICONS.unverified;
              const Icon = vi.icon;
              return (
                <BlurFade key={tv.id} delay={i * 0.03}>
                  <MagicCard>
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${vi.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            tv.validation_status === 'verified' ? 'bg-score-strong/10 text-score-strong' :
                            tv.validation_status === 'contradicted' ? 'bg-severity-critical/10 text-severity-critical' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {tv.validation_status.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase">Confidence: {tv.confidence.replace('_', ' ')}</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{tv.claim}</p>
                        {tv.claim_source && <p className="text-[10px] text-muted-foreground mt-0.5">Source: {tv.claim_source}</p>}
                        {tv.validation_detail && (
                          <div className="mt-2 rounded-lg bg-muted/50 p-2.5">
                            <p className="text-xs text-muted-foreground">{tv.validation_detail}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </MagicCard>
                </BlurFade>
              );
            })
          )}
        </div>
      )}

      {activeSection === "competitors" && (
        <div className="space-y-3">
          {competitors.length === 0 ? (
            <MagicCard><p className="text-sm text-muted-foreground text-center py-8">No competitive landscape data yet.</p></MagicCard>
          ) : (
            competitors.map((c, i) => (
              <BlurFade key={c.id} delay={i * 0.03}>
                <MagicCard>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{c.competitor_name}</p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${TYPE_COLORS[c.competitor_type] || ''}`}>
                          {c.competitor_type}
                        </span>
                      </div>
                      {c.aum && <p className="text-xs text-muted-foreground mt-0.5">AUM: {c.aum}</p>}
                      {c.strategy_description && <p className="text-xs text-muted-foreground mt-1">{c.strategy_description}</p>}
                      {c.differentiation_vs_fund && (
                        <div className="mt-2 rounded-lg bg-muted/50 p-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Differentiation</p>
                          <p className="text-xs text-muted-foreground">{c.differentiation_vs_fund}</p>
                        </div>
                      )}
                      {c.competitive_assessment && (
                        <p className="text-[11px] text-muted-foreground mt-2 italic">{c.competitive_assessment}</p>
                      )}
                    </div>
                  </div>
                </MagicCard>
              </BlurFade>
            ))
          )}
        </div>
      )}

      {activeSection === "market" && (
        <div className="space-y-6">
          {reportSection?.content && !hasMarkdown && (
            <BlurFade>
              <MagicCard>
                <ReportMarkdownSection content={reportSection.content} />
              </MagicCard>
            </BlurFade>
          )}

          {marketFactors.length === 0 && !reportSection?.content ? (
            <MagicCard><p className="text-sm text-muted-foreground text-center py-8">No market factor data yet.</p></MagicCard>
          ) : (
            <>
              {tailwinds.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-score-strong" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-score-strong">Tailwinds</span>
                  </div>
                  <div className="space-y-3">
                    {tailwinds.map((f, i) => (
                      <BlurFade key={f.id} delay={i * 0.03}>
                        <MagicCard className="border-l-4 border-l-score-strong">
                          <p className="text-sm font-semibold text-foreground">{f.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{f.description}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {f.time_horizon && <span className="text-[10px] rounded-full border border-border px-2 py-0.5 text-muted-foreground">{f.time_horizon}</span>}
                            <span className="text-[10px] rounded-full border border-border px-2 py-0.5 text-muted-foreground uppercase">Confidence: {f.confidence.replace('_', ' ')}</span>
                          </div>
                          {f.supporting_data && <p className="text-[11px] text-muted-foreground mt-2 italic">"{f.supporting_data}"</p>}
                        </MagicCard>
                      </BlurFade>
                    ))}
                  </div>
                </div>
              )}
              {headwinds.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-severity-elevated" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-severity-elevated">Headwinds</span>
                  </div>
                  <div className="space-y-3">
                    {headwinds.map((f, i) => (
                      <BlurFade key={f.id} delay={i * 0.03}>
                        <MagicCard className="border-l-4 border-l-severity-elevated">
                          <p className="text-sm font-semibold text-foreground">{f.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{f.description}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {f.time_horizon && <span className="text-[10px] rounded-full border border-border px-2 py-0.5 text-muted-foreground">{f.time_horizon}</span>}
                            <span className="text-[10px] rounded-full border border-border px-2 py-0.5 text-muted-foreground uppercase">Confidence: {f.confidence.replace('_', ' ')}</span>
                          </div>
                          {f.supporting_data && <p className="text-[11px] text-muted-foreground mt-2 italic">"{f.supporting_data}"</p>}
                        </MagicCard>
                      </BlurFade>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
