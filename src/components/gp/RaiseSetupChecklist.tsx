import { useState } from "react";
import { Check, FileSignature, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Raise } from "@/mocks/gp/raises";
import { NdaPreviewDrawer } from "@/components/gp/NdaPreviewDrawer";

interface Props {
  raise: Raise;
}

type StepId = "overview" | "dataroom" | "ddq" | "interview" | "nda";

export function RaiseSetupChecklist({ raise }: Props) {
  const [ndaOpen, setNdaOpen] = useState(false);
  const [ndaSigned, setNdaSigned] = useState(false);
  const [overrides, setOverrides] = useState<Partial<Record<StepId, boolean>>>({});

  const auto: Record<StepId, boolean> = {
    overview: true,
    dataroom: raise.completion.dataroom >= 90,
    ddq: raise.completion.ddq >= 90,
    interview: raise.completion.interview >= 90,
    nda: ndaSigned,
  };

  const steps: { id: StepId; title: string; help: string; meta?: string; action?: React.ReactNode }[] = [
    {
      id: "overview",
      title: "Fund overview drafted",
      help: "Strategy, terms, and team snapshot completed.",
    },
    {
      id: "dataroom",
      title: "Dataroom uploaded",
      help: "PPM, LPA, track record and supporting documents in place.",
      meta: `${raise.completion.dataroom}%`,
    },
    {
      id: "ddq",
      title: "DDQ answered",
      help: "ILPA and LP-direct questions responded to.",
      meta: `${raise.completion.ddq}%`,
    },
    {
      id: "interview",
      title: "IRIS Interview completed",
      help: "GP interview captured and synthesised.",
      meta: `${raise.completion.interview}%`,
    },
    {
      id: "nda",
      title: "NDA setup",
      help: "Mutual NDA template configured for the LP journey.",
      action: (
        <button
          type="button"
          onClick={() => setNdaOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
        >
          <FileSignature className="h-3 w-3" />
          View NDA
          <ChevronRight className="h-3 w-3 opacity-60" />
        </button>
      ),
    },
  ];

  const checked = (id: StepId) => overrides[id] ?? auto[id];
  const completed = steps.filter((s) => checked(s.id)).length;
  const pct = Math.round((completed / steps.length) * 100);
  const isLive = completed === steps.length;

  const toggle = (id: StepId) => {
    setOverrides((o) => ({ ...o, [id]: !checked(id) }));
  };

  return (
    <>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-baseline justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Setup checklist</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isLive ? "All set — this raise is ready to go live." : `${completed} of ${steps.length} complete to go live.`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-foreground tabular-nums">{pct}%</p>
            <span className={cn(
              "mt-1 inline-block text-[10px] uppercase tracking-wider rounded-full border px-2 py-0.5",
              isLive ? "border-foreground text-foreground bg-foreground/5" : "border-border text-muted-foreground",
            )}>
              {isLive ? "Ready" : "In setup"}
            </span>
          </div>
        </div>
        <div className="px-5 pt-3">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-foreground transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <ul className="divide-y divide-border">
          {steps.map((s) => {
            const done = checked(s.id);
            return (
              <li key={s.id} className="flex items-start gap-3 px-5 py-3.5 group">
                <button
                  type="button"
                  onClick={() => toggle(s.id)}
                  aria-pressed={done}
                  className={cn(
                    "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                    done
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-transparent hover:border-foreground/60",
                  )}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={cn(
                      "text-sm font-medium",
                      done ? "text-muted-foreground line-through" : "text-foreground",
                    )}>
                      {s.title}
                    </p>
                    {s.meta && (
                      <span className="text-[11px] text-muted-foreground tabular-nums">{s.meta}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.help}</p>
                </div>
                {s.action && <div className="self-center">{s.action}</div>}
              </li>
            );
          })}
        </ul>
      </div>

      <NdaPreviewDrawer
        open={ndaOpen}
        onClose={() => setNdaOpen(false)}
        raiseName={raise.name}
        signed={ndaSigned}
        onSigned={() => setNdaSigned(true)}
      />
    </>
  );
}