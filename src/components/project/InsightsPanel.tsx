import { useState } from "react";
import { Sparkles, Plus } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";

interface InsightsPanelProps {
  projectName?: string;
  isProcessing?: boolean;
}

const FILTER_TABS = ["All", "Team", "AI"] as const;

export function InsightsPanel({ projectName, isProcessing }: InsightsPanelProps) {
  const [activeFilter, setActiveFilter] = useState<typeof FILTER_TABS[number]>("All");

  return (
    <aside className="hidden xl:flex flex-col w-[260px] shrink-0 border-l border-border bg-card h-full overflow-y-auto">
      <div className="p-4 space-y-5">
        {/* Header */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">Comments & Notes</h3>
          {/* Filter tabs */}
          <div className="flex items-center gap-0.5 mt-3 rounded-lg bg-muted p-0.5">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                  activeFilter === tab
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {isProcessing ? (
          <BlurFade>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Nvestiv AI</span>
                <span className="ml-auto text-[10px] text-muted-foreground">Now</span>
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                Analysis is currently in progress. Insights and comments will populate as research phases complete.
              </p>
            </div>
          </BlurFade>
        ) : (
          <div className="space-y-3">
            {/* Sample AI comment card */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <Sparkles className="h-3 w-3 text-primary-foreground" />
                </div>
                <span className="text-xs font-semibold text-foreground">Nvestiv AI</span>
                <span className="ml-auto text-[10px] text-muted-foreground">Now</span>
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                No AI observations generated yet. Comments will appear here as team members and the AI engine annotate the report.
              </p>
            </div>
          </div>
        )}

        {/* Add note button */}
        <button className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
          <Plus className="h-3.5 w-3.5" />
          Add note
        </button>
      </div>

      {/* Report level indicator at bottom */}
      <div className="mt-auto border-t border-border p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Report Level</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
            <span className="text-xs font-medium text-foreground">L1 Preliminary</span>
          </div>
          <div className="flex items-center gap-2 opacity-40">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            <span className="text-xs text-muted-foreground">L2 Detailed</span>
          </div>
          <div className="flex items-center gap-2 opacity-40">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            <span className="text-xs text-muted-foreground">L3 Final</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
