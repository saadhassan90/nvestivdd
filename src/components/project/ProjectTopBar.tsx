import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Share2, MoreVertical, Sparkles } from "lucide-react";
import { useChatContext } from "@/contexts/ChatContext";
import { ShareModal } from "@/components/project/ShareModal";
import { getStatusColor } from "@/lib/verdict-utils";
import type { Tables } from "@/integrations/supabase/types";

interface ProjectTopBarProps {
  project: Tables<"projects">;
  isProcessing: boolean;
}

function getReportLevel(status: string): "L1" | "L2" | "L3" | null {
  // Derive report level from project status/data
  // For now all completed projects are L1
  if (["complete", "completed"].includes(status)) return "L1";
  return null;
}

function getCtaButton(level: "L1" | "L2" | "L3" | null) {
  switch (level) {
    case "L1":
      return { label: "Request DataRoom", variant: "default" as const };
    case "L2":
      return { label: "Generate IC Memo", variant: "default" as const };
    case "L3":
    default:
      return null;
  }
}

export function ProjectTopBar({ project, isProcessing }: ProjectTopBarProps) {
  const navigate = useNavigate();
  const { isOpen, setIsOpen } = useChatContext();
  const [shareOpen, setShareOpen] = useState(false);

  const statusColor = getStatusColor(project.status);
  const reportLevel = getReportLevel(project.status);
  const cta = getCtaButton(reportLevel);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-card shrink-0">
        <div className="flex h-12 items-center justify-between px-4 sm:px-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm min-w-0">
            <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
              Funds
            </button>
            <span className="text-muted-foreground shrink-0">›</span>
            <span className="font-medium text-foreground truncate">{project.fund_name}</span>
            {isProcessing && (
              <span className={`ml-2 inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                L1 Processing
              </span>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            <button className="p-1.5 rounded-md hover:bg-muted transition-colors" title="Notifications">
              <Bell className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => setShareOpen(true)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              title="Share Report"
            >
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* CTA Button */}
            {cta && !isProcessing && (
              <button className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-all hover:opacity-90 active:scale-95">
                {cta.label}
              </button>
            )}

            {/* Ask Iris */}
            {!isOpen && (
              <button
                onClick={() => setIsOpen(true)}
                className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-muted active:scale-95"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Ask Iris</span>
              </button>
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
