import { GpPagePlaceholder } from "@/components/gp/GpPagePlaceholder";

const COMPONENTS = [
  { name: "Dataroom", pct: 92 },
  { name: "IRIS Report", pct: 85 },
  { name: "DDQ", pct: 64 },
  { name: "IRIS Interview", pct: 70 },
];

export default function RaiseOverview() {
  const overall = Math.round(COMPONENTS.reduce((a, c) => a + c.pct, 0) / COMPONENTS.length);
  return (
    <GpPagePlaceholder title="Overview" description="Completion across the four components of a Raise.">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-foreground">Raise completion</p>
          <p className="text-2xl font-semibold text-foreground tabular-nums">{overall}%</p>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-foreground" style={{ width: `${overall}%` }} />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          {COMPONENTS.map((c) => (
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
    </GpPagePlaceholder>
  );
}