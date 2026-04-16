import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, Circle, Loader2, AlertCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { BlurFade } from "@/components/magicui/BlurFade";
import { MagicCard } from "@/components/magicui/MagicCard";
import { NumberTicker } from "@/components/magicui/NumberTicker";

interface AnalysisLog {
  id: string;
  step_key: string;
  step_label: string;
  step_index: number;
  total_steps: number;
  status: string;
  detail: string | null;
  started_at: string | null;
  completed_at: string | null;
}

interface ProcessingStateProps {
  startedAt?: string;
  projectId?: string;
}

/** Group logs into phases based on step_index ranges */
function groupIntoPhases(logs: AnalysisLog[]) {
  const phases = [
    { name: "Phase 1: Preparation", range: [0, 2] },
    { name: "Phase 2: Research", range: [3, 8] },
    { name: "Phase 3: Scoring & Assembly", range: [9, 99] },
  ];

  return phases.map((phase) => {
    const items = logs.filter(
      (l) => l.step_index >= phase.range[0] && l.step_index <= phase.range[1]
    );
    const allComplete = items.length > 0 && items.every((i) => i.status === "complete");
    const hasRunning = items.some((i) => i.status === "running");
    const status = allComplete ? "complete" : hasRunning ? "running" : "pending";

    const completedCount = items.filter((i) => i.status === "complete").length;

    return {
      name: phase.name,
      status,
      items,
      completedCount,
      totalCount: items.length,
    };
  });
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
}

function PhaseStatusBadge({ status, completedCount, totalCount }: { status: string; completedCount: number; totalCount: number }) {
  if (status === "complete") {
    return <span className="text-[10px] font-bold uppercase tracking-wider text-score-strong">Complete</span>;
  }
  if (status === "running") {
    return (
      <span className="text-[10px] font-bold uppercase tracking-wider text-severity-monitor">
        In Progress — {completedCount} of {totalCount} items complete
      </span>
    );
  }
  return <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pending previous phase</span>;
}

function PhaseIcon({ status }: { status: string }) {
  if (status === "complete") return <CheckCircle2 className="h-6 w-6 text-score-strong" />;
  if (status === "running") return <Loader2 className="h-6 w-6 text-severity-monitor animate-spin" />;
  return <Circle className="h-6 w-6 text-muted-foreground/30" />;
}

function StepDot({ status }: { status: string }) {
  if (status === "complete") return <span className="h-2 w-2 rounded-full bg-score-strong shrink-0 mt-1.5" />;
  if (status === "running") return <span className="h-2 w-2 rounded-full bg-severity-monitor shrink-0 mt-1.5 animate-pulse" />;
  if (status === "error") return <span className="h-2 w-2 rounded-full bg-severity-critical shrink-0 mt-1.5" />;
  return <span className="h-2 w-2 rounded-full bg-muted-foreground/20 shrink-0 mt-1.5" />;
}

export function ProcessingState({ startedAt, projectId }: ProcessingStateProps) {
  const [elapsed, setElapsed] = useState(0);
  const [logs, setLogs] = useState<AnalysisLog[]>([]);

  useEffect(() => {
    const start = startedAt ? new Date(startedAt).getTime() : Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  useEffect(() => {
    if (!projectId) return;

    const fetchLogs = async () => {
      const { data } = await supabase
        .from("analysis_logs")
        .select("*")
        .eq("project_id", projectId)
        .order("step_index", { ascending: true });
      if (data) setLogs(data as AnalysisLog[]);
    };

    fetchLogs();

    const channel = supabase
      .channel(`analysis-logs-${projectId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "analysis_logs", filter: `project_id=eq.${projectId}` }, () => fetchLogs())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId]);

  const completedSteps = logs.filter((l) => l.status === "complete").length;
  const totalSteps = logs.length > 0 ? logs[0].total_steps : 13;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const phases = useMemo(() => groupIntoPhases(logs), [logs]);
  const minutes = Math.floor(elapsed / 60);

  // Compute sources ingested (completed research steps)
  const sourcesIngested = logs.filter((l) => l.status === "complete" && l.step_index >= 3 && l.step_index <= 8).length;
  // Claims = total completed
  const claimsCrossRef = completedSteps;

  return (
    <div className="space-y-6">
      <BlurFade>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analysis Log</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete record of all research actions and automated ingestion cycles.
          </p>
        </div>
      </BlurFade>

      {/* Metric cards */}
      <BlurFade delay={0.05}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MagicCard>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Overall Progress</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">{progressPercent}%</span>
              <span className="text-[10px] font-bold uppercase text-score-strong">Active</span>
            </div>
            <Progress value={progressPercent} className="h-1 mt-2" />
          </MagicCard>
          <MagicCard>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sources</p>
            <span className="mt-2 block text-2xl font-bold text-foreground">
              <NumberTicker value={sourcesIngested} />
            </span>
            <p className="text-[10px] text-muted-foreground mt-0.5">Ingested to Vault</p>
          </MagicCard>
          <MagicCard>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Claims Identified</p>
            <span className="mt-2 block text-2xl font-bold text-foreground">
              <NumberTicker value={claimsCrossRef} />
            </span>
            <p className="text-[10px] text-muted-foreground mt-0.5">Cross-reference map</p>
          </MagicCard>
          <MagicCard>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Elapsed Time</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">{minutes}</span>
              <span className="text-sm text-muted-foreground">min</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">L1 Latency Monitor</p>
          </MagicCard>
        </div>
      </BlurFade>

      {/* Phases timeline */}
      <div className="space-y-6">
        {phases.map((phase, phaseIdx) => (
          <BlurFade key={phase.name} delay={0.1 + phaseIdx * 0.05}>
            <div>
              {/* Phase header */}
              <div className="flex items-center gap-3 mb-3">
                <PhaseIcon status={phase.status} />
                <h2 className="text-xl font-bold text-foreground">{phase.name}</h2>
                <PhaseStatusBadge status={phase.status} completedCount={phase.completedCount} totalCount={phase.totalCount} />
              </div>

              {/* Step items */}
              {phase.items.length > 0 && (
                <div className="ml-3 border-l-2 border-border pl-6 space-y-0">
                  {phase.items.map((log) => (
                    <div key={log.id} className="relative py-2">
                      <div className="flex items-start gap-3">
                        <StepDot status={log.status} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm font-semibold ${log.status === "running" ? "text-foreground" : log.status === "complete" ? "text-foreground" : "text-muted-foreground"}`}>
                              {log.step_label}
                            </span>
                            {log.started_at && (
                              <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                                {formatTime(log.started_at)}
                              </span>
                            )}
                          </div>
                          {log.detail && (
                            <div className={`mt-1 text-sm leading-relaxed ${
                              log.status === "error"
                                ? "rounded-lg bg-severity-critical/5 border border-severity-critical/20 p-3 text-severity-critical"
                                : "text-muted-foreground"
                            }`}>
                              {log.detail}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {phase.items.length === 0 && phase.status === "pending" && (
                <div className="ml-3 border-l-2 border-border pl-6 py-3">
                  <p className="text-sm text-muted-foreground italic">Pending previous phase</p>
                </div>
              )}
            </div>
          </BlurFade>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground/60 text-center pt-2">
        You can safely navigate away — we'll notify you when it's ready.
      </p>
    </div>
  );
}
