import { CheckCircle2, AlertTriangle, Shield, FileText, ChevronDown, ChevronUp, RefreshCw, CheckCircle, Info } from "lucide-react";
import { useState } from "react";
import { MagicCard } from "@/components/magicui/MagicCard";
import { BlurFade } from "@/components/magicui/BlurFade";
import { ShimmerButton } from "@/components/magicui/ShimmerButton";
import { ScoreBadge } from "@/components/dashboard/ScoreBadge";
import type { Tables } from "@/integrations/supabase/types";
import { getScoreTier, getScoreColor, formatRelativeTime } from "@/lib/score-utils";

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

export function OverviewTab({ project, redFlags, reportSections, documents, moduleScoresData = [], submissionQuality = [], docQualityFlags = [], criticalInfoGaps = [], onRerunAnalysis, reportMarkdown }: OverviewTabProps) {
  const [showQuality, setShowQuality] = useState(false);
  const [showGaps, setShowGaps] = useState(false);
  const criticalFlags = redFlags.filter(f => f.severity === 'critical');
  const elevatedFlags = redFlags.filter(f => f.severity === 'elevated');
  const monitorFlags = redFlags.filter(f => f.severity === 'monitor');

  const tier = getScoreTier(project.composite_score);
  const tierColor = getScoreColor(tier);

  // Use structured key_strengths/key_risks if available, else parse from markdown
  // Data may be { category, detail }[] or plain string[]
  const rawStrengths = (project as any).key_strengths as ({ category: string; detail: string } | string)[] | null;
  const rawRisks = (project as any).key_risks as ({ category: string; detail: string } | string)[] | null;
  const keyStrengths = rawStrengths?.map(s =>
    typeof s === 'string' ? { category: s, detail: '' } : s
  ) ?? null;
  const keyRisks = rawRisks?.map(r =>
    typeof r === 'string' ? { category: r, detail: '' } : r
  ) ?? null;
  const execNarrative = (project as any).executive_summary_narrative as string | null;
  const finalNarrative = (project as any).final_assessment_narrative as string | null;
  const conditions = (project as any).conditions_for_advancement as string[] | null;
  const timeline = (project as any).recommended_timeline as string | null;
  const marketValidation = (project as any).market_validation_points as { point: string }[] | null;

  // Fund metadata
  const strategy = (project as any).strategy as string | null;
  const fundSize = (project as any).fund_size_estimated as string | null;
  const gpEntity = (project as any).gp_entity_name as string | null;
  const domicile = (project as any).domicile as string | null;
  const regulatory = (project as any).regulatory_status as string | null;
  const completeness = (project as any).completeness_score as number | null;
  const docType = (project as any).document_type as string | null;

  const isProcessing = project.status === 'processing';
  const isComplete = project.status === 'complete' || project.status === 'completed';
  const hasNewFiles = project.updated_at && documents.some(d => new Date(d.uploaded_at) > new Date(project.updated_at));

  // Fallback: parse strengths from exec summary markdown if no structured data
  const fallbackStrengths = !keyStrengths ? (() => {
    const execSummary = reportSections.find(s => s.section_key === 'executive_summary');
    return execSummary?.content?.split('\n')
      .filter(line => line.trim().startsWith('- **'))
      .slice(0, 5)
      .map(line => {
        const match = line.match(/- \*\*(.+?)\*\*[:\s]*(.+)/);
        return match ? { category: match[1], detail: match[2] } : null;
      })
      .filter(Boolean) as { category: string; detail: string }[] || [];
  })() : null;

  const displayStrengths = keyStrengths || fallbackStrengths || [];
  const displayRisks = keyRisks || criticalFlags.slice(0, 4).map(f => ({ category: f.title, detail: f.description || '' }));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Status Banners */}
      {isProcessing && (
        <BlurFade>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Analysis Running</p>
              <p className="text-[11px] text-muted-foreground">The L1 report is being generated. This may take a few minutes.</p>
            </div>
          </div>
        </BlurFade>
      )}

      {isComplete && !hasNewFiles && (
        <BlurFade>
          <div className="flex items-center gap-3 rounded-xl border border-score-strong/20 bg-score-strong/5 px-4 py-2.5">
            <CheckCircle className="h-4 w-4 text-score-strong shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Report Ready</span> — Last updated {formatRelativeTime(project.updated_at)}
            </p>
          </div>
        </BlurFade>
      )}

      {hasNewFiles && !isProcessing && (
        <BlurFade>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-severity-elevated/30 bg-severity-elevated/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-severity-elevated shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">New files added since last analysis</p>
                <p className="text-[11px] text-muted-foreground">Re-run to incorporate the latest documents into the report.</p>
              </div>
            </div>
            <ShimmerButton onClick={onRerunAnalysis} className="text-xs shrink-0">
              <RefreshCw className="h-3.5 w-3.5" /> Re-run Analysis
            </ShimmerButton>
          </div>
        </BlurFade>
      )}

      {/* Executive Summary Header */}
      <BlurFade>
        <MagicCard>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">L1 Preliminary Due Diligence</p>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">{project.fund_name}</h2>
              {gpEntity && <p className="text-xs text-muted-foreground mt-0.5">{gpEntity}</p>}
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                {project.asset_class && <span className="rounded-full border border-border px-2 py-0.5">{project.asset_class}</span>}
                {project.vintage && <span className="rounded-full border border-border px-2 py-0.5">Vintage {project.vintage}</span>}
                {project.established_year && <span className="rounded-full border border-border px-2 py-0.5">Est. {project.established_year}</span>}
                {fundSize && <span className="rounded-full border border-border px-2 py-0.5">{fundSize}</span>}
                {domicile && <span className="rounded-full border border-border px-2 py-0.5">{domicile}</span>}
                {regulatory && <span className="rounded-full border border-border px-2 py-0.5">{regulatory}</span>}
              </div>
              {strategy && <p className="text-xs text-muted-foreground mt-2 italic">{strategy}</p>}
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <ScoreBadge score={project.composite_score || 0} size="lg" />
              {project.recommendation && (
                <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-${tierColor}`}>
                  {project.recommendation}
                </span>
              )}
            </div>
          </div>
        </MagicCard>
      </BlurFade>

      {/* Executive Summary Narrative */}
      {execNarrative && (
        <BlurFade delay={0.03}>
          <MagicCard>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Executive Summary</p>
            <p className="text-sm text-foreground leading-relaxed">{execNarrative}</p>
          </MagicCard>
        </BlurFade>
      )}

      {/* Module Score Breakdown */}
      <BlurFade delay={0.05}>
        <MagicCard>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Score Breakdown by Module</p>
          <div className="space-y-2.5">
            {moduleScoresData.length > 0 ? (
              moduleScoresData.map((ms: any) => {
                const score = ms.score || 0;
                const modTier = getScoreTier(score);
                const modColor = getScoreColor(modTier);
                return (
                  <div key={ms.id} className="flex items-center gap-3">
                    <span className="text-[10px] font-medium text-muted-foreground w-36 sm:w-44 shrink-0 truncate">
                      {ms.module_label || ms.module_key}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-muted">
                      <div className={`h-full rounded-full bg-${modColor}`} style={{ width: `${score}%` }} />
                    </div>
                    <span className="text-xs font-bold text-foreground w-10 text-right">{score}</span>
                    {ms.confidence && (
                      <span className="text-[9px] text-muted-foreground w-14 uppercase">{ms.confidence}</span>
                    )}
                    {ms.weight && (
                      <span className="text-[9px] text-muted-foreground w-8">{Math.round(ms.weight * 100)}%</span>
                    )}
                  </div>
                );
              })
            ) : (
              // Legacy fallback
              Object.entries({ a: "Financial & Performance", b: "Team & Management", c: "Strategy & Market", d: "Terms & Structure", e: "Operational" }).map(([key, label]) => {
                const moduleScores = (project.module_scores as Record<string, number>) || {};
                const score = moduleScores[key] || 0;
                const modTier = getScoreTier(score);
                const modColor = getScoreColor(modTier);
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-[10px] font-medium text-muted-foreground w-36 sm:w-44 shrink-0 truncate">
                      Mod {key.toUpperCase()}: {label}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-muted">
                      <div className={`h-full rounded-full bg-${modColor}`} style={{ width: `${score}%` }} />
                    </div>
                    <span className="text-xs font-bold text-foreground w-10 text-right">{score}</span>
                  </div>
                );
              })
            )}
          </div>
        </MagicCard>
      </BlurFade>

      {/* Key Strengths + Critical Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BlurFade delay={0.1}>
          <MagicCard className="h-full">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-score-strong" />
              <h3 className="font-semibold text-foreground">Key Strengths</h3>
            </div>
            <div className="space-y-3">
              {displayStrengths.length > 0 ? (
                displayStrengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-score-strong mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.category}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{s.detail}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Awaiting analysis results</p>
              )}
            </div>
          </MagicCard>
        </BlurFade>

        <BlurFade delay={0.15}>
          <MagicCard className="h-full">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-severity-critical" />
              <h3 className="font-semibold text-foreground">Key Risks</h3>
              {criticalFlags.length > 0 && (
                <span className="ml-auto inline-flex items-center rounded-full bg-severity-critical/10 px-2 py-0.5 text-[10px] font-bold text-severity-critical">
                  {criticalFlags.length}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {displayRisks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No critical issues identified</p>
              ) : (
                displayRisks.slice(0, 5).map((risk, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1.5 h-2 w-2 rounded-full shrink-0 bg-severity-critical" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{risk.category}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{risk.detail}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </MagicCard>
        </BlurFade>
      </div>


      {/* Submission Quality — Collapsible */}
      <BlurFade delay={0.25}>
        <MagicCard>
          <button onClick={() => setShowQuality(!showQuality)} className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">Submission Quality Assessment</p>
                <p className="text-[11px] text-muted-foreground">
                  {docType || 'Completeness and consistency of submitted materials'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-foreground">{completeness || Math.round((reportSections.length / 9) * 100)}%</span>
              {showQuality ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </button>
          {showQuality && (
            <div className="mt-4 pt-4 border-t border-border space-y-4">
              <div className="h-2 rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${completeness || Math.round((reportSections.length / 9) * 100)}%` }} />
              </div>

              {/* Structured submission quality categories */}
              {submissionQuality.length > 0 && (
                <div className="space-y-2">
                  {submissionQuality.map((sq: any) => (
                    <div key={sq.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-xs text-foreground font-medium">{sq.category_label}</span>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          sq.status === 'complete' ? 'bg-score-strong/10 text-score-strong' :
                          sq.status === 'partial' ? 'bg-severity-elevated/10 text-severity-elevated' :
                          sq.status === 'minimal' ? 'bg-severity-critical/10 text-severity-critical' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {sq.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Document quality flags */}
              {docQualityFlags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Document Quality</p>
                  {docQualityFlags.map((dq: any) => (
                    <div key={dq.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-xs text-foreground">{dq.flag_label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-foreground">{dq.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </MagicCard>
      </BlurFade>

      {/* Critical Info Gaps — Collapsible */}
      {criticalInfoGaps.length > 0 && (
        <BlurFade delay={0.27}>
          <MagicCard>
            <button onClick={() => setShowGaps(!showGaps)} className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-severity-elevated" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Critical Information Gaps</p>
                  <p className="text-[11px] text-muted-foreground">{criticalInfoGaps.length} gaps identified</p>
                </div>
              </div>
              {showGaps ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showGaps && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                {criticalInfoGaps.map((gap: any) => (
                  <div key={gap.id} className="flex items-start gap-3">
                    <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                      gap.severity === 'critical' ? 'bg-severity-critical' : gap.severity === 'elevated' ? 'bg-severity-elevated' : 'bg-severity-monitor'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{gap.gap_title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{gap.gap_description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </MagicCard>
        </BlurFade>
      )}

      {/* Recommendation Rationale */}
      {(project.recommendation || finalNarrative) && (
        <BlurFade delay={0.3}>
          <MagicCard>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-foreground" />
              <h3 className="font-semibold text-foreground">Final Assessment & Recommendation</h3>
            </div>
            <div className="text-sm text-muted-foreground space-y-3">
              {finalNarrative ? (
                <p>{finalNarrative}</p>
              ) : (
                <>
                  {tier === 'decline' && (
                    <p>This fund presents a <span className="font-medium text-severity-critical">risk profile that does not warrant advancement</span> to the data room stage.</p>
                  )}
                  {tier === 'review' && (
                    <p>This fund requires <span className="font-medium text-severity-elevated">additional review and clarification</span> before a decision to advance or decline.</p>
                  )}
                  {(tier === 'advance' || tier === 'strong_advance') && (
                    <p>This fund presents a <span className="font-medium text-score-strong">compelling opportunity</span> supported by strong fundamentals.</p>
                  )}
                </>
              )}

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
          </MagicCard>
        </BlurFade>
      )}
    </div>
  );
}
