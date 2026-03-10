import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Loader2, AlertCircle, Brain, FileSearch, Zap, Shield, Users, TrendingUp, Target, FileText, HelpCircle, FolderOpen, Award, BookOpen, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { BlurFade } from "@/components/magicui/BlurFade";
import { BorderBeam } from "@/components/magicui/BorderBeam";

interface AnalysisLog {
  id: string;
  step_key: string;
  step_label: string;
  step_index: number;
  total_steps: number;
  status: string;
  detail: string | null;
  started_at: string;
  completed_at: string | null;
}

interface ProcessingStateProps {
  startedAt?: string;
  projectId?: string;
}

const STEP_ICONS: Record<string, React.ReactNode> = {
  download_docs: <FileSearch className="h-4 w-4" />,
  opus_analysis: <Brain className="h-4 w-4" />,
  sonnet_assembly: <FileText className="h-4 w-4" />,
  node_0: <Package className="h-4 w-4" />,
  node_1: <Zap className="h-4 w-4" />,
  node_2: <TrendingUp className="h-4 w-4" />,
  node_3: <Users className="h-4 w-4" />,
  node_4: <Target className="h-4 w-4" />,
  node_5: <FileText className="h-4 w-4" />,
  node_6: <Shield className="h-4 w-4" />,
  node_7: <AlertCircle className="h-4 w-4" />,
  node_8: <HelpCircle className="h-4 w-4" />,
  node_9: <FolderOpen className="h-4 w-4" />,
  node_10: <Award className="h-4 w-4" />,
  node_11: <BookOpen className="h-4 w-4" />,
  node_12: <Package className="h-4 w-4" />,
  saving_report: <FileText className="h-4 w-4" />,
  extracting_data: <Zap className="h-4 w-4" />,
};

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "complete":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "running":
      return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground/30" />;
  }
}

export function ProcessingState({ startedAt, projectId }: ProcessingStateProps) {
  const [elapsed, setElapsed] = useState(() => {
    if (startedAt) {
      return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    }
    return 0;
  });
  const [logs, setLogs] = useState<AnalysisLog[]>([]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (startedAt) {
        setElapsed(Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)));
      } else {
        setElapsed(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  // Fetch initial logs + subscribe to realtime
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "analysis_logs", filter: `project_id=eq.${projectId}` },
        () => {
          // Refetch all logs on any change to keep order consistent
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  // Calculate progress
  const completedSteps = logs.filter(l => l.status === "complete").length;
  const totalSteps = logs.length > 0 ? logs[0].total_steps : 17;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Current active step
  const activeStep = logs.find(l => l.status === "running");

  return (
    <BlurFade>
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Progress header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <h3 className="text-lg font-bold text-foreground">Analysis in Progress</h3>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
          </div>

          {/* Progress bar */}
          <div className="relative">
            <Progress value={progressPercent} className="h-2" />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">
                {activeStep ? activeStep.step_label : "Initializing..."}
              </span>
              <span className="text-xs font-medium text-foreground">{progressPercent}%</span>
            </div>
          </div>
        </div>

        {/* Step feed */}
        <div className="relative rounded-lg border border-border bg-card overflow-hidden">
          <BorderBeam size={120} duration={8} />
          <div className="p-4">
            <h4 className="text-sm font-semibold text-foreground mb-3">Analysis Steps</h4>
            <div className="space-y-1">
              {logs.length === 0 ? (
                <div className="flex items-center gap-3 py-2">
                  <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                  <span className="text-sm text-muted-foreground">Waiting for analysis to start...</span>
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-3 py-2 px-2 rounded-md transition-colors ${
                      log.status === "running"
                        ? "bg-primary/5 border border-primary/10"
                        : log.status === "complete"
                        ? "opacity-80"
                        : log.status === "error"
                        ? "bg-destructive/5 border border-destructive/10"
                        : "opacity-40"
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      <StatusIcon status={log.status} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground flex-shrink-0">
                          {STEP_ICONS[log.step_key] || <Circle className="h-4 w-4" />}
                        </span>
                        <span className={`text-sm font-medium truncate ${
                          log.status === "running" ? "text-foreground" :
                          log.status === "complete" ? "text-foreground" :
                          "text-muted-foreground"
                        }`}>
                          {log.step_label}
                        </span>
                      </div>
                      {log.detail && (
                        <p className="text-xs text-muted-foreground mt-0.5 ml-6 truncate">
                          {log.detail}
                        </p>
                      )}
                    </div>
                    {log.completed_at && log.started_at && (
                      <span className="text-[10px] text-muted-foreground/60 font-mono flex-shrink-0 mt-0.5">
                        {Math.round((new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 1000)}s
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground/60 mt-4 text-center">
          You can safely navigate away — we'll notify you when it's ready.
        </p>
      </div>
    </BlurFade>
  );
}
