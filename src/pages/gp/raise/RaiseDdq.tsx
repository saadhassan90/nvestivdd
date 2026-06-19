import { useState } from "react";
import { useParams } from "react-router-dom";
import { GpPagePlaceholder } from "@/components/gp/GpPagePlaceholder";
import { getRaise, type DdqState, type DdqProvenance } from "@/mocks/gp/raises";
import { cn } from "@/lib/utils";

const STATES: { key: DdqState | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "answered", label: "Answered" },
  { key: "unanswered", label: "Unanswered" },
  { key: "suggested", label: "IRIS-suggested" },
];

const PROVENANCE_STYLES: Record<DdqProvenance, string> = {
  ILPA: "border-border text-muted-foreground",
  IRIS: "border-foreground/30 text-foreground bg-muted/40",
  "LP-direct": "border-border text-foreground bg-card",
};

export default function RaiseDdq() {
  const { fundId } = useParams();
  const raise = getRaise(fundId);
  const [filter, setFilter] = useState<DdqState | "all">("all");
  if (!raise) return null;
  const items = filter === "all" ? raise.ddq : raise.ddq.filter((d) => d.state === filter);
  const counts = {
    all: raise.ddq.length,
    answered: raise.ddq.filter((d) => d.state === "answered").length,
    unanswered: raise.ddq.filter((d) => d.state === "unanswered").length,
    suggested: raise.ddq.filter((d) => d.state === "suggested").length,
  };
  return (
    <GpPagePlaceholder title="DDQ" description="Living Q&A. ILPA standard + IRIS-generated + LP-direct items.">
      <div className="flex gap-1 mb-4 flex-wrap">
        {STATES.map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={cn(
              "text-xs px-2.5 py-1 rounded-md border",
              filter === s.key ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {s.label} <span className="tabular-nums opacity-70">({counts[s.key]})</span>
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {items.map((d) => (
          <div key={d.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start gap-2">
              <span className={cn("text-[10px] uppercase tracking-wider border rounded px-1.5 py-0.5 shrink-0", PROVENANCE_STYLES[d.provenance])}>
                {d.provenance}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
                {d.section}
              </span>
              {d.state === "unanswered" && (
                <span className="text-[10px] uppercase tracking-wider text-destructive border border-destructive/40 rounded px-1.5 py-0.5">
                  Unanswered
                </span>
              )}
              {d.state === "suggested" && (
                <span className="text-[10px] uppercase tracking-wider text-foreground border border-border rounded px-1.5 py-0.5 bg-muted/50">
                  Suggested
                </span>
              )}
              <span className="ml-auto text-[11px] text-muted-foreground">{d.updatedAt}</span>
            </div>
            <p className="text-sm text-foreground mt-2">{d.question}</p>
            {d.answer ? (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{d.answer}</p>
            ) : (
              <p className="text-xs text-muted-foreground italic mt-2">No answer drafted yet.</p>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-12 text-center text-sm text-muted-foreground">
            No items in this filter.
          </div>
        )}
      </div>
    </GpPagePlaceholder>
  );
}