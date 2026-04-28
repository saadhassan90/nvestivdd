import { AlertOctagon } from "lucide-react";

interface HardFloorBannerProps {
  triggered: boolean;
  reason?: string | null;
  floorId?: string | null;
  floorTitle?: string | null;
  overridden?: boolean;
  overrideReason?: string | null;
  overrideAuthor?: string | null;
  overrideAt?: string | null;
}

/**
 * L1 PRD §6.4 — Hard Floor banner.
 * Shows the specific HF-ID and title when triggered.
 * When overridden, becomes a muted caveat instead of red alarm.
 */
export function HardFloorBanner({
  triggered,
  reason,
  floorId,
  floorTitle,
  overridden = false,
  overrideReason,
  overrideAuthor,
  overrideAt,
}: HardFloorBannerProps) {
  if (!triggered) return null;

  if (overridden) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 px-4 py-2.5 flex items-start gap-2.5">
        <AlertOctagon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="min-w-0 text-[11px] text-muted-foreground">
          <p>
            <span className="font-semibold">
              {floorId ? `${floorId} — ${floorTitle ?? "Hard Floor"}` : "Hard Floor"}
            </span>{" "}
            (overridden{overrideAuthor ? ` by ${overrideAuthor}` : ""}
            {overrideAt ? ` on ${new Date(overrideAt).toLocaleDateString()}` : ""})
          </p>
          {overrideReason && <p className="mt-0.5 italic">{overrideReason}</p>}
        </div>
      </div>
    );
  }

  const headline = floorId
    ? `HARD FLOOR FAILURE — DECLINE: ${floorId} ${floorTitle ?? ""}`.trim()
    : "HARD FLOOR TRIGGERED — DECLINE recommended";

  return (
    <div className="rounded-lg border border-severity-critical/50 bg-severity-critical/10 px-4 py-2.5 flex items-start gap-2.5">
      <AlertOctagon className="h-4 w-4 text-severity-critical shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-severity-critical">
          {headline}
        </p>
        {reason && (
          <p className="text-[11px] text-severity-critical/80 mt-0.5 leading-relaxed">{reason}</p>
        )}
      </div>
    </div>
  );
}
