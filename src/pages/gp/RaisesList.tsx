import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { GpPagePlaceholder } from "@/components/gp/GpPagePlaceholder";
import { NewRaiseModal } from "@/components/gp/NewRaiseModal";
import { RAISES, overallCompletion, subscribeRaises } from "@/mocks/gp/raises";

export default function RaisesList() {
  const [, force] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => subscribeRaises(() => force((n) => n + 1)), []);

  return (
    <>
    <GpPagePlaceholder
      title="Raises"
      description="One record per raise. GPs may run several simultaneously."
      action={
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-3.5 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Raise
        </button>
      }
    >
      <div className="grid gap-3">
        {RAISES.map((r) => {
          const pct = overallCompletion(r);
          return (
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
                <span className="text-[10px] text-muted-foreground">· {r.strategy} · {r.targetSize}</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-foreground/70"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {pct}% complete · {r.lps.length} L2 LP{r.lps.length === 1 ? "" : "s"} · {r.ddq.length} DDQ items
              </p>
            </div>
          </Link>
          );
        })}
      </div>
    </GpPagePlaceholder>
    <NewRaiseModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}