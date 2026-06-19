import { useParams } from "react-router-dom";
import { GpPagePlaceholder } from "@/components/gp/GpPagePlaceholder";
import { getRaise, overallCompletion } from "@/mocks/gp/raises";

export default function RaiseOverview() {
  const { fundId } = useParams();
  const raise = getRaise(fundId);
  if (!raise) return null;
  const overall = overallCompletion(raise);
  const components = [
    { name: "Dataroom", pct: raise.completion.dataroom },
    { name: "IRIS Report", pct: raise.completion.report },
    { name: "DDQ", pct: raise.completion.ddq },
    { name: "IRIS Interview", pct: raise.completion.interview },
  ];
  const stats = [
    { label: "Files in dataroom", value: raise.dataroom.length },
    { label: "DDQ items", value: raise.ddq.length },
    { label: "Unanswered DDQ", value: raise.ddq.filter((d) => d.state === "unanswered").length },
    { label: "L2 LPs engaged", value: raise.lps.length },
  ];
  return (
    <GpPagePlaceholder>
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-foreground">Raise completion</p>
          <p className="text-2xl font-semibold text-foreground tabular-nums">{overall}%</p>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-foreground" style={{ width: `${overall}%` }} />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          {components.map((c) => (
            <div key={c.name}>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{c.name}</span>
                <span className="tabular-nums">{c.pct}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-foreground/60" style={{ width: `${c.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums mt-1">{s.value}</p>
          </div>
        ))}
      </div>
    </GpPagePlaceholder>
  );
}