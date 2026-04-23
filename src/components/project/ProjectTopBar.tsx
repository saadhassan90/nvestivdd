import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "@/assets/logo.svg";
import { ArrowLeft, Share2, Sparkles, Calendar, User, FileBadge, Link2 } from "lucide-react";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import { useChatContext } from "@/contexts/ChatContext";
import { ShareModal } from "@/components/project/ShareModal";
import { getStatusColor } from "@/lib/verdict-utils";
import {
  RecommendationBadge,
  TierPill,
  recommendationFromScore,
  tierFromScore,
} from "@/components/project/primitives/VerdictBadges";
import type { Tables } from "@/integrations/supabase/types";

interface ProjectTopBarProps {
  project: Tables<"projects">;
  isProcessing: boolean;
  /** When set to "memo", the Ask Iris pill is replaced with a Stage dropdown
   *  + Back-to-Reports button. Defaults to undefined (= L1 tabs page). */
  mode?: "memo";
}

function getReportLevel(status: string): "L1" | "L2" | "L3" | null {
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

/** Parses fund name into the canonical "working name" pills the PRD wants
 *  (full name + abbreviated form). Falls back to a single chip. */
function workingNamePills(fundName: string, gpEntity?: string | null): string[] {
  const pills: string[] = [];
  if (gpEntity && gpEntity !== fundName) pills.push(gpEntity);
  pills.push(fundName);
  // produce a short alias (e.g., first letters of each capitalized word)
  const alias = fundName
    .split(/\s+/)
    .filter((w) => /^[A-Z]/.test(w))
    .map((w) => w[0])
    .join("");
  if (alias.length >= 2 && alias.length <= 6 && !pills.includes(alias)) pills.push(alias);
  return pills;
}

export function ProjectTopBar({ project, isProcessing, mode }: ProjectTopBarProps) {
  const navigate = useNavigate();
  const { isOpen, setIsOpen } = useChatContext();
  const [shareOpen, setShareOpen] = useState(false);

  const statusColor = getStatusColor(project.status);
  const reportLevel = getReportLevel(project.status);
  const cta = getCtaButton(reportLevel);

  const composite = project.composite_score ?? null;
  const tier = tierFromScore(composite);
  const rec = recommendationFromScore(composite);

  const pills = workingNamePills(project.fund_name, project.gp_entity_name);
  const analysisDate =
    (project as any).analysis_date ||
    (project.updated_at ? new Date(project.updated_at).toLocaleDateString() : null);

  const isMemoMode = mode === "memo";
  const showCoverBlock = !isProcessing && !isMemoMode;

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
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            <NotificationsDropdown />
            <button
              onClick={() => setShareOpen(true)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              title="Share Report"
            >
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </button>

            {cta && !isProcessing && !isMemoMode && (
              <button className="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-muted active:scale-95">
                {cta.label}
              </button>
            )}

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

        {/* PRD §3.2 — Cover Block */}
        {showCoverBlock && (
          <div className="border-t border-border/40 bg-muted/20 px-4 sm:px-5 py-2.5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {/* Report type label */}
              <span className="inline-flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <FileBadge className="h-3 w-3" />
                L1 Triage Report
              </span>

              {/* Working-name pills */}
              <div className="flex items-center gap-1 flex-wrap">
                {pills.map((p, i) => (
                  <span
                    key={`${p}-${i}`}
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      i === 0
                        ? "bg-foreground text-background"
                        : "border border-border text-muted-foreground"
                    }`}
                  >
                    {p}
                  </span>
                ))}
              </div>

              {/* Sponsor line */}
              {project.gp_entity_name && (
                <span className="text-[11px] text-muted-foreground">
                  Sponsor: <span className="text-foreground font-medium">{project.gp_entity_name}</span>
                </span>
              )}

              {/* Spacer */}
              <div className="flex-1 min-w-0" />

              {/* Analysis date */}
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {analysisDate || "—"}
              </span>

              {/* Analyst */}
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <User className="h-3 w-3" />
                nvestiv-pipeline
              </span>

              {/* Scorecard version */}
              <span className="inline-flex items-center rounded border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                Scorecard v1.0
              </span>

              {/* Related prior report — placeholder chip */}
              <span className="inline-flex items-center gap-1 rounded border border-dashed border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <Link2 className="h-2.5 w-2.5" />
                No prior report
              </span>

              {/* Composite badge */}
              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-bold tabular-nums">
                <span className="text-muted-foreground text-[9px] uppercase tracking-wider mr-0.5">
                  Composite
                </span>
                <span className="text-foreground">{composite ?? "—"}</span>
                <span className="text-muted-foreground text-[10px]">/100</span>
              </span>

              {/* Recommendation + Tier */}
              <RecommendationBadge recommendation={rec} />
              <TierPill tier={tier} />
            </div>
          </div>
        )}
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
