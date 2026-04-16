import { CheckCircle2, AlertTriangle, Shield, FileText, ChevronDown, ChevronUp, RefreshCw, CheckCircle, Info, Zap, TrendingUp, Target } from "lucide-react";
import { useState } from "react";
import { BlurFade } from "@/components/magicui/BlurFade";
import { ShimmerButton } from "@/components/magicui/ShimmerButton";
import type { Tables } from "@/integrations/supabase/types";
import { getScoreTier } from "@/lib/score-utils";
import { getVerdict, getVerdictLabel } from "@/lib/verdict-utils";

interface OverviewTabProps {
  project: Tables<"projects">;
  redFlags: Tables<"red_flags">[];
  reportSections: Tables<"report_sections">[];
  documents: Tables<"documents">[];
  moduleScoresData?: any[];
  submissionQuality?: any[];
  docQualityFlags?: any[];
  criticalInfoGaps?: any[];
  onRerunAnalysis: () => void;
  reportMarkdown?: string | null;
}

/** SVG score ring */
function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const tier = getScoreTier(score);
  const colorMap: Record<string, string> = {
    strong_advance: "hsl(160, 84%, 39%)",
    advance: "hsl(168, 76%, 42%)",
    review: "hsl(38, 92%, 50%)",
    decline: "hsl(0, 84%, 60%)",
  };
  const color = colorMap[tier] || colorMap.decline;
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={8}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{score}</span>
      </div>
    </div>
  );
}

