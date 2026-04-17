import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type Flag = Tables<"red_flags">;

interface FlagLaneProps {
  title: string;
  tone: "critical" | "elevated" | "monitor";
  flags: Flag[];
  emptyMessage?: string;
  renderFlag?: (flag: Flag) => ReactNode;
}

const TONE_STYLE = {
  critical: { dot: "bg-severity-critical", text: "text-severity-critical", border: "border-l-severity-critical" },
  elevated: { dot: "bg-severity-elevated", text: "text-severity-elevated", border: "border-l-severity-elevated" },
  monitor: { dot: "bg-severity-monitor", text: "text-severity-monitor", border: "border-l-severity-monitor" },
};

/** Renders a labeled lane of flags by severity. Always shows the header and a
 *  fallback "All clear" message per PRD §7.10. */
export function FlagLane({ title, tone, flags, emptyMessage = "All clear — no flags in this lane.", renderFlag }: FlagLaneProps) {
  const style = TONE_STYLE[tone];
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className={cn("h-2 w-2 rounded-full", style.dot)} />
        <span className={cn("text-[11px] font-bold uppercase tracking-wider", style.text)}>
          {title} ({flags.length})
        </span>
      </div>
      {flags.length === 0 ? (
        <p className="text-xs italic text-muted-foreground py-1">{emptyMessage}</p>
      ) : (
        <div className="space-y-2">
          {flags.map((flag) =>
            renderFlag ? (
              <div key={flag.id}>{renderFlag(flag)}</div>
            ) : (
              <div
                key={flag.id}
                className={cn("rounded-md border border-border border-l-2 bg-card px-3 py-2", style.border)}
              >
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-mono font-bold text-muted-foreground shrink-0 mt-0.5">
                    {flag.flag_number ? `#${flag.flag_number}` : "—"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">{flag.title}</p>
                    {flag.description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{flag.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
