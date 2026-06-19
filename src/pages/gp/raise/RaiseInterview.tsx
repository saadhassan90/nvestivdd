import { useParams } from "react-router-dom";
import { GpPagePlaceholder } from "@/components/gp/GpPagePlaceholder";
import { getRaise } from "@/mocks/gp/raises";
import { MessageSquare } from "lucide-react";

export default function RaiseInterview() {
  const { fundId } = useParams();
  const raise = getRaise(fundId);
  if (!raise) return null;
  const gaps = raise.ddq.filter((d) => d.state === "unanswered" || d.state === "suggested").slice(0, 6);
  return (
    <GpPagePlaceholder>
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-sm font-medium text-foreground">Open gaps IRIS would ask next</p>
        <p className="text-xs text-muted-foreground mt-1">{gaps.length} prompts queued · pulled from unanswered DDQ + IRIS-suggested items</p>
        <ul className="mt-4 space-y-2">
          {gaps.map((g) => (
            <li key={g.id} className="flex items-start gap-3 rounded-md border border-border bg-background/50 px-3 py-2.5">
              <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm text-foreground">{g.question}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{g.section} · {g.provenance}</p>
              </div>
            </li>
          ))}
          {gaps.length === 0 && (
            <li className="text-sm text-muted-foreground italic">All known gaps are addressed.</li>
          )}
        </ul>
      </div>
    </GpPagePlaceholder>
  );
}