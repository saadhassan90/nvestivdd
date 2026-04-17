import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2, Loader2, AlertCircle, RefreshCw,
  Upload, Image, Eye, FileSearch, Tags, LayoutGrid,
  Brain, Network, Building2, TrendingUp, Globe, Users, ClipboardCheck,
  ChevronDown, ChevronRight, Terminal, Cpu, ListChecks, Microscope, Database, FileWarning, Link2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { BlurFade } from "@/components/magicui/BlurFade";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import { FieldValueGrid } from "@/components/project/primitives/FieldValueGrid";
import { cn } from "@/lib/utils";

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

const WORKFLOW_STEPS = [
  { key: "upload",              label: "Upload",                            icon: Upload,          index: 0 },
  { key: "page_conversion",     label: "Page Conversion",                   icon: Image,           index: 1 },
  { key: "document_preview",    label: "Document Preview",                  icon: Eye,             index: 2 },
  { key: "document_parsing",    label: "Document Parsing",                  icon: FileSearch,      index: 3 },
  { key: "fund_classification", label: "Fund Classification",               icon: Tags,            index: 4 },
  { key: "slide_topology",      label: "Slide Topology Analysis",           icon: LayoutGrid,      index: 5 },
  { key: "entity_extraction",   label: "Entity Extraction",                 icon: Brain,           index: 6 },
  { key: "ontology",            label: "Master Ontology Consolidation",     icon: Network,         index: 7 },
  { key: "sec_filing",          label: "SEC Filing Diligence",              icon: Building2,       index: 8 },
  { key: "fund_maturity",       label: "Fund Maturity Analysis",            icon: TrendingUp,      index: 9 },
  { key: "website_discovery",   label: "Website Discovery",                 icon: Globe,           index: 10 },
  { key: "personnel",           label: "Key Personnel Intelligence",        icon: Users,           index: 11 },
  { key: "verification",        label: "Verification Checklist Generation", icon: ClipboardCheck,  index: 12 },
];

const DOMAIN_RESEARCH_BLOCKS = [
  { key: "8.1", label: "8.1 — Market Conditions" },
  { key: "8.2", label: "8.2 — Sub-Market" },
  { key: "8.3", label: "8.3 — Exit Environment" },
  { key: "8.4", label: "8.4 — Regulatory Environment" },
];

const DOMAIN_QUESTIONNAIRE = [
  "GP claims",
  "M&A context",
  "Credit / leverage context",
  "Execution risk",
  "Customer context",
  "Regulatory context",
  "Recent developments",
  "Public markets signal",
  "Assessment (synthesis)",
];

function getStepStatus(log: AnalysisLog | undefined): "complete" | "running" | "error" | "pending" {
  if (!log) return "pending";
  if (log.status === "complete") return "complete";
  if (log.status === "error") return "error";
  if (log.status === "running") return "running";
  return "pending";
}

function StatusBadge({ status }: { status: string }) {
  if (status === "complete") return <span className="inline-flex items-center gap-1.5 rounded-full bg-score-strong/10 px-2.5 py-0.5 text-[11px] font-semibold text-score-strong"><CheckCircle2 className="h-3 w-3" />Complete</span>;
  if (status === "running") return <span className="inline-flex items-center gap-1.5 rounded-full bg-severity-monitor/10 px-2.5 py-0.5 text-[11px] font-semibold text-severity-monitor"><Loader2 className="h-3 w-3 animate-spin" />Running</span>;
  if (status === "error") return <span className="inline-flex items-center gap-1.5 rounded-full bg-severity-critical/10 px-2.5 py-0.5 text-[11px] font-semibold text-severity-critical"><AlertCircle className="h-3 w-3" />Needs attention</span>;
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">Pending</span>;
}

function StepIcon({ icon: Icon, status }: { icon: React.ElementType; status: string }) {
  const c: Record<string, string> = {
    complete: "bg-score-strong/10 text-score-strong",
    running: "bg-severity-monitor/10 text-severity-monitor",
    error: "bg-severity-critical/10 text-severity-critical",
    pending: "bg-muted text-muted-foreground",
  };
  return <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", c[status] || c.pending)}><Icon className="h-4 w-4" /></div>;
}

function formatTimestamp(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
}

