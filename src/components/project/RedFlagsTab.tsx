import { useState } from "react";
import { Plus } from "lucide-react";
import { MagicCard } from "@/components/magicui/MagicCard";
import { BlurFade } from "@/components/magicui/BlurFade";
import { ShimmerButton } from "@/components/magicui/ShimmerButton";
import { formatRelativeTime } from "@/lib/score-utils";
import type { Tables } from "@/integrations/supabase/types";

interface RedFlagsTabProps {
  redFlags: Tables<"red_flags">[];
}

const FILTER_TABS = ["All Flags", "Critical", "Elevated", "Monitor"];

export function RedFlagsTab({ redFlags }: RedFlagsTabProps) {
  const [activeFilter, setActiveFilter] = useState("All Flags");

  const filtered = activeFilter === "All Flags"
    ? redFlags
    : redFlags.filter(f => f.severity === activeFilter.toLowerCase());

  const criticalCount = redFlags.filter(f => f.severity === 'critical').length;
  const healthScore = Math.max(0, 100 - (criticalCount * 15) - (redFlags.length * 5));

  return (
    <div className="space-y-4 sm:space-y-6">
      <BlurFade>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Red Flag Analysis</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Real-time risk assessment and blocker tracking.</p>
          </div>
          <ShimmerButton className="text-sm self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            Log New Flag
          </ShimmerButton>
        </div>
      </BlurFade>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        {FILTER_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`rounded-full px-3 sm:px-4 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeFilter === tab
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Flag cards */}
      <div className="space-y-3">
        {filtered.map((flag, i) => (
          <BlurFade key={flag.id} delay={i * 0.05}>
            <MagicCard>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground ${
                      flag.severity === 'critical' ? 'bg-severity-critical' :
                      flag.severity === 'elevated' ? 'bg-severity-elevated' : 'bg-severity-monitor'
                    }`}>
                      {flag.severity}
                    </span>
                    <span className="flex items-center gap-1">
                      {[1,2,3].map(d => (
                        <span key={d} className={`h-1.5 w-1.5 rounded-full ${d <= (flag.confidence === 'high' ? 3 : flag.confidence === 'medium' ? 2 : 1) ? 'bg-foreground' : 'bg-border'}`} />
                      ))}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatRelativeTime(flag.logged_at)} • {flag.module || 'General'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground mt-1">{flag.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{flag.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button className="text-xs text-muted-foreground hover:text-foreground">Assign</button>
                  <button className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">Review</button>
                </div>
              </div>
            </MagicCard>
          </BlurFade>
        ))}
      </div>

      {/* Flag health */}
      <BlurFade delay={0.3}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-border bg-card px-4 sm:px-6 py-3 gap-2">
          <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider">Flag Health</span>
            <span className="font-bold text-foreground text-sm">{healthScore}/100</span>
            <span>{redFlags.length} Active</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Last scan 12 min ago</p>
        </div>
      </BlurFade>
    </div>
  );
}
