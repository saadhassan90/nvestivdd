import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DIMENSION_WEIGHTS, DIMENSION_LABELS } from "@/lib/composite";

/**
 * PRD §8.2 — "How is this computed?" disclosure modal.
 * Shows the recommendation if/else ladder, 10 hard floors, six tiers, and composite weights.
 */

const TIERS: Array<{ label: string; range: string; tone: string }> = [
  { label: "Exceptional", range: "90–100", tone: "text-score-strong" },
  { label: "Strong", range: "75–89", tone: "text-score-strong" },
  { label: "Adequate", range: "60–74", tone: "text-score-advance" },
  { label: "Below Average", range: "40–59", tone: "text-score-review" },
  { label: "Concerning", range: "1–39", tone: "text-severity-critical" },
  { label: "Insufficient Data", range: "— / N/A", tone: "text-muted-foreground" },
];

const HARD_FLOORS: Array<{ id: string; title: string }> = [
  { id: "HF-01", title: "Active SEC enforcement" },
  { id: "HF-02", title: "Felony conviction" },
  { id: "HF-03", title: "AUM contradiction" },
  { id: "HF-04", title: "Track record contradiction" },
  { id: "HF-05", title: "Personal bankruptcy" },
  { id: "HF-06", title: "LP litigation" },
  { id: "HF-07", title: "Partner litigation" },
  { id: "HF-08", title: "Marketing fraud" },
  { id: "HF-09", title: "Missing SEC registration" },
  { id: "HF-10", title: "Sanctioned service provider" },
];

export function MethodologyModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          <Info className="h-3 w-3" />
          How is this computed?
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">L1 Composite Methodology</DialogTitle>
          <DialogDescription className="text-xs">
            How Nvestiv derives the composite score, recommendation, and tier from section-level inputs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          {/* Recommendation ladder */}
          <section>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
              1. Recommendation ladder (top-down precedence)
            </h3>
            <ol className="space-y-1.5 text-xs">
              <li>
                <span className="font-mono text-severity-critical">Decline</span> — any active Hard Floor triggered (no override).
              </li>
              <li>
                <span className="font-mono text-score-review">Defer</span> — Completeness &lt; 30% (insufficient evidence).
              </li>
              <li>
                <span className="font-mono text-score-strong">Advance</span> — composite ≥ 75.
              </li>
              <li>
                <span className="font-mono text-severity-monitor">Conditional Advance</span> — composite 60–74.
              </li>
              <li>
                <span className="font-mono text-score-review">Defer</span> — composite 40–59.
              </li>
              <li>
                <span className="font-mono text-severity-critical">Decline</span> — composite &lt; 40.
              </li>
            </ol>
          </section>

          <Separator />

          {/* Composite weights */}
          <section>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
              2. Composite weights (5 scored dimensions, sum = 100)
            </h3>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-border/50">
                {Object.entries(DIMENSION_WEIGHTS).map(([k, w]) => (
                  <tr key={k}>
                    <td className="py-1.5">{DIMENSION_LABELS[k]}</td>
                    <td className="py-1.5 text-right tabular-nums font-mono">{w}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
              Regulatory &amp; Operational Hygiene is <em>not</em> in the composite — it emits Pass / Conditional Pass / Fail and feeds Hard Floors.
              Sections marked Insufficient Data are excluded from the numerator and denominator (renormalized), so the composite reflects what was actually measured.
            </p>
          </section>

          <Separator />

          {/* Tiers */}
          <section>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
              3. Six composite tiers
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {TIERS.map((t) => (
                <div key={t.label} className="rounded-md border border-border/60 px-2.5 py-1.5 flex items-center justify-between">
                  <span className={t.tone}>{t.label}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">{t.range}</span>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Hard floors */}
          <section>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
              4. Ten hard floors (any one forces Decline)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              {HARD_FLOORS.map((hf) => (
                <div key={hf.id} className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px] py-0 px-1.5">{hf.id}</Badge>
                  <span className="text-foreground/80">{hf.title}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Hard floors may be overridden by an analyst with a written rationale (≥ 20 chars). Overridden floors no longer force Decline but remain visible in the audit trail.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}