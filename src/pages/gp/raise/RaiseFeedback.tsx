import { GpPagePlaceholder } from "@/components/gp/GpPagePlaceholder";
export default function RaiseFeedback() {
  return (
    <GpPagePlaceholder
      title="Feedback"
      description="LP engagement + IRIS question report. L2+ only. Empty until your first L2 LP."
    >
      <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-16 text-center text-sm text-muted-foreground">
        No L2 LPs yet. Feedback activates once an LP signs the mNDA and you consent to share the dataroom.
      </div>
    </GpPagePlaceholder>
  );
}