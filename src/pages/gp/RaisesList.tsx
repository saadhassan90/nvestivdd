import { Link } from "react-router-dom";
import { GpPagePlaceholder } from "@/components/gp/GpPagePlaceholder";

const MOCK_RAISES = [
  { id: "fund-001", name: "Meridian Credit Opportunities III", completion: 78, status: "Live", l2Lps: 4 },
  { id: "fund-002", name: "Aspen Growth Equity II", completion: 42, status: "In setup", l2Lps: 0 },
  { id: "fund-003", name: "Northwind Infra Yield", completion: 100, status: "Live", l2Lps: 9 },
];

export default function RaisesList() {
  return (
    <GpPagePlaceholder
      title="Raises"
      description="One record per raise. GPs may run several simultaneously."
    >
      <div className="grid gap-3">
        {MOCK_RAISES.map((r) => (
          <Link
            key={r.id}
            to={`/raises/${r.id}`}
            className="rounded-lg border border-border bg-card px-5 py-4 hover:bg-muted/40 transition-colors flex items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
                  {r.status}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-foreground/70"
                  style={{ width: `${r.completion}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {r.completion}% complete · {r.l2Lps} L2 LP{r.l2Lps === 1 ? "" : "s"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </GpPagePlaceholder>
  );
}