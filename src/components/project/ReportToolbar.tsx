import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ReportToolbarProps {
  label: string;
  fundName?: string;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  minZoom?: number;
  maxZoom?: number;
  rightSlot?: ReactNode;
}

/**
 * Slim top bar that sits above a report canvas (ODD / IC Memo). Provides
 * a small set of in-document controls — currently zoom in / out / reset —
 * plus an optional right-aligned slot for report-specific actions.
 */
export function ReportToolbar({
  label,
  fundName,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  minZoom = 0.75,
  maxZoom = 1.75,
  rightSlot,
}: ReportToolbarProps) {
  const pct = Math.round(zoom * 100);
  const canIn = zoom < maxZoom - 0.001;
  const canOut = zoom > minZoom + 0.001;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 bg-background px-4 sm:px-6 py-1.5">
      <div className="flex items-center gap-2 text-xs min-w-0">
        <span className="text-muted-foreground shrink-0">{label}</span>
        {fundName && (
          <>
            <span className="text-muted-foreground/40 shrink-0">·</span>
            <span className="font-medium text-foreground truncate">{fundName}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <div className="flex items-center gap-0.5 rounded-md border border-border bg-card px-1 py-0.5">
          <ToolbarIconButton
            onClick={onZoomOut}
            disabled={!canOut}
            label="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </ToolbarIconButton>
          <button
            type="button"
            onClick={onZoomReset}
            className="px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground hover:text-foreground transition-colors min-w-[3rem] text-center"
            title="Reset zoom"
          >
            {pct}%
          </button>
          <ToolbarIconButton
            onClick={onZoomIn}
            disabled={!canIn}
            label="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </ToolbarIconButton>
          <ToolbarIconButton onClick={onZoomReset} label="Reset zoom">
            <RotateCcw className="h-3.5 w-3.5" />
          </ToolbarIconButton>
        </div>
        {rightSlot}
      </div>
    </div>
  );
}

function ToolbarIconButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center rounded p-1 text-muted-foreground transition-colors",
        "hover:bg-muted hover:text-foreground",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

const ZOOM_STEPS = [0.75, 0.85, 1.0, 1.15, 1.3, 1.5, 1.75] as const;

export function nextZoomIn(z: number) {
  return ZOOM_STEPS.find((s) => s > z + 0.001) ?? z;
}
export function nextZoomOut(z: number) {
  return [...ZOOM_STEPS].reverse().find((s) => s < z - 0.001) ?? z;
}