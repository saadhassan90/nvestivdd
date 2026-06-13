import { ZoomIn, ZoomOut } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ReportZoomControls } from "@/hooks/use-report-zoom";

/**
 * Floating vertical zoom control rail, anchored to the right edge of a
 * report container. Used by ODD and IC Memo workspaces. Parent must be
 * `position: relative`.
 */
export function ReportZoomRail({ zoom }: { zoom: ReportZoomControls }) {
  return (
    <div className="pointer-events-none absolute right-3 bottom-6 z-30 hidden lg:flex">
      <div className="pointer-events-auto flex flex-col items-center gap-0.5 rounded-md border border-border bg-card/95 px-1 py-1 shadow-sm backdrop-blur">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={zoom.zoomIn}
              disabled={zoom.canIn === false}
              aria-label="Zoom in"
              className="inline-flex items-center justify-center rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Zoom in</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={zoom.reset}
              className="px-1 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground hover:text-foreground transition-colors"
            >
              {Math.round(zoom.zoom * 100)}%
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Reset zoom</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={zoom.zoomOut}
              disabled={zoom.canOut === false}
              aria-label="Zoom out"
              className="inline-flex items-center justify-center rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Zoom out</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}