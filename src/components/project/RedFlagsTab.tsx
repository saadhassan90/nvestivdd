import { Shield, AlertTriangle, Eye, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { MagicCard } from "@/components/magicui/MagicCard";
import { BlurFade } from "@/components/magicui/BlurFade";
import { MarkdownSectionCards } from "@/components/project/MarkdownSectionCards";
import { formatRelativeTime } from "@/lib/score-utils";
import type { Tables } from "@/integrations/supabase/types";

interface RedFlagsTabProps {
  redFlags: Tables<"red_flags">[];
  reportMarkdown?: string | null;
  moduleScore?: number | null;
  fundName?: string;
  submissionQuality?: Tables<"submission_quality">[];
  criticalInfoGaps?: Tables<"critical_info_gaps">[];
}

const MODULE_LABELS: Record<string, string> = {
  module_a: "Financial",
  module_b: "Team",
  module_c: "Strategy",
  module_d: "Terms",
  module_e: "Operational",
  financial: "Financial",
  team: "Team",
  strategy: "Strategy",
  terms: "Terms",
  operations: "Operational",
};

const SEVERITY_STYLE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  critical: { bg: "bg-severity-critical/10", text: "text-severity-critical", border: "border-l-severity-critical", label: "Critical — Require Resolution Before Investment" },
  elevated: { bg: "bg-severity-elevated/10", text: "text-severity-elevated", border: "border-l-severity-elevated", label: "Elevated — Material Diligence Items" },
  monitor: { bg: "bg-severity-monitor/10", text: "text-severity-monitor", border: "border-l-severity-monitor", label: "Monitor — Track But Not Deal-Breaking" },
};

