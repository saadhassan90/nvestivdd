import { Card, CardBody, Chip, Progress, Button } from "@heroui/react";
import { CheckCircle2, AlertTriangle, Shield, FileText, ChevronDown, ChevronUp, RefreshCw, CheckCircle } from "lucide-react";
import { useState } from "react";
import { BlurFade } from "@/components/magicui/BlurFade";
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
  const completionRate = reportSections.length > 0 ? Math.round((reportSections.length / 9) * 100) : 0;

  const isProcessing = project.status === 'processing';
  const isComplete = project.status === 'complete';
  const hasNewFiles = project.updated_at && documents.some(d => new Date(d.uploaded_at) > new Date(project.updated_at));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Analysis Status Banners */}
      {isProcessing && (
        <BlurFade>
          <Card shadow="sm" className="border-l-4 border-l-primary">
            <CardBody className="flex flex-row items-center gap-3 py-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-default-200 border-t-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">Analysis Running</p>
                <p className="text-xs text-default-400">The L1 report is being generated. This may take a few minutes.</p>
              </div>
            </CardBody>
          </Card>
        </BlurFade>
      )}

      {isComplete && !hasNewFiles && (
        <BlurFade>
          <Card shadow="sm" className="border-l-4 border-l-success">
            <CardBody className="flex flex-row items-center gap-3 py-2.5">
              <CheckCircle className="h-4 w-4 text-success shrink-0" />
              <p className="text-xs text-default-500">
                <span className="font-medium text-foreground">Report Ready</span> — Last updated {formatRelativeTime(project.updated_at)}
              </p>
            </CardBody>
          </Card>
        </BlurFade>
      )}

      {hasNewFiles && !isProcessing && (
        <BlurFade>
          <Card shadow="sm" className="border-l-4 border-l-warning">
            <CardBody className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-warning shrink-0" />
                <div>
                  <p className="text-sm font-medium">New files added since last analysis</p>
                  <p className="text-xs text-default-400">Re-run to incorporate the latest documents into the report.</p>
                </div>
              </div>
              <Button size="sm" color="warning" variant="flat" startContent={<RefreshCw className="h-3.5 w-3.5" />} onPress={onRerunAnalysis}>
                Re-run Analysis
              </Button>
            </CardBody>
          </Card>
        </BlurFade>
      )}

      {/* Executive Summary Header */}
      <BlurFade>
        <Card shadow="sm">
          <CardBody className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-default-400 mb-1">L1 Preliminary Due Diligence</p>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">{project.fund_name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {project.asset_class && <Chip size="sm" variant="flat">{project.asset_class}</Chip>}
                  {project.vintage && <Chip size="sm" variant="flat">Vintage {project.vintage}</Chip>}
                  {project.established_year && <Chip size="sm" variant="flat">Est. {project.established_year}</Chip>}
                </div>
              </div>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <ScoreBadge score={project.composite_score || 0} size="lg" />
                {project.recommendation && (
                  <Chip size="sm" variant="flat" color={tier === 'decline' ? 'danger' : tier === 'review' ? 'warning' : 'success'} className="mt-1">
                    {project.recommendation}
                  </Chip>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </BlurFade>

      {/* Module Score Breakdown */}
      <BlurFade delay={0.05}>
        <Card shadow="sm">
          <CardBody className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-default-400 mb-3">Score Breakdown by Module</p>
            <div className="space-y-3">
              {Object.entries(MODULE_META).map(([key, meta]) => {
                const score = moduleScores[key] || 0;
                const color = score >= 85 ? 'success' : score >= 70 ? 'success' : score >= 50 ? 'warning' : 'danger';
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-[10px] font-medium text-default-500 w-36 sm:w-44 shrink-0 truncate">
                      Mod {key.toUpperCase()}: {meta.label}
                    </span>
                    <Progress value={score} color={color} size="sm" className="flex-1" />
                    <span className="text-xs font-bold text-foreground w-10 text-right">{score}</span>
                    <span className="text-[9px] text-default-400 w-8">{meta.weight}</span>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </BlurFade>

      {/* Key Strengths + Critical Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BlurFade delay={0.1}>
          <Card shadow="sm" className="h-full">
            <CardBody className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-success" />
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
                          <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{s!.title}</p>
                            <p className="text-xs text-default-400 line-clamp-2">{s!.desc}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-default-400">Awaiting analysis results</p>
                    );
                  })()
                ) : (
                  <p className="text-sm text-default-400">Awaiting analysis results</p>
                )}
              </div>
            </CardBody>
          </Card>
        </BlurFade>

        <BlurFade delay={0.15}>
          <Card shadow="sm" className="h-full">
            <CardBody className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-danger" />
                <h3 className="font-semibold text-foreground">Critical Issues</h3>
                {criticalFlags.length > 0 && (
                  <Chip size="sm" color="danger" variant="flat" className="ml-auto">{criticalFlags.length}</Chip>
                )}
              </div>
              <div className="space-y-3">
                {criticalFlags.length === 0 && elevatedFlags.length === 0 ? (
                  <p className="text-sm text-default-400">No critical issues identified</p>
                ) : (
                  [...criticalFlags, ...elevatedFlags].slice(0, 4).map((flag) => (
                    <div key={flag.id} className="flex items-start gap-3">
                      <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${flag.severity === 'critical' ? 'bg-danger' : 'bg-warning'}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{flag.title}</p>
                          {flag.confidence && (
                            <span className="text-[9px] uppercase text-default-400">({flag.confidence})</span>
                          )}
                        </div>
                        <p className="text-xs text-default-400 line-clamp-2 mt-0.5">{flag.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </BlurFade>
      </div>

      {/* Red Flag Summary Counts */}
      <BlurFade delay={0.2}>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Critical", count: criticalFlags.length, color: "text-danger" },
            { label: "Elevated", count: elevatedFlags.length, color: "text-warning" },
            { label: "Monitor", count: monitorFlags.length, color: "text-primary" },
          ].map(item => (
            <Card key={item.label} shadow="sm">
              <CardBody className="p-3 sm:p-4 text-center">
                <p className={`text-2xl sm:text-3xl font-bold ${item.color}`}>{item.count}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-default-400 mt-1">{item.label}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </BlurFade>

      {/* Submission Quality — Collapsible */}
      <BlurFade delay={0.25}>
        <Card shadow="sm" isPressable onPress={() => setShowQuality(!showQuality)}>
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-default-400" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Submission Quality Assessment</p>
                  <p className="text-xs text-default-400">Completeness and consistency of submitted materials</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-foreground">{completionRate}%</span>
                {showQuality ? <ChevronUp className="h-4 w-4 text-default-400" /> : <ChevronDown className="h-4 w-4 text-default-400" />}
              </div>
            </div>
            {showQuality && (
              <div className="mt-4 pt-4 border-t border-divider">
                <Progress value={completionRate} color="primary" size="sm" className="mb-3" />
                <div className="flex items-center gap-4 text-xs text-default-400">
                  <span>Sections Complete: {reportSections.length} / 9</span>
                  <span>Remaining: {9 - reportSections.length}</span>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </BlurFade>

      {/* Recommendation Rationale */}
      {project.recommendation && (
        <BlurFade delay={0.3}>
          <Card shadow="sm">
            <CardBody className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-foreground" />
                <h3 className="font-semibold text-foreground">Recommendation Rationale</h3>
              </div>
              <div className="text-sm text-default-500">
                {tier === 'decline' && (
                  <p>This fund presents a <span className="font-medium text-danger">risk profile that does not warrant advancement</span> to the data room stage.</p>
                )}
                {tier === 'review' && (
                  <p>This fund requires <span className="font-medium text-warning">additional review and clarification</span> before a decision to advance or decline.</p>
                )}
                {(tier === 'advance' || tier === 'strong_advance') && (
                  <p>This fund presents a <span className="font-medium text-success">compelling opportunity</span> supported by strong fundamentals. Schedule GP meeting and request data room access.</p>
                )}
              </div>
            </CardBody>
          </Card>
        </BlurFade>
      )}
    </div>
  );
}
