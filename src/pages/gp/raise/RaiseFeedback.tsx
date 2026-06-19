import { useParams } from "react-router-dom";
import { GpPagePlaceholder } from "@/components/gp/GpPagePlaceholder";
import { getRaise } from "@/mocks/gp/raises";
import { EditableText } from "@/components/iris/EditableText";

export default function RaiseFeedback() {
  const { fundId } = useParams();
  const raise = getRaise(fundId);
  if (!raise) return null;
  const sharedLps = raise.lps.filter((l) => l.consent === "shared");
  if (sharedLps.length === 0) {
    return (
      <GpPagePlaceholder>
        <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-16 text-center text-sm text-muted-foreground">
          No L2 LPs yet. Feedback activates once an LP signs the mNDA and you consent to share the dataroom.
        </div>
      </GpPagePlaceholder>
    );
  }
  const totalQs = sharedLps.reduce((a, l) => a + l.questions, 0);
  // Aggregate-only mock themes
  const themes = [
    { theme: "Track record concentration (2022 vintage)", weight: 0.32 },
    { theme: "Loss-given-default methodology", weight: 0.21 },
    { theme: "Recycling provision mechanics", weight: 0.18 },
    { theme: "ESG / SFDR classification", weight: 0.16 },
    { theme: "GP commit funding source", weight: 0.13 },
  ];
  return (
    <GpPagePlaceholder>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">L2 LPs engaged</p>
          <p className="text-2xl font-semibold text-foreground tabular-nums mt-1">{sharedLps.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Questions asked</p>
          <p className="text-2xl font-semibold text-foreground tabular-nums mt-1">{totalQs}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Avg / LP</p>
          <p className="text-2xl font-semibold text-foreground tabular-nums mt-1">{Math.round(totalQs / sharedLps.length)}</p>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-5">
        <EditableText
          as="p"
          className="text-sm font-medium text-foreground"
          sectionKey="themes.title"
          label="Themes card title"
          schema="text"
          defaultValue="Top question themes"
        />
        <EditableText
          as="p"
          className="text-xs text-muted-foreground mt-1"
          sectionKey="themes.subtitle"
          label="Themes card subtitle"
          defaultValue="Aggregated across all L2 LPs. Identifying details suppressed."
        />
        <div className="mt-4 space-y-3">
          {themes.map((t) => (
            <div key={t.theme}>
              <div className="flex justify-between text-xs">
                <span className="text-foreground">{t.theme}</span>
                <span className="text-muted-foreground tabular-nums">{Math.round(t.weight * 100)}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-foreground/60" style={{ width: `${t.weight * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </GpPagePlaceholder>
  );
}