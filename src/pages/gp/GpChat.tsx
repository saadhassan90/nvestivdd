import { GpPagePlaceholder } from "@/components/gp/GpPagePlaceholder";

export default function GpChat() {
  return (
    <GpPagePlaceholder
      title="Chat — Home"
      description="IRIS is the operating layer. Every session lands here. The full-page chat and the docked panel are continuous."
    >
      <div className="rounded-lg border border-border bg-card px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Full-page chat surface arrives in Stage 2 (chat-as-spine rebuild).
        </p>
      </div>
    </GpPagePlaceholder>
  );
}