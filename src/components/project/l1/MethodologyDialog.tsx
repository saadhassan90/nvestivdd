import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Methodology } from "@/types/renderContract";

export function MethodologyDialog({ methodology }: { methodology: Methodology }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border rounded-md px-2 py-1"
        >
          <Info className="h-3 w-3" /> Methodology
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Coverage & completeness</DialogTitle>
          <DialogDescription className="text-xs">
            Per-topic search venues, hits, and overall data completeness for this analysis.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-xs">
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 flex items-center justify-between">
            <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">Completeness</span>
            <span className="text-lg font-bold tabular-nums">{methodology.completeness_pct}%</span>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left font-semibold py-1.5">Topic</th>
                <th className="text-right font-semibold py-1.5">Venues</th>
                <th className="text-right font-semibold py-1.5">Hits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {methodology.coverage.map((c) => (
                <tr key={c.topic}>
                  <td className="py-1.5 pr-2 text-foreground/85">{c.topic}</td>
                  <td className="py-1.5 text-right tabular-nums">{c.venues_searched}</td>
                  <td className="py-1.5 text-right tabular-nums">{c.hits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}