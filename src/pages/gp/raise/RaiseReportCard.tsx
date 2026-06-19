import { useParams } from "react-router-dom";
import { GpPagePlaceholder } from "@/components/gp/GpPagePlaceholder";
import { getRaise } from "@/mocks/gp/raises";

function scoreColor(s: number) {
  if (s >= 85) return "bg-foreground";
  if (s >= 70) return "bg-foreground/70";
  if (s >= 55) return "bg-foreground/50";
  return "bg-destructive/60";
}

export default function RaiseReportCard() {
  const { fundId } = useParams();
  const raise = getRaise(fundId);
  if (!raise) return null;
  const composite = Math.round(raise.report.reduce((a, r) => a + r.score, 0) / Math.max(raise.report.length, 1));
  return (
    <GpPagePlaceholder
      title="Report Card"
      description="IRIS analytical read. Section-addressable; re-synthesises incrementally on material change."
    >
      <div className="rounded-lg border border-border bg-card p-5 mb-4">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-foreground">Composite</p>
          <p className="text-2xl font-semibold text-foreground tabular-nums">{composite}</p>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className={"h-full " + scoreColor(composite)} style={{ width: `${composite}%` }} />
        </div>
      </div>
      <div className="space-y-3">
        {raise.report.map((r) => (
          <div key={r.id} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-foreground">{r.title}</h3>
              <div className="flex items-baseline gap-3">
                <span className="text-[11px] text-muted-foreground">synth {r.lastSynth}</span>
                <span className="text-xl font-semibold text-foreground tabular-nums">{r.score}</span>
              </div>
            </div>
            <div className="mt-2 h-1 w-full rounded-full bg-muted overflow-hidden">
              <div className={"h-full " + scoreColor(r.score)} style={{ width: `${r.score}%` }} />
            </div>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{r.summary}</p>
          </div>
        ))}
      </div>
    </GpPagePlaceholder>
  );
}