export function ProcessingState({ startedAt, projectId }: ProcessingStateProps) {
  const [elapsed, setElapsed] = useState(0);
  const [logs, setLogs] = useState<AnalysisLog[]>([]);
  const [executionExpanded, setExecutionExpanded] = useState(true);

  useEffect(() => {
    const start = startedAt ? new Date(startedAt).getTime() : Date.now();
    const t = setInterval(() => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000))), 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  useEffect(() => {
    if (!projectId) return;
    const fetchLogs = async () => {
      const { data } = await supabase.from("analysis_logs").select("*").eq("project_id", projectId).order("step_index", { ascending: true });
      if (data) setLogs(data as AnalysisLog[]);
    };
    fetchLogs();
    const ch = supabase
      .channel(`analysis-logs-${projectId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "analysis_logs", filter: `project_id=eq.${projectId}` }, () => fetchLogs())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [projectId]);

  const logMap = useMemo(() => {
    const m: Record<string, AnalysisLog> = {};
    for (const l of logs) m[l.step_key] = l;
    return m;
  }, [logs]);

  const completed = logs.filter((l) => l.status === "complete").length;
  const total = WORKFLOW_STEPS.length;
  const pct = Math.round((completed / total) * 100);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="space-y-5">
      {/* Pipeline Metadata */}
      <BlurFade>
        <SectionCard title="Pipeline Metadata" subtitle="Analyst · scorecard · subagents" icon={<Cpu className="h-4 w-4" />}>
          <FieldValueGrid
            rows={[
              { label: "Analyst", value: "nvestiv-pipeline-v1" },
              { label: "Scorecard Version", value: "v1.0" },
              { label: "Analysis Date", value: new Date().toLocaleDateString() },
              { label: "Orchestrator", value: "process-task-queue" },
              { label: "Subagents", value: "13 (workflow steps)" },
              { label: "Related Prior Report", value: null },
            ]}
          />
        </SectionCard>
      </BlurFade>

      {/* Overall progress + workflow */}
      <BlurFade delay={0.04}>
        <SectionCard
          title="Workflow Progress"
          subtitle={`Pipeline execution · ${completed}/${total} steps · ${minutes}:${seconds.toString().padStart(2, "0")} elapsed`}
          icon={<ListChecks className="h-4 w-4" />}
        >
          <Progress value={pct} className="h-2 mb-4" />
          <div className="space-y-1">
            {WORKFLOW_STEPS.map((step, i) => {
              const log = logMap[step.key];
              const status = getStepStatus(log);
              const isLast = i === WORKFLOW_STEPS.length - 1;
              return (
                <div key={step.key} className="relative">
                  {!isLast && <div className={cn("absolute left-[18px] top-10 w-px h-3", status === "complete" ? "bg-score-strong/30" : "bg-border")} />}
                  <div className={cn("flex items-start gap-3 rounded-lg px-2 py-2", status === "running" && "bg-severity-monitor/[0.04]", status === "error" && "bg-severity-critical/[0.04]")}>
                    <StepIcon icon={step.icon} status={status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("text-xs font-semibold", status === "pending" ? "text-muted-foreground" : "text-foreground")}>{step.label}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {(status === "error" || status === "pending") && (
                            <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><RefreshCw className="h-3 w-3" /></button>
                          )}
                          <StatusBadge status={status} />
                        </div>
                      </div>
                      {log?.detail && <p className={cn("text-[11px] mt-0.5", status === "error" ? "text-severity-critical/80" : "text-muted-foreground")}>{log.detail}</p>}
                      {log?.started_at && <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{formatTimestamp(log.started_at)}{log.completed_at && ` → ${formatTimestamp(log.completed_at)}`}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </BlurFade>

      {/* Verification Actions Completed */}
      <BlurFade delay={0.06}>
        <SectionCard title="Verification Actions Completed" subtitle="Per-dimension verification checklist" icon={<CheckCircle2 className="h-4 w-4" />} empty emptyMessage="No verification actions logged yet." />
      </BlurFade>

      {/* Domain Research Blocks */}
      <BlurFade delay={0.08}>
        <SectionCard title="Domain Research" subtitle="Sections 8.1–8.4 · 9-item questionnaire each" icon={<Microscope className="h-4 w-4" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DOMAIN_RESEARCH_BLOCKS.map((b) => (
              <div key={b.key} className="rounded-md border border-border p-3">
                <p className="text-xs font-bold text-foreground mb-2">{b.label}</p>
                <ul className="space-y-0.5">
                  {DOMAIN_QUESTIONNAIRE.map((q) => (
                    <li key={q} className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SectionCard>
      </BlurFade>

      {/* Market Context */}
      <BlurFade delay={0.1}>
        <SectionCard title="Market Context" subtitle="Current-period sector data" icon={<Database className="h-4 w-4" />}>
          <FieldValueGrid
            rows={[
              { label: "Entry Multiple Range", value: null },
              { label: "Leverage Range", value: null },
              { label: "LP Co-investment Adoption %", value: null },
              { label: "Sub-$1B Fundraising Avg Months", value: null },
              { label: "GP-led CV Adoption %", value: null },
              { label: "Fee Norms", value: null },
            ]}
          />
        </SectionCard>
      </BlurFade>

      {/* Evidence Gaps Register */}
      <BlurFade delay={0.12}>
        <SectionCard title="Evidence Gaps Register" subtitle="Union of dimension gaps + Section 7.7 gap register" icon={<FileWarning className="h-4 w-4" />} empty emptyMessage="No evidence gaps logged at L1." />
      </BlurFade>

      {/* Cross-reference Inheritance */}
      <BlurFade delay={0.14}>
        <SectionCard title="Cross-reference Inheritance" subtitle="Carry-forward flags from prior reports" icon={<Link2 className="h-4 w-4" />} empty emptyMessage="No cross-reference inheritance at L1." />
      </BlurFade>

      {/* Execution log */}
      <BlurFade delay={0.16}>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button onClick={() => setExecutionExpanded((e) => !e)} className="flex w-full items-center justify-between px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-mono font-medium text-foreground">execution.log</span>
            </div>
            {executionExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
          {executionExpanded && (
            <div className="bg-[hsl(220,15%,6%)] px-4 py-3 max-h-72 overflow-y-auto font-mono text-[11px] leading-relaxed">
              {logs.length === 0 && <p className="text-muted-foreground">Waiting for execution events...</p>}
              {logs
                .filter((l) => l.started_at)
                .sort((a, b) => new Date(a.started_at!).getTime() - new Date(b.started_at!).getTime())
                .map((l) => (
                  <div key={l.id} className="flex gap-2">
                    <span className="text-muted-foreground/60">{formatTimestamp(l.started_at)}</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-muted-foreground">[{l.step_label}]</span>
                    <span className={l.status === "error" ? "text-severity-critical font-semibold" : "text-foreground/80"}>
                      {l.status === "complete" && l.completed_at
                        ? `completed in ${((new Date(l.completed_at).getTime() - new Date(l.started_at!).getTime()) / 1000).toFixed(1)}s`
                        : l.status === "error" && l.detail
                          ? l.detail
                          : `${l.status}`}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </BlurFade>
    </div>
  );
}
