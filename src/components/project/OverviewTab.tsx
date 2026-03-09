import { CheckCircle2, AlertTriangle, Shield, FileText, ChevronDown, ChevronUp, RefreshCw, CheckCircle } from "lucide-react";
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
  onRerunAnalysis: () => void;
}

const MODULE_META: Record<string, { label: string; weight: string }> = {
  a: { label: "Financial & Performance", weight: "25%" },
  b: { label: "Team & Management", weight: "25%" },
  c: { label: "Strategy & Market", weight: "30%" },
  d: { label: "Terms & Structure", weight: "12%" },
  e: { label: "Operational", weight: "8%" },
};

export function OverviewTab({ project, redFlags, reportSections, documents, onRerunAnalysis }: OverviewTabProps) {
  const [showQuality, setShowQuality] = useState(false);
  const criticalFlags = redFlags.filter(f => f.severity === 'critical');
  const elevatedFlags = redFlags.filter(f => f.severity === 'elevated');
  const monitorFlags = redFlags.filter(f => f.severity === 'monitor');
  const moduleScores = (project.module_scores as Record<string, number>) || {};
  const tier = getScoreTier(project.composite_score);
  const tierColor = getScoreColor(tier);
  const completionRate = reportSections.length > 0 ? Math.round((reportSections.length / 9) * 100) : 0;

  // Analysis status
  const isProcessing = project.status === 'processing';
  const isComplete = project.status === 'complete';
  const hasNewFiles = project.updated_at && documents.some(d => new Date(d.uploaded_at) > new Date(project.updated_at));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Analysis Status Banner */}
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
              <RefreshCw className="h-3.5 w-3.5" />
              Re-run Analysis
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
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                {project.asset_class && <span className="rounded-full border border-border px-2 py-0.5">{project.asset_class}</span>}
                {project.vintage && <span className="rounded-full border border-border px-2 py-0.5">Vintage {project.vintage}</span>}
                {project.established_year && <span className="rounded-full border border-border px-2 py-0.5">Est. {project.established_year}</span>}
              </div>
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

      {/* Module Score Breakdown */}
      <BlurFade delay={0.05}>
        <MagicCard>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Score Breakdown by Module</p>
          <div className="space-y-2.5">
            {Object.entries(MODULE_META).map(([key, meta]) => {
              const score = moduleScores[key] || 0;
              const modTier = getScoreTier(score);
              const modColor = getScoreColor(modTier);
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-[10px] font-medium text-muted-foreground w-36 sm:w-44 shrink-0 truncate">
                    Mod {key.toUpperCase()}: {meta.label}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-muted">
                    <div className={`h-full rounded-full bg-${modColor}`} style={{ width: `${score}%` }} />
                  </div>
                  <span className="text-xs font-bold text-foreground w-10 text-right">{score}</span>
                  <span className="text-[9px] text-muted-foreground w-8">{meta.weight}</span>
                </div>
              );
            })}
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
              {reportSections.length > 0 ? (
                (() => {
                  const execSummary = reportSections.find(s => s.section_key === 'executive_summary');
                  const strengths = execSummary?.content
                    ?.split('\n')
                    .filter(line => line.trim().startsWith('- **'))
                    .slice(0, 5)
                    .map(line => {
                      const match = line.match(/- \*\*(.+?)\*\*[:\s]*(.+)/);
                      return match ? { title: match[1], desc: match[2] } : null;
                    })
                    .filter(Boolean) || [];

                  return strengths.length > 0 ? (
                    strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-score-strong mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{s!.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{s!.desc}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Awaiting analysis results</p>
                  );
                })()
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
              <h3 className="font-semibold text-foreground">Critical Issues</h3>
              {criticalFlags.length > 0 && (
                <span className="ml-auto inline-flex items-center rounded-full bg-severity-critical/10 px-2 py-0.5 text-[10px] font-bold text-severity-critical">
                  {criticalFlags.length}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {criticalFlags.length === 0 && elevatedFlags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No critical issues identified</p>
              ) : (
                [...criticalFlags, ...elevatedFlags].slice(0, 4).map((flag) => (
                  <div key={flag.id} className="flex items-start gap-3">
                    <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${flag.severity === 'critical' ? 'bg-severity-critical' : 'bg-severity-elevated'}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{flag.title}</p>
                        {flag.confidence && (
                          <span className="text-[9px] uppercase text-muted-foreground">({flag.confidence})</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{flag.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </MagicCard>
        </BlurFade>
      </div>

      {/* Red Flag Summary Counts */}
      <BlurFade delay={0.2}>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-severity-critical">{criticalFlags.length}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">Critical</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-severity-elevated">{elevatedFlags.length}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">Elevated</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-severity-monitor">{monitorFlags.length}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">Monitor</p>
          </div>
        </div>
      </BlurFade>

      {/* Submission Quality — Collapsible */}
      <BlurFade delay={0.25}>
        <MagicCard>
          <button
            onClick={() => setShowQuality(!showQuality)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">Submission Quality Assessment</p>
                <p className="text-[11px] text-muted-foreground">Completeness and consistency of submitted materials</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-foreground">{completionRate}%</span>
              {showQuality ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </button>
          {showQuality && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="h-2 rounded-full bg-muted mb-3">
                <div className="h-full rounded-full bg-primary" style={{ width: `${completionRate}%` }} />
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Sections Complete: {reportSections.length} / 9</span>
                <span>Remaining: {9 - reportSections.length}</span>
              </div>
            </div>
          )}
        </MagicCard>
      </BlurFade>

      {/* Recommendation Rationale */}
      {project.recommendation && (
        <BlurFade delay={0.3}>
          <MagicCard>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-foreground" />
              <h3 className="font-semibold text-foreground">Recommendation Rationale</h3>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              {tier === 'decline' && (
                <p>This fund presents a <span className="font-medium text-severity-critical">risk profile that does not warrant advancement</span> to the data room stage. Critical issues identified during autonomous research exceed acceptable thresholds for preliminary diligence.</p>
              )}
              {tier === 'review' && (
                <p>This fund requires <span className="font-medium text-severity-elevated">additional review and clarification</span> before a decision to advance or decline. Several material concerns warrant GP engagement.</p>
              )}
              {(tier === 'advance' || tier === 'strong_advance') && (
                <p>This fund presents a <span className="font-medium text-score-strong">compelling opportunity</span> supported by strong fundamentals. Schedule GP meeting and request data room access, contingent on satisfactory resolution of elevated diligence items.</p>
              )}
            </div>
          </MagicCard>
        </BlurFade>
      )}
    </div>
  );
}
