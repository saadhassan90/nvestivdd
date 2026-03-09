import { CheckCircle2, AlertTriangle, Shield } from "lucide-react";
import { MagicCard } from "@/components/magicui/MagicCard";
import { BlurFade } from "@/components/magicui/BlurFade";
import type { Tables } from "@/integrations/supabase/types";
import { formatRelativeTime } from "@/lib/score-utils";

interface OverviewTabProps {
  project: Tables<"projects">;
  redFlags: Tables<"red_flags">[];
  reportSections: Tables<"report_sections">[];
}

export function OverviewTab({ project, redFlags, reportSections }: OverviewTabProps) {
  const criticalFlags = redFlags.filter(f => f.severity === 'critical');
  const elevatedFlags = redFlags.filter(f => f.severity === 'elevated');
  const completionRate = reportSections.length > 0 ? Math.round((reportSections.length / 9) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Submission Quality */}
      <BlurFade>
        <MagicCard>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Submission Quality</p>
              <p className="text-xs text-muted-foreground mt-0.5">Consistency and accuracy across latest batch</p>
            </div>
            <span className="text-3xl font-bold text-foreground">{completionRate}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${completionRate}%` }} />
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>Complete ({completionRate}%)</span>
            <span>Remaining ({100 - completionRate}%)</span>
          </div>
        </MagicCard>
      </BlurFade>

      {/* Strengths + Risks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BlurFade delay={0.1}>
          <MagicCard className="h-full">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-score-strong" />
              <h3 className="font-semibold text-foreground">Key Strengths</h3>
            </div>
            <div className="space-y-4">
              {[
                { title: "Data Integrity", desc: "Cross-referencing accuracy exceeding 98% benchmarks" },
                { title: "Metadata Completeness", desc: "All required fields populated across submissions" },
                { title: "Response Time", desc: "LP reporting cadence consistently within SLA parameters" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-score-strong mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </MagicCard>
        </BlurFade>

        <BlurFade delay={0.2}>
          <MagicCard className="h-full">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-severity-elevated" />
              <h3 className="font-semibold text-foreground">Critical Risks</h3>
            </div>
            <div className="space-y-4">
              {redFlags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No critical risks identified</p>
              ) : (
                redFlags.slice(0, 3).map((flag) => (
                  <div key={flag.id} className="flex items-start gap-3">
                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${flag.severity === 'critical' ? 'bg-severity-critical' : 'bg-severity-elevated'}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{flag.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{flag.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </MagicCard>
        </BlurFade>
      </div>

      {/* Red Flag Summary */}
      {redFlags.length > 0 && (
        <BlurFade delay={0.3}>
          <MagicCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-severity-critical" />
                <h3 className="font-semibold text-foreground">Red Flag Summary</h3>
              </div>
              <span className="inline-flex items-center rounded-full bg-severity-critical/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-severity-critical">
                {criticalFlags.length + elevatedFlags.length} Attention Required
              </span>
            </div>
            <div className="space-y-3">
              {redFlags.map((flag) => (
                <div key={flag.id} className="flex items-start justify-between rounded-lg border border-border p-4">
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-primary-foreground ${flag.severity === 'critical' ? 'bg-severity-critical' : flag.severity === 'elevated' ? 'bg-severity-elevated' : 'bg-severity-monitor'}`}>
                      {flag.severity === 'critical' ? 'H' : flag.severity === 'elevated' ? 'M' : 'L'}
                    </span>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Logged {formatRelativeTime(flag.logged_at)} • {flag.module || 'General'}
                      </p>
                      <p className="text-sm font-semibold text-foreground">{flag.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{flag.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">Assign</button>
                    <button className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">Review</button>
                  </div>
                </div>
              ))}
            </div>
          </MagicCard>
        </BlurFade>
      )}
    </div>
  );
}
