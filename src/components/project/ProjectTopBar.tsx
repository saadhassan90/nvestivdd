import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, MessagesSquare, Upload, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { ShareModal } from "@/components/project/ShareModal";
import { useSetLpRailActions } from "@/contexts/LpRailActionsContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getStatusColor } from "@/lib/verdict-utils";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUiVariant } from "@/contexts/UiVariantContext";
import type { Tables } from "@/integrations/supabase/types";

interface ProjectTopBarProps {
  project: Tables<"projects"> | null;
  isProcessing: boolean;
  /** When set to "memo", the Ask Iris pill is replaced with a Stage dropdown
   *  + Back-to-Reports button. Defaults to undefined (= L1 tabs page). */
  mode?: "memo";
  /** Selected report level (defaults to "L1"). L2/L3 are placeholders for now. */
  reportLevel?: "L1" | "L2" | "L3" | "ODD";
  onReportLevelChange?: (level: "L1" | "L2" | "L3" | "ODD") => void;
  /** Opens the slide-in comments drawer. */
  onOpenComments?: () => void;
  commentsCount?: number;
  /** Memo-only: triggers reset-to-template (with confirm). */
  onReset?: () => void;
  /** ODD-only: opens the re-import flow. */
  onReimport?: () => void;
  /** Returns the markdown to expose in the Share→Export tab. */
  getExportMarkdown?: () => string | Promise<string>;
  exportFilename?: string;
  /** Which scope the in-memory export override applies to. */
  exportCurrentScope?: "triage" | "idd" | "odd" | "memo" | "all";
  /** When present, renders compact zoom controls (in/percent/out) to the left
   *  of the icon set. Used by report pages (ODD, IC Memo). */
  zoom?: {
    value: number;
    onIn: () => void;
    onOut: () => void;
    onReset: () => void;
    canIn?: boolean;
    canOut?: boolean;
  };
}

export function ProjectTopBar({
  project,
  isProcessing,
  mode,
  reportLevel = "L1",
  onReportLevelChange,
  onOpenComments,
  commentsCount = 0,
  onReset,
  onReimport,
  getExportMarkdown,
  exportFilename,
  exportCurrentScope,
  zoom,
}: ProjectTopBarProps) {
  const navigate = useNavigate();
  const { variant } = useUiVariant();
  const [shareOpen, setShareOpen] = useState(false);

  const statusColor = getStatusColor(project?.status ?? "pending");
  const isMemoMode = mode === "memo";

  const isAdia = variant === "adia";
  const levels: Array<"L1" | "L2" | "L3" | "ODD"> = isAdia
    ? ["L1", "L2", "ODD", "L3"]
    : ["L1", "L2", "L3"];
  const levelMeta: Record<"L1" | "L2" | "L3" | "ODD", { label: string; available: boolean }> = {
    L1: {
      label: isAdia ? "Triage — Locked in ADIA demo" : "Triage Report",
      available: !isAdia,
    },
    L2: {
      label: isAdia ? "IDD — Locked in ADIA demo" : "IDD (coming soon)",
      available: false,
    },
    ODD: { label: "Operational Due Diligence", available: isAdia },
    L3: {
      label: isAdia ? "IC Memo — Locked in ADIA demo" : "IC Memo",
      available: !isAdia,
    },
  };

  // Build rail-mounted action icons (rendered in the LP sidebar rail).
  const railNode = useMemo(
    () => (
      <>
        {zoom && (
          <div className="flex flex-col items-center gap-0.5 rounded-md border border-border bg-card px-0.5 py-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={zoom.onIn}
                  disabled={zoom.canIn === false}
                  aria-label="Zoom in"
                  className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Zoom in</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={zoom.onReset}
                  className="px-1 py-0.5 text-[9px] font-medium tabular-nums text-muted-foreground hover:text-foreground transition-colors"
                >
                  {Math.round(zoom.value * 100)}%
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Reset zoom</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={zoom.onOut}
                  disabled={zoom.canOut === false}
                  aria-label="Zoom out"
                  className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Zoom out</TooltipContent>
            </Tooltip>
          </div>
        )}
        {onReimport && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onReimport}
                className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                <Upload className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Re-import ODD documents</TooltipContent>
          </Tooltip>
        )}
        {onReset && (
          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <button className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">Reset memo to template</TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset memo to template?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will replace your current draft with a fresh skeleton seeded from the L1 report.
                  This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onReset}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        {onOpenComments && !isMemoMode && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onOpenComments}
                className="relative flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                <MessagesSquare className="h-4 w-4" />
                {commentsCount > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center rounded-full bg-foreground text-background text-[9px] font-bold leading-none min-w-[14px] h-[14px] px-1">
                    {commentsCount > 99 ? "99+" : commentsCount}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Comments{commentsCount > 0 ? ` (${commentsCount})` : ""}</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setShareOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Share report</TooltipContent>
        </Tooltip>
        {isMemoMode && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => project && navigate(`/project/${project.id}?tab=summary`)}
                className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Back to Triage report</TooltipContent>
          </Tooltip>
        )}
      </>
    ),
    [zoom, onReimport, onReset, onOpenComments, commentsCount, isMemoMode, project, navigate],
  );
  useSetLpRailActions("project-topbar", railNode);

  return (
    <>
      {/* Inline breadcrumb row — no fixed top nav; action icons live in the LP rail. */}
      <div className="flex h-10 items-center gap-2 px-3 sm:px-5 text-xs sm:text-sm border-b border-border/50 bg-background shrink-0">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          Funds
        </button>
        <span className="text-muted-foreground shrink-0">›</span>
        <span className="font-medium text-foreground truncate min-w-0">
          {project?.fund_name ?? <span className="inline-block h-3 w-32 rounded bg-muted animate-pulse" />}
        </span>
        {project && isProcessing && (
          <span
            className={cn(
              "ml-2 inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-[10px] font-bold",
              statusColor,
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            Triage Processing
          </span>
        )}
      </div>

      {project && (
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          fundName={project.fund_name}
          projectId={project.id}
          getExportMarkdown={getExportMarkdown}
          exportFilename={exportFilename}
          currentScope={exportCurrentScope}
        />
      )}
    </>
  );
}
