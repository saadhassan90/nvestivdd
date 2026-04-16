import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2, Loader2, AlertCircle, RefreshCw,
  Upload, Image, Eye, FileSearch, Tags, LayoutGrid,
  Brain, Network, Building2, TrendingUp, Globe, Users, ClipboardCheck,
  ChevronDown, ChevronRight, ExternalLink, Terminal
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { BlurFade } from "@/components/magicui/BlurFade";
import { cn } from "@/lib/utils";

/* ────── Types ────── */

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

/* ────── Step definitions ────── */

const WORKFLOW_STEPS = [
  { key: "upload",              label: "Upload",                         icon: Upload,          index: 0 },
  { key: "page_conversion",     label: "Page Conversion",                icon: Image,           index: 1 },
  { key: "document_preview",    label: "Document Preview",               icon: Eye,             index: 2 },
  { key: "document_parsing",    label: "Document Parsing",               icon: FileSearch,      index: 3 },
  { key: "fund_classification", label: "Fund Classification",            icon: Tags,            index: 4 },
  { key: "slide_topology",      label: "Slide Topology Analysis",        icon: LayoutGrid,      index: 5 },
  { key: "entity_extraction",   label: "Entity Extraction",              icon: Brain,           index: 6 },
  { key: "ontology",            label: "Master Ontology Consolidation",  icon: Network,         index: 7 },
  { key: "sec_filing",          label: "SEC Filing Diligence",           icon: Building2,       index: 8 },
  { key: "fund_maturity",       label: "Fund Maturity Analysis",         icon: TrendingUp,      index: 9 },
  { key: "website_discovery",   label: "Website Discovery",              icon: Globe,           index: 10 },
  { key: "personnel",           label: "Key Personnel Intelligence",     icon: Users,           index: 11 },
  { key: "verification",        label: "Verification Checklist Generation", icon: ClipboardCheck, index: 12 },
];

/* ────── Helpers ────── */

function getStepStatus(log: AnalysisLog | undefined): "complete" | "running" | "error" | "pending" {
  if (!log) return "pending";
  if (log.status === "complete") return "complete";
  if (log.status === "error") return "error";
  if (log.status === "running") return "running";
  return "pending";
}

function StatusBadge({ status }: { status: string }) {
  if (status === "complete") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-score-strong/10 px-2.5 py-0.5 text-[11px] font-semibold text-score-strong">
        <CheckCircle2 className="h-3 w-3" /> Complete
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-severity-monitor/10 px-2.5 py-0.5 text-[11px] font-semibold text-severity-monitor">
        <Loader2 className="h-3 w-3 animate-spin" /> Running
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-severity-critical/10 px-2.5 py-0.5 text-[11px] font-semibold text-severity-critical">
        <AlertCircle className="h-3 w-3" /> Needs attention
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
      Pending
    </span>
  );
}

