import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "@/assets/logo.svg";
import { ArrowLeft, Share2, Sparkles, Video, VideoOff, MessagesSquare } from "lucide-react";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import { useChatContext } from "@/contexts/ChatContext";
import { useMeetingMode } from "@/contexts/MeetingModeContext";
import { ShareModal } from "@/components/project/ShareModal";
import { getStatusColor } from "@/lib/verdict-utils";
import { cn } from "@/lib/utils";
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
  const { enabled: meetingOn, toggle: toggleMeeting } = useMeetingMode();
  const [shareOpen, setShareOpen] = useState(false);

  const statusColor = getStatusColor(project.status);
  const isMemoMode = mode === "memo";

  const levels: Array<"L1" | "L2" | "L3"> = ["L1", "L2", "L3"];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background shrink-0">
        <div className="flex h-12 items-center justify-between px-4 sm:px-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-3 text-sm min-w-0">
            <Link to="/dashboard" className="shrink-0">
              <img src={logo} alt="Nvestiv" className="h-5" />
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

            {/* Report-level tabs (L1 / L2 / L3) */}
            {!isMemoMode && (
              <div className="ml-3 hidden sm:inline-flex items-center rounded-md border border-border bg-muted/40 p-0.5">
                {levels.map((lvl) => {
                  const active = reportLevel === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => onReportLevelChange?.(lvl)}
                      disabled={lvl !== "L1"}
                      className={cn(
                        "px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors",
                        active
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                        lvl !== "L1" && "opacity-40 cursor-not-allowed hover:text-muted-foreground",
                      )}
                      title={lvl === "L1" ? "L1 Triage Report" : `${lvl} (coming soon)`}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            <NotificationsDropdown />
            {onOpenComments && !isMemoMode && (
              <button
                onClick={onOpenComments}
                className="relative p-1.5 rounded-md hover:bg-muted transition-colors"
                title="Open comments"
              >
                <MessagesSquare className="h-4 w-4 text-muted-foreground" />
                {commentsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-foreground text-background text-[9px] font-bold leading-none min-w-[14px] h-[14px] px-1">
                    {commentsCount > 99 ? "99+" : commentsCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={toggleMeeting}
              className={`p-1.5 rounded-md transition-colors ${
                meetingOn ? "bg-foreground text-background hover:opacity-90" : "hover:bg-muted text-muted-foreground"
              }`}
              title={meetingOn ? "Exit Meeting Mode" : "Enter Meeting Mode (+15% font, hide log/sources)"}
              aria-pressed={meetingOn}
            >
              {meetingOn ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setShareOpen(true)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              title="Share Report"
            >
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </button>

            {isMemoMode ? (
              <button
                onClick={() => navigate(`/project/${project.id}?tab=overview`)}
                className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
                title="Back to L1 report"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Back to Reports</span>
              </button>
            ) : (
              !isOpen && (
              <button
                onClick={() => setIsOpen(true)}
                className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-all hover:opacity-90 active:scale-95"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Ask Iris</span>
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
