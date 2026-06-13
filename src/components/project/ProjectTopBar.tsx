import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "@/assets/logo.svg";
import { ArrowLeft, Share2, MessagesSquare, Lock, Upload, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import { ShareModal } from "@/components/project/ShareModal";
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
  project: Tables<"projects">;
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

  // Publish header height so the global chat drawer can sit below it.
  useEffect(() => {
    document.documentElement.style.setProperty("--app-header-h", "48px");
    return () => {
      document.documentElement.style.setProperty("--app-header-h", "56px");
    };
  }, []);

  const statusColor = getStatusColor(project.status);
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

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background">
        <div className="flex h-12 items-center justify-between px-3 sm:px-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm min-w-0">
            <Link to="/dashboard" className="shrink-0">
              <img src={logo} alt="Nvestiv" className="h-4 sm:h-5" />
            </Link>
            <span className="text-muted-foreground shrink-0">›</span>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              Funds
            </button>
            <span className="text-muted-foreground shrink-0">›</span>
            <span className="font-medium text-foreground truncate">{project.fund_name}</span>
            {isProcessing && (
              <span
                className={`ml-2 inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColor}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                Triage Processing
              </span>
            )}
          </div>

          {/* Right actions — desktop only; mobile/tablet uses bottom bar */}
          <div className="hidden lg:flex items-center gap-1.5">
            {zoom && (
              <div className="mr-1 flex items-center gap-0.5 rounded-md border border-border bg-card px-1 py-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={zoom.onOut}
                      disabled={zoom.canOut === false}
                      aria-label="Zoom out"
                      className="inline-flex items-center justify-center rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Zoom out</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={zoom.onReset}
                      className="min-w-[3rem] px-1 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {Math.round(zoom.value * 100)}%
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Reset zoom</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={zoom.onIn}
                      disabled={zoom.canIn === false}
                      aria-label="Zoom in"
                      className="inline-flex items-center justify-center rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Zoom in</TooltipContent>
                </Tooltip>
              </div>
            )}
            <NotificationsDropdown />
            {onReimport && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onReimport}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  >
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Re-import ODD documents</TooltipContent>
              </Tooltip>
            )}
            {onReset && (
              <AlertDialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
                        <RotateCcw className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Reset memo to template</TooltipContent>
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
                    className="relative p-1.5 rounded-md hover:bg-muted transition-colors"
                  >
                    <MessagesSquare className="h-4 w-4 text-muted-foreground" />
                    {commentsCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-foreground text-background text-[9px] font-bold leading-none min-w-[14px] h-[14px] px-1">
                        {commentsCount > 99 ? "99+" : commentsCount}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Comments{commentsCount > 0 ? ` (${commentsCount})` : ""}</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShareOpen(true)}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                >
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Share report</TooltipContent>
            </Tooltip>

            {isMemoMode ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate(`/project/${project.id}?tab=summary`)}
                    className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Back to Reports</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Back to Triage report</TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        </div>
      </header>
      {/* Spacer to preserve flow now that header is fixed */}
      <div className="h-12 shrink-0" aria-hidden />

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        fundName={project.fund_name}
        projectId={project.id}
        getExportMarkdown={getExportMarkdown}
        exportFilename={exportFilename}
        currentScope={exportCurrentScope}
      />
    </>
  );
}
