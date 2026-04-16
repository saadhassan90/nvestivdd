import { Sparkles, Clock } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";

interface InsightsPanelProps {
  projectName?: string;
  isProcessing?: boolean;
}

/**
 * Right-side panel for system insights, filtered comments, and quick notes.
 * Shown during both processing and completed report states.
 */
export function InsightsPanel({ projectName, isProcessing }: InsightsPanelProps) {
  return (
    <aside className="hidden xl:flex flex-col w-[260px] shrink-0 border-l border-border bg-card h-full overflow-y-auto">
      <div className="p-4 space-y-5">
        {/* System Insights */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">System Insights</h3>
          </div>

          {isProcessing ? (
            <BlurFade>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">AI Observation</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  Analysis is currently in progress. System insights will populate as research phases complete and claims are cross-referenced.
                </p>
                <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider">
                  Confidence: Pending
                </p>
              </div>
            </BlurFade>
          ) : (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">AI Observation</span>
              </div>
              <p className="text-xs text-muted-foreground">
                No insights available yet.
              </p>
            </div>
          )}
        </div>

        {/* Filtered Comments */}
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Filtered Comments</h3>

          {isProcessing ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-foreground">System Log</span>
                  <span className="text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3 inline mr-0.5" />
                    Processing
                  </span>
                </div>
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  Automated audit trail will appear here as analysis progresses.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No comments yet.</p>
          )}
        </div>

        {/* Quick Comment */}
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Quick Comment</h3>
          <div className="relative">
            <textarea
              placeholder="Add observation to log..."
              className="w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
            />
            <button className="absolute bottom-2 right-2 p-1 rounded hover:bg-muted transition-colors">
              <span className="text-primary text-sm">▶</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