function StepIcon({ icon: Icon, status }: { icon: React.ElementType; status: string }) {
  const colorMap: Record<string, string> = {
    complete: "bg-score-strong/10 text-score-strong",
    running: "bg-severity-monitor/10 text-severity-monitor",
    error: "bg-severity-critical/10 text-severity-critical",
    pending: "bg-muted text-muted-foreground",
  };
  return (
    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", colorMap[status] || colorMap.pending)}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

function formatTimestamp(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
}

/* ────── Execution Log ────── */

interface LogEntry {
  time: string;
  label: string;
  message: string;
  isError: boolean;
}

function ExecutionLog({ logs, projectStatus }: { logs: AnalysisLog[]; projectStatus: string }) {
  const [expanded, setExpanded] = useState(true);

  const entries = useMemo<LogEntry[]>(() => {
    return logs
      .filter((l) => l.started_at)
      .sort((a, b) => new Date(a.started_at!).getTime() - new Date(b.started_at!).getTime())
      .flatMap((l) => {
        const items: LogEntry[] = [];
        items.push({
          time: formatTimestamp(l.started_at),
          label: l.step_label,
          message: `started execution`,
          isError: false,
        });
        if (l.status === "error" && l.detail) {
          items.push({
            time: formatTimestamp(l.completed_at || l.started_at),
            label: l.step_label,
            message: l.detail,
            isError: true,
          });
        }
        if (l.status === "complete" && l.completed_at) {
          const durationMs = new Date(l.completed_at).getTime() - new Date(l.started_at!).getTime();
          const durationStr = durationMs > 1000 ? `${(durationMs / 1000).toFixed(1)}s` : `${durationMs}ms`;
          items.push({
            time: formatTimestamp(l.completed_at),
            label: l.step_label,
            message: `completed in ${durationStr}`,
            isError: false,
          });
        }
        return items;
      });
  }, [logs]);

  const hasFailed = projectStatus === "error" || logs.some((l) => l.status === "error");

  return (
    <div className="rounded-xl border border-border bg-[hsl(var(--card))] overflow-hidden">
      {/* Header bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-mono font-medium text-foreground">execution.log</span>
          {hasFailed && (
            <span className="rounded bg-severity-critical/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-severity-critical">
              Failed
            </span>
          )}
          {!hasFailed && entries.length > 0 && (
            <span className="rounded bg-score-strong/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-score-strong">
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="bg-[hsl(220,15%,6%)] px-4 py-3 max-h-72 overflow-y-auto font-mono text-[12px] leading-relaxed">
          {entries.length === 0 && (
            <p className="text-muted-foreground">Waiting for execution events...</p>
          )}
          {entries.map((entry, i) => (
            <div key={i} className="flex gap-3">
              <span className="shrink-0 text-muted-foreground/60">{entry.time}</span>
              <span className="shrink-0 text-muted-foreground">|</span>
              <span className="text-muted-foreground">[{entry.label}]</span>
              <span className={entry.isError ? "text-severity-critical font-semibold" : "text-foreground/80"}>
                {entry.message}
              </span>
            </div>
          ))}
          {hasFailed && (
            <div className="mt-3 text-severity-critical font-semibold">
              ✕ Error: Task Failed. Check full logs for details.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ────── Main Component ────── */

export function ProcessingState({ startedAt, projectId }: ProcessingStateProps) {
  const [elapsed, setElapsed] = useState(0);
  const [logs, setLogs] = useState<AnalysisLog[]>([]);
  const [projectStatus, setProjectStatus] = useState("processing");

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

    const fetchProjectStatus = async () => {
      const { data } = await supabase
        .from("projects")
        .select("status")
        .eq("id", projectId)
        .single();
      if (data) setProjectStatus(data.status);
    };

    fetchLogs();
    fetchProjectStatus();

    const channel = supabase
      .channel(`analysis-logs-${projectId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "analysis_logs", filter: `project_id=eq.${projectId}` }, () => fetchLogs())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "projects", filter: `id=eq.${projectId}` }, () => fetchProjectStatus())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId]);

  // Map logs by step_key for quick lookup
  const logMap = useMemo(() => {
    const m: Record<string, AnalysisLog> = {};
    for (const l of logs) m[l.step_key] = l;
    return m;
  }, [logs]);

  const completedSteps = logs.filter((l) => l.status === "complete").length;
  const totalSteps = WORKFLOW_STEPS.length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="space-y-6">
      {/* Header */}
      <BlurFade>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analysis Log</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pipeline execution for automated fund diligence workflow.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Elapsed</p>
              <p className="text-lg font-bold font-mono text-foreground">
                {minutes}:{seconds.toString().padStart(2, "0")}
              </p>
            </div>
          </div>
        </div>
      </BlurFade>

      {/* Overall progress */}
      <BlurFade delay={0.05}>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-foreground">Overall Progress</span>
            <span className="text-sm font-bold text-foreground">{completedSteps}/{totalSteps} steps</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-[11px] text-muted-foreground mt-1.5">{progressPercent}% complete</p>
        </div>
      </BlurFade>

      {/* Workflow steps */}
      <div className="space-y-0">
        {WORKFLOW_STEPS.map((step, i) => {
          const log = logMap[step.key];
          const status = getStepStatus(log);
          const isLast = i === WORKFLOW_STEPS.length - 1;

          return (
            <BlurFade key={step.key} delay={0.08 + i * 0.02}>
              <div className="relative">
                {/* Connector line */}
                {!isLast && (
                  <div className={cn(
                    "absolute left-5 top-[3.25rem] w-px h-[calc(100%-1rem)]",
                    status === "complete" ? "bg-score-strong/30" : "bg-border"
                  )} />
                )}

                <div className={cn(
                  "flex items-start gap-4 rounded-xl px-4 py-3 transition-colors",
                  status === "running" && "bg-severity-monitor/[0.03]",
                  status === "error" && "bg-severity-critical/[0.03]",
                )}>
                  <StepIcon icon={step.icon} status={status} />

                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className={cn(
                        "text-sm font-semibold",
                        status === "pending" ? "text-muted-foreground" : "text-foreground"
                      )}>
                        {step.label}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        {(status === "error" || status === "pending") && (
                          <button className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <StatusBadge status={status} />
                      </div>
                    </div>

                    {/* Detail / description */}
                    {log?.detail && (
                      <p className={cn(
                        "text-[13px] mt-1 leading-relaxed",
                        status === "error" ? "text-severity-critical/80" : "text-muted-foreground"
                      )}>
                        {log.detail}
                      </p>
                    )}

                    {/* Timestamp */}
                    {log?.started_at && (
                      <p className="text-[11px] text-muted-foreground/50 font-mono mt-1">
                        {formatTimestamp(log.started_at)}
                        {log.completed_at && ` → ${formatTimestamp(log.completed_at)}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </BlurFade>
          );
        })}
      </div>

      {/* Execution Log */}
      <BlurFade delay={0.4}>
        <ExecutionLog logs={logs} projectStatus={projectStatus} />
      </BlurFade>

      <p className="text-[11px] text-muted-foreground/60 text-center pt-2">
        You can safely navigate away — we'll notify you when it's ready.
      </p>
    </div>
  );
}
