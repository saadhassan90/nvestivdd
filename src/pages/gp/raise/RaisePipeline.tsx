import { useParams } from "react-router-dom";
import { GpPagePlaceholder } from "@/components/gp/GpPagePlaceholder";
import { getRaise, type ConsentState } from "@/mocks/gp/raises";
import { cn } from "@/lib/utils";

const CONSENT_STYLES: Record<ConsentState, string> = {
  shared: "border-foreground/30 text-foreground bg-muted/40",
  pending: "border-border text-muted-foreground",
  withdrawn: "border-destructive/40 text-destructive",
};

export default function RaisePipeline() {
  const { fundId } = useParams();
  const raise = getRaise(fundId);
  if (!raise) return null;
  if (raise.lps.length === 0) {
    return (
      <GpPagePlaceholder>
        <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-16 text-center text-sm text-muted-foreground">
          No L2 LPs yet on this raise.
        </div>
      </GpPagePlaceholder>
    );
  }
  return (
    <GpPagePlaceholder>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1.5fr_120px_110px_90px_120px] text-[11px] uppercase tracking-wider text-muted-foreground px-4 py-2 border-b border-border bg-muted/30">
          <div>LP</div><div>Type</div><div>Consent</div><div>Questions</div><div>Last activity</div>
        </div>
        {raise.lps.map((lp) => (
          <div key={lp.id} className="grid grid-cols-[1.5fr_120px_110px_90px_120px] items-center px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 text-sm">
            <div className="text-foreground font-medium">{lp.name}</div>
            <div className="text-xs text-muted-foreground">{lp.type}</div>
            <div>
              <span className={cn("text-[10px] uppercase tracking-wider border rounded px-1.5 py-0.5", CONSENT_STYLES[lp.consent])}>
                {lp.consent}
              </span>
            </div>
            <div className="text-xs text-muted-foreground tabular-nums">{lp.questions}</div>
            <div className="text-xs text-muted-foreground">{lp.lastActivity}</div>
          </div>
        ))}
      </div>
    </GpPagePlaceholder>
  );
}