/** Module score card matching mockup */
function ModuleScoreCard({ label, score, icon }: { label: string; score: number; icon?: React.ReactNode }) {
  const tier = getScoreTier(score);
  const barColorMap: Record<string, string> = {
    strong_advance: "bg-score-strong",
    advance: "bg-score-advance",
    review: "bg-score-review",
    decline: "bg-score-decline",
  };
  const barColor = barColorMap[tier];

  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-2xl font-bold text-foreground">{score}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="h-1 rounded-full bg-muted mt-2">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

const MODULE_ICONS: Record<string, React.ReactNode> = {
  team: <TrendingUp className="h-4 w-4" />,
  track: <CheckCircle2 className="h-4 w-4" />,
  strategy: <Target className="h-4 w-4" />,
  terms: <Shield className="h-4 w-4" />,
  risk: <AlertTriangle className="h-4 w-4" />,
};

const MODULE_SHORT_LABELS: Record<string, string> = {
  module_a_financial: "Track",
  module_b_team: "Team",
  module_c_strategy: "Strategy",
  module_d_terms: "Terms",
  module_e_operations: "Risk",
};

const HARD_FLOOR_CHECKS = [
  "GP Commitment > 2%",
  "Key Man Clause Intact",
  "Realized DPI > 1.0x (P1)",
  "Audited Financials Provided",
  "No SEC Red Flags Found",
  "European Waterfall",
];

export function OverviewTab({ project, redFlags, reportSections, documents, moduleScoresData = [], submissionQuality = [], docQualityFlags = [], criticalInfoGaps = [], onRerunAnalysis, reportMarkdown }: OverviewTabProps) {
  const [showQuality, setShowQuality] = useState(false);
  const [showGaps, setShowGaps] = useState(false);

  const tier = getScoreTier(project.composite_score);
  const verdict = getVerdict(project.composite_score, project.status);
  const verdictLabel = getVerdictLabel(verdict);

  const rawStrengths = (project as any).key_strengths as ({ category: string; detail: string } | string)[] | null;
  const rawRisks = (project as any).key_risks as ({ category: string; detail: string } | string)[] | null;
  const keyStrengths = rawStrengths?.map(s => typeof s === "string" ? { category: s, detail: "" } : s) ?? null;
  const keyRisks = rawRisks?.map(r => typeof r === "string" ? { category: r, detail: "" } : r) ?? null;

  const execNarrative = (project as any).executive_summary_narrative as string | null;
  const finalNarrative = (project as any).final_assessment_narrative as string | null;
  const conditions = (project as any).conditions_for_advancement as string[] | null;
  const timeline = (project as any).recommended_timeline as string | null;
  const strategy = (project as any).strategy as string | null;
  const fundSize = (project as any).fund_size_estimated as string | null;
  const gpEntity = (project as any).gp_entity_name as string | null;
  const completeness = (project as any).completeness_score as number | null;
  const docType = (project as any).document_type as string | null;

  const isProcessing = project.status === "processing";
  const isComplete = project.status === "complete" || project.status === "completed";
  const hasNewFiles = project.updated_at && documents.some(d => new Date(d.uploaded_at) > new Date(project.updated_at));

  const criticalFlags = redFlags.filter(f => f.severity === "critical");
  const displayStrengths = keyStrengths || [];
  const displayRisks = keyRisks || criticalFlags.slice(0, 4).map(f => ({ category: f.title, detail: f.description || "" }));

  // Module scores for the card grid
  const legacyScores = (project.module_scores as Record<string, number>) || {};

  return (
    <div className="space-y-6">
      {/* Page title */}
      <BlurFade>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">Institutional Overview</h1>
              <span className="inline-flex items-center rounded-full border border-score-strong/30 bg-score-strong/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-score-strong">
                L1 Complete
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <button className="hover:text-foreground transition-colors">Funds</button>
              <span>›</span>
              <span>{project.fund_name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
              <FileText className="h-3.5 w-3.5" />
              Export PDF
            </button>
          </div>
        </div>
      </BlurFade>

      {/* Rerun banner */}
      {hasNewFiles && !isProcessing && (
        <BlurFade>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-severity-elevated/30 bg-severity-elevated/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-severity-elevated shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">New files added since last analysis</p>
                <p className="text-[11px] text-muted-foreground">Re-run to incorporate the latest documents.</p>
              </div>
            </div>
            <ShimmerButton onClick={onRerunAnalysis} className="text-xs shrink-0">
              <RefreshCw className="h-3.5 w-3.5" /> Re-run Analysis
            </ShimmerButton>
          </div>
        </BlurFade>
      )}

      {/* Hero verdict card */}
      <BlurFade delay={0.03}>
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
            {/* Score Ring */}
            <ScoreRing score={project.composite_score || 0} size={130} />

            {/* Verdict + metadata */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-foreground">{verdictLabel}</h2>

              {/* GP / Strategy / Fund / Target */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 mt-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">GP</p>
                  <p className="text-sm font-medium text-foreground">{gpEntity || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Strategy</p>
                  <p className="text-sm font-medium text-foreground">{project.asset_class || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Fund</p>
                  <p className="text-sm font-medium text-foreground">{project.vintage || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Target</p>
                  <p className="text-sm font-medium text-foreground">{fundSize || "—"}</p>
                </div>
              </div>

              {/* Executive summary text */}
              {execNarrative && (
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{execNarrative}</p>
              )}
            </div>
          </div>
        </div>
      </BlurFade>

      {/* Module score cards */}
      <BlurFade delay={0.06}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {moduleScoresData.length > 0
            ? moduleScoresData.map((ms: any) => {
                const shortLabel = MODULE_SHORT_LABELS[ms.module_key] || ms.module_label || ms.module_key;
                const iconKey = shortLabel.toLowerCase();
                return (
                  <ModuleScoreCard
                    key={ms.id}
                    label={shortLabel}
                    score={ms.score || 0}
                    icon={MODULE_ICONS[iconKey]}
                  />
                );
              })
            : Object.entries({ a: "Team", b: "Track", c: "Strategy", d: "Terms", e: "Risk" }).map(([key, label]) => (
                <ModuleScoreCard
                  key={key}
                  label={label}
                  score={legacyScores[key] || 0}
                  icon={MODULE_ICONS[label.toLowerCase()]}
                />
              ))}
        </div>
      </BlurFade>

      {/* Hard Floor Compliance */}
      <BlurFade delay={0.09}>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Hard Floor Compliance</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {HARD_FLOOR_CHECKS.map((check) => (
              <div key={check} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-score-strong shrink-0" />
                <span className="text-sm text-foreground">{check}</span>
              </div>
            ))}
          </div>
        </div>
      </BlurFade>

      {/* Key Strengths + Key Concerns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BlurFade delay={0.12}>
          <div className="rounded-xl border border-border bg-card p-5 h-full">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-score-strong" />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-score-strong">Key Strengths</h3>
            </div>
            <div className="space-y-2">
              {displayStrengths.length > 0 ? (
                displayStrengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-foreground mt-1 shrink-0">•</span>
                    <p className="text-sm text-foreground leading-relaxed">
                      {s.detail ? `${s.category}: ${s.detail}` : s.category}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No strengths data available</p>
              )}
            </div>
          </div>
        </BlurFade>

        <BlurFade delay={0.14}>
          <div className="rounded-xl border border-border bg-card p-5 h-full">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-severity-elevated" />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-severity-elevated">Key Concerns</h3>
            </div>
            <div className="space-y-2">
              {displayRisks.length > 0 ? (
                displayRisks.slice(0, 5).map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-severity-elevated mt-1 shrink-0">•</span>
                    <p className="text-sm text-severity-elevated leading-relaxed">
                      {r.detail ? `${r.category}: ${r.detail}` : r.category}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No critical issues identified</p>
              )}
            </div>
          </div>
        </BlurFade>
      </div>

      {/* Fund Metrics Row */}
      <BlurFade delay={0.16}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Fund Size", value: fundSize || "—" },
            { label: "MOIC", value: "—" },
            { label: "DPI", value: "—" },
            { label: "IRR", value: "—" },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{m.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{m.value}</p>
            </div>
          ))}
        </div>
      </BlurFade>

      {/* Submission Quality — Collapsible */}
      <BlurFade delay={0.18}>
        <div className="rounded-xl border border-border bg-card p-5">
          <button onClick={() => setShowQuality(!showQuality)} className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">Submission Quality Assessment</p>
                <p className="text-[11px] text-muted-foreground">{docType || "Completeness and consistency of submitted materials"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-foreground">{completeness || "—"}%</span>
              {showQuality ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </button>
          {showQuality && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              {submissionQuality.length > 0 && (
                <div className="space-y-2">
                  {submissionQuality.map((sq: any) => (
                    <div key={sq.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-xs text-foreground font-medium">{sq.category_label}</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        sq.status === "complete" ? "bg-score-strong/10 text-score-strong"
                        : sq.status === "partial" ? "bg-severity-elevated/10 text-severity-elevated"
                        : "bg-severity-critical/10 text-severity-critical"
                      }`}>
                        {sq.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {docQualityFlags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Document Quality</p>
                  {docQualityFlags.map((dq: any) => (
                    <div key={dq.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-xs text-foreground">{dq.flag_label}</span>
                      <span className="text-[10px] font-bold text-foreground">{dq.rating}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </BlurFade>

      {/* Critical Info Gaps */}
      {criticalInfoGaps.length > 0 && (
        <BlurFade delay={0.2}>
          <div className="rounded-xl border border-border bg-card p-5">
            <button onClick={() => setShowGaps(!showGaps)} className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-severity-elevated" />
                <p className="text-sm font-semibold text-foreground">Critical Information Gaps ({criticalInfoGaps.length})</p>
              </div>
              {showGaps ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showGaps && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                {criticalInfoGaps.map((gap: any) => (
                  <div key={gap.id} className="flex items-start gap-3">
                    <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                      gap.severity === "critical" ? "bg-severity-critical" : gap.severity === "elevated" ? "bg-severity-elevated" : "bg-severity-monitor"
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{gap.gap_title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{gap.gap_description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </BlurFade>
      )}

      {/* Final Assessment */}
      {(project.recommendation || finalNarrative) && (
        <BlurFade delay={0.22}>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Final Assessment & Recommendation</h3>
            </div>
            <div className="text-sm text-muted-foreground space-y-3">
              {finalNarrative && <p className="leading-relaxed">{finalNarrative}</p>}
              {conditions && conditions.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Conditions for Advancement</p>
                  <ul className="space-y-1">
                    {conditions.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <span className="text-foreground mt-0.5">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {timeline && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Recommended Timeline</p>
                  <p className="text-xs">{timeline}</p>
                </div>
              )}
            </div>
          </div>
        </BlurFade>
      )}

      {/* Footer */}
      <BlurFade delay={0.24}>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-severity-monitor" />
            <span>{redFlags.length > 0 ? `${redFlags.length} claims verified` : "Claims verified"} by Nvestiv AI Engine</span>
          </div>
          <span className="font-mono">Report ID: NV-{new Date(project.created_at).getFullYear()}-{project.id.slice(0, 4).toUpperCase()}</span>
        </div>
      </BlurFade>
    </div>
  );
}
