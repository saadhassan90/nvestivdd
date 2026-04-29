import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "@/assets/logo.svg";
import { ArrowLeft, Share2, Sparkles, MessagesSquare } from "lucide-react";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import { useChatContext } from "@/contexts/ChatContext";
import { ShareModal } from "@/components/project/ShareModal";
import { getStatusColor } from "@/lib/verdict-utils";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Tables } from "@/integrations/supabase/types";

interface ProjectTopBarProps {
  project: Tables<"projects">;
  isProcessing: boolean;
  /** When set to "memo", the Ask Iris pill is replaced with a Stage dropdown
   *  + Back-to-Reports button. Defaults to undefined (= L1 tabs page). */
  mode?: "memo";
  /** Selected report level (defaults to "L1"). L2/L3 are placeholders for now. */
  reportLevel?: "L1" | "L2" | "L3";
  onReportLevelChange?: (level: "L1" | "L2" | "L3") => void;
  /** Opens the slide-in comments drawer. */
  onOpenComments?: () => void;
  commentsCount?: number;
}

export function ProjectTopBar({
  project,
  isProcessing,
  mode,
  reportLevel = "L1",
  onReportLevelChange,
  onOpenComments,
  commentsCount = 0,
}: ProjectTopBarProps) {
  const navigate = useNavigate();
  const { isOpen, setIsOpen } = useChatContext();
  const [shareOpen, setShareOpen] = useState(false);

  const statusColor = getStatusColor(project.status);
  const isMemoMode = mode === "memo";

  const levels: Array<"L1" | "L2" | "L3"> = ["L1", "L2", "L3"];
  const levelMeta: Record<"L1" | "L2" | "L3", { label: string; available: boolean }> = {
    L1: { label: "L1 — Triage Report", available: true },
    L2: { label: "L2 — Deep Dive (coming soon)", available: false },
    L3: { label: "L3 — IC Memo", available: true },
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background shrink-0">
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
                L1 Processing
              </span>
            )}

            {/* Report-level tabs (L1 / L2 / L3) — always visible */}
            <div className="ml-3 hidden sm:inline-flex items-center rounded-md border border-border bg-muted/40 p-0.5">
                {levels.map((lvl) => {
                  const active = reportLevel === lvl;
                  const { label, available } = levelMeta[lvl];
                  return (
                    <Tooltip key={lvl}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => available && onReportLevelChange?.(lvl)}
                          disabled={!available}
                          className={cn(
                            "px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors",
                            active
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground",
                            !available && "opacity-40 cursor-not-allowed hover:text-muted-foreground",
                          )}
                        >
                          {lvl}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">{label}</TooltipContent>
                    </Tooltip>
                  );
                })}
            </div>
          </div>

          {/* Right actions — desktop only; mobile/tablet uses bottom bar */}
          <div className="hidden lg:flex items-center gap-1.5">
            <NotificationsDropdown />
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
                    onClick={() => navigate(`/project/${project.id}?tab=overview`)}
                    className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Back to Reports</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Back to L1 report</TooltipContent>
              </Tooltip>
            ) : (
              !isOpen && (
              <button
                onClick={() => setIsOpen(true)}
                className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-all hover:opacity-90 active:scale-95"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Ask Iris
              </button>
              )
            )}
          </div>
        </div>
      </header>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        fundName={project.fund_name}
        projectId={project.id}
      />
    </>
  );
}
