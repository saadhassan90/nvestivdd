import { AlertOctagon } from "lucide-react";

interface HardFloorBannerProps {
  triggered: boolean;
  reason?: string | null;
}

/** Global red banner that appears on every tab when any hard-floor gate fires. */
export function HardFloorBanner({ triggered, reason }: HardFloorBannerProps) {
  if (!triggered) return null;
  return (
    <div className="rounded-lg border border-severity-critical/50 bg-severity-critical/10 px-4 py-2.5 flex items-start gap-2.5">
      <AlertOctagon className="h-4 w-4 text-severity-critical shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-severity-critical">
          Hard Floor Triggered — No Meet recommended
        </p>
        {reason && (
          <p className="text-[11px] text-severity-critical/80 mt-0.5 leading-relaxed">{reason}</p>
        )}
      </div>
    </div>
  );
}