export function RedFlagsTab({ redFlags, reportMarkdown, moduleScore, fundName, submissionQuality = [], criticalInfoGaps = [] }: RedFlagsTabProps) {
  const criticalFlags = redFlags.filter((f) => f.severity === "critical");
  const elevatedFlags = redFlags.filter((f) => f.severity === "elevated");
  const monitorFlags = redFlags.filter((f) => f.severity === "monitor");

  const hardFloors = submissionQuality.filter((sq) => sq.severity === "hard_floor" || sq.category?.includes("hard_floor"));
  const passedFloors = hardFloors.filter((h) => h.status === "pass" || h.status === "cleared");

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <BlurFade>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Risk & Red Flags
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
              Institutional exposure, operational vulnerabilities, and compliance metrics{fundName ? ` for ${fundName}` : ""}.
            </p>
          </div>
          {moduleScore != null && (
            <div className="shrink-0 flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-border bg-card">
                <div className="flex items-center gap-1">
                  <span className={`text-xl font-bold ${
                    moduleScore >= 85 ? "text-score-strong" : moduleScore >= 70 ? "text-score-advance" : moduleScore >= 50 ? "text-score-review" : "text-severity-critical"
                  }`}>{moduleScore}</span>
                  {moduleScore >= 70 && <CheckCircle2 className="h-4 w-4 text-score-strong" />}
                </div>
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">Risk Score</span>
            </div>
          )}
        </div>
      </BlurFade>

      {/* Summary bar */}
      {redFlags.length > 0 && (
        <BlurFade delay={0.03}>
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3">
            {criticalFlags.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-severity-critical" />
                <span className="text-xs font-semibold text-severity-critical">{criticalFlags.length} Critical</span>
              </div>
            )}
            {elevatedFlags.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-severity-elevated" />
                <span className="text-xs font-semibold text-severity-elevated">{elevatedFlags.length} Elevated</span>
              </div>
            )}
            {monitorFlags.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-severity-monitor" />
                <span className="text-xs font-semibold text-severity-monitor">{monitorFlags.length} Monitor</span>
              </div>
            )}
            <span className="text-xs text-muted-foreground ml-auto">{redFlags.length} total</span>
          </div>
        </BlurFade>
      )}

      {/* Report Narrative */}
      {reportMarkdown && (
        <BlurFade delay={0.05}>
          <MarkdownSectionCards content={reportMarkdown} baseDelay={0.07} />
        </BlurFade>
      )}

      {/* Hard Floor Gates */}
      {submissionQuality.length > 0 && (
        <BlurFade delay={0.08}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Hard Floor Gates
              </p>
              {hardFloors.length > 0 && (
                <span className="text-[10px] font-medium text-muted-foreground">
                  {passedFloors.length} of {hardFloors.length} Cleared
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {submissionQuality.map((sq) => {
                const passed = sq.status === "pass" || sq.status === "cleared" || sq.status === "present";
                const warning = sq.severity === "elevated" || sq.severity === "critical" || sq.status === "fail" || sq.status === "flagged";
                return (
                  <MagicCard
                    key={sq.id}
                    className={warning ? "!border-severity-elevated/30 !bg-severity-elevated/5" : ""}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${warning ? "text-severity-elevated" : "text-muted-foreground"}`}>
                        {sq.category_label}
                      </p>
                      {passed ? (
                        <CheckCircle2 className="h-4 w-4 text-score-strong shrink-0" />
                      ) : warning ? (
                        <AlertTriangle className="h-4 w-4 text-severity-elevated shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    <p className={`text-lg font-bold ${warning ? "text-severity-elevated" : "text-foreground"}`}>
                      {sq.confidence}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {sq.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                  </MagicCard>
                );
              })}
            </div>
          </div>
        </BlurFade>
      )}

      {/* Red Flags by severity */}
      {redFlags.length > 0 && (
        <div className="space-y-6">
          {(["critical", "elevated", "monitor"] as const).map((severity) => {
            const flags = redFlags.filter((f) => f.severity === severity);
            if (flags.length === 0) return null;
            const style = SEVERITY_STYLE[severity];
            const IconComp = severity === "critical" ? Shield : severity === "elevated" ? AlertTriangle : Eye;
            return (
              <BlurFade key={severity} delay={0.12}>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <IconComp className={`h-4 w-4 ${style.text}`} />
                    <span className={`text-xs font-semibold uppercase tracking-wider ${style.text}`}>
                      {style.label}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {flags.map((flag, i) => (
                      <FlagCard key={flag.id} flag={flag} index={i} />
                    ))}
                  </div>
                </div>
              </BlurFade>
            );
          })}
        </div>
      )}

      {/* Critical Info Gaps */}
      {criticalInfoGaps.length > 0 && (
        <BlurFade delay={0.15}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Critical Information Gaps
            </p>
            <div className="space-y-2">
              {criticalInfoGaps.map((gap) => (
                <div key={gap.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <XCircle className={`h-4 w-4 shrink-0 mt-0.5 ${
                    gap.severity === "critical" ? "text-severity-critical" : "text-severity-elevated"
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{gap.gap_title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{gap.gap_description}</p>
                    {gap.related_module && (
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 inline-block">
                        Module: {MODULE_LABELS[gap.related_module] || gap.related_module}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </BlurFade>
      )}

      {/* Empty State */}
      {redFlags.length === 0 && submissionQuality.length === 0 && (
        <BlurFade>
          <MagicCard>
            <div className="text-center py-12">
              <Shield className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No red flags identified yet.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Risk assessment will appear once the analysis is complete.</p>
            </div>
          </MagicCard>
        </BlurFade>
      )}
    </div>
  );
}

/* ── Individual Flag Card ── */
function FlagCard({ flag, index }: { flag: Tables<"red_flags">; index: number }) {
  const style = SEVERITY_STYLE[flag.severity] || SEVERITY_STYLE.monitor;

  return (
    <BlurFade delay={index * 0.03}>
      <MagicCard className={`border-l-4 ${style.border}`}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground ${
              flag.severity === "critical" ? "bg-severity-critical" : flag.severity === "elevated" ? "bg-severity-elevated" : "bg-severity-monitor"
            }`}>
              {flag.severity}
            </span>
            {flag.source_module && (
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {MODULE_LABELS[flag.source_module] || flag.source_module}
              </span>
            )}
            {flag.confidence && (
              <span className="text-[10px] text-muted-foreground">{flag.confidence} confidence</span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatRelativeTime(flag.logged_at)}
          </span>
        </div>

        <p className="text-sm font-semibold text-foreground">{flag.title}</p>
        {flag.description && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{flag.description}</p>
        )}

        {(flag.issue || flag.implication || flag.resolution) && (
          <div className="mt-3 space-y-2 rounded-lg bg-muted/50 p-3">
            {flag.issue && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Issue: </span>
                <span className="text-xs text-muted-foreground">{flag.issue}</span>
              </div>
            )}
            {flag.implication && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Implication: </span>
                <span className="text-xs text-muted-foreground">{flag.implication}</span>
              </div>
            )}
            {flag.resolution && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Resolution: </span>
                <span className="text-xs text-muted-foreground">{flag.resolution}</span>
              </div>
            )}
          </div>
        )}

        {(flag.data_room_action || flag.interrogatory_question || flag.timeline) && (
          <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border/50">
            {flag.timeline && (
              <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[9px] font-medium text-muted-foreground uppercase">
                {flag.timeline.replace(/_/g, " ")}
              </span>
            )}
            {flag.data_room_action && (
              <span className="text-[10px] text-muted-foreground">
                <span className="font-bold uppercase tracking-wider">DR: </span>{flag.data_room_action}
              </span>
            )}
            {flag.interrogatory_question && (
              <span className="text-[10px] text-muted-foreground italic">
                Q: "{flag.interrogatory_question}"
              </span>
            )}
          </div>
        )}
      </MagicCard>
    </BlurFade>
  );
}
