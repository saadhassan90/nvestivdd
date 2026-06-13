import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, MoreHorizontal, Eye, RefreshCw, Trash2, Download, Share2 } from "lucide-react";
import { ScoreBadge } from "./ScoreBadge";
import { BlurFade } from "@/components/magicui/BlurFade";
import { CitationChips, type CitationChip } from "@/components/project/typed/CitationChips";
import { getVerdict, getVerdictLabel, getVerdictColor, getStatusLabel, getStatusColor, formatSubmittedDate } from "@/lib/verdict-utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

interface DealTableProps {
  projects: Tables<"projects">[];
  flagCounts: Record<string, { critical: number; elevated: number }>;
  citationsByProject?: Record<string, CitationChip[]>;
  totalCount?: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSort?: (column: string) => void;
  onRefresh?: () => void;
}

function SortableHeader({ label, column, sortBy, sortDir, onSort }: {
  label: string;
  column: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSort?: (column: string) => void;
}) {
  const isActive = sortBy === column;
  return (
    <th
      className="px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors group"
      onClick={() => onSort?.(column)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
        )}
      </span>
    </th>
  );
}

function PaginationBar({ page, totalPages, totalCount, shownCount, onPageChange }: {
  page: number;
  totalPages: number;
  totalCount: number;
  shownCount: number;
  onPageChange: (p: number) => void;
}) {
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <p className="text-[11px] text-muted-foreground">
        {shownCount} of {totalCount} results
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {pages.map((p, i) =>
            p === "..." ? (
              <span key={`e${i}`} className="px-1 text-[11px] text-muted-foreground">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`flex h-6 min-w-[24px] items-center justify-center rounded text-[11px] font-medium transition-colors ${
                  p === page
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function StrategyPill({ strategy }: { strategy: string | null }) {
  if (!strategy) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground">
      {strategy}
    </span>
  );
}

function StagePill({ stage }: { stage: string }) {
  const colors: Record<string, string> = {
    L1: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    L2: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    L3: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  };
  const colorClass = colors[stage] || colors.L1;
  return (
    <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold tracking-wider ${colorClass}`}>
      {stage}
    </span>
  );
}

function getStage(_project: Tables<"projects">): string {
  // For now all projects are L1 stage — expand logic when L2/L3 are implemented
  return "L1";
}

function RowActionsMenu({ project, onRefresh }: { project: Tables<"projects">; onRefresh?: () => void }) {
  const navigate = useNavigate();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${project.fund_name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("projects").delete().eq("id", project.id);
    if (error) {
      toast.error("Failed to delete project");
    } else {
      toast.success("Project deleted");
      onRefresh?.();
    }
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/project/${project.id}`);
  };

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info("Re-analysis queued (not yet implemented)");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <button className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={handleView}>
          <Eye className="mr-2 h-3.5 w-3.5" />
          View Report
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Re-analyze
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DealTable({ projects, flagCounts, citationsByProject = {}, totalCount, page, totalPages, onPageChange, sortBy, sortDir, onSort, onRefresh }: DealTableProps) {
  const navigate = useNavigate();

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No deals match your filters.</p>
      </div>
    );
  }

  const isProcessing = (status: string) =>
    ["uploading", "processing", "analyzing", "extracting", "pending"].includes(status);

  const paginationBar = (
    <PaginationBar
      page={page}
      totalPages={totalPages}
      totalCount={totalCount ?? projects.length}
      shownCount={projects.length}
      onPageChange={onPageChange}
    />
  );

  return (
    <BlurFade delay={0.15}>
      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <SortableHeader label="Score" column="composite_score" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableHeader label="Fund Name" column="fund_name" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">GP</th>
              <th className="px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Strategy</th>
              <th className="px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Stage</th>
              <SortableHeader label="Submitted" column="created_at" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Verdict</th>
              <th className="px-2.5 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const processing = isProcessing(project.status);
              const verdict = getVerdict(project.composite_score, project.status);
              const verdictLabel = getVerdictLabel(verdict);
              const verdictColor = getVerdictColor(verdict);
              const statusLabel = getStatusLabel(project.status);
              const statusColor = getStatusColor(project.status);
              const stage = getStage(project);

              return (
                <tr
                  key={project.id}
                  className={`border-b border-border last:border-0 transition-colors ${
                    processing ? "opacity-60" : "hover:bg-muted/50 cursor-pointer"
                  }`}
                  onClick={() => !processing && navigate(`/project/${project.id}`)}
                >
                  {/* Score */}
                  <td className="px-2.5 py-2">
                    {processing ? (
                      <span className="text-xs font-medium text-muted-foreground">—</span>
                    ) : (
                      <ScoreBadge score={project.composite_score} size="sm" />
                    )}
                  </td>

                  {/* Fund Name */}
                  <td className="px-2.5 py-2">
                    <p className="font-medium text-foreground text-xs">{project.fund_name}</p>
                  </td>

                  {/* GP */}
                  <td className="px-2.5 py-2">
                    <span className="text-xs text-foreground">
                      {project.gp_entity_name || "—"}
                    </span>
                  </td>

                  {/* Strategy */}
                  <td className="px-2.5 py-2">
                    <StrategyPill strategy={project.asset_class} />
                  </td>

                  {/* Stage */}
                  <td className="px-2.5 py-2">
                    <StagePill stage={stage} />
                  </td>

                  {/* Submitted */}
                  <td className="px-2.5 py-2">
                    <span className="text-xs text-muted-foreground">
                      {formatSubmittedDate(project.created_at)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-2.5 py-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${statusColor}`}>
                      <span className="h-1 w-1 rounded-full bg-current" />
                      {statusLabel}
                    </span>
                  </td>

                  {/* Verdict */}
                  <td className="px-2.5 py-2">
                    <span className={`text-xs font-medium ${verdictColor}`}>
                      {verdictLabel}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-2.5 py-2">
                    <RowActionsMenu project={project} onRefresh={onRefresh} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="border-t border-border">{paginationBar}</div>
      </div>

      {/* Mobile — card list */}
      <div className="md:hidden space-y-2">
        {projects.map((project) => {
          const processing = isProcessing(project.status);
          const verdict = getVerdict(project.composite_score, project.status);
          const verdictLabel =
            verdict === "pending"
              ? `STATUS: ${getStatusLabel(project.status).toUpperCase()}`
              : `VERDICT: ${getVerdictLabel(verdict).toUpperCase()}`;
          const statusLabel = processing ? getStatusLabel(project.status) : project.status === "complete" ? "Under Review" : getStatusLabel(project.status);
          const statusColor = getStatusColor(project.status);
          const stage = getStage(project);

          return (
            <div
              key={project.id}
              className={`rounded-lg border border-border bg-card p-3 transition-colors ${
                processing ? "opacity-60" : "cursor-pointer active:bg-muted/50"
              }`}
              onClick={() => !processing && navigate(`/project/${project.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground text-sm">{project.fund_name}</p>
                    <StagePill stage={stage} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {project.asset_class || project.strategy || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {processing ? (
                    <span className="inline-flex items-center justify-center h-8 w-10 rounded-lg border-2 border-border text-xs font-bold text-muted-foreground">
                      {project.status === "pending" ? "PREP" : "PEND"}
                    </span>
                  ) : (
                    <ScoreBadge score={project.composite_score} size="sm" />
                  )}
                  <RowActionsMenu project={project} onRefresh={onRefresh} />
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  {verdictLabel}
                </span>
                <span className={`text-xs font-medium ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
            </div>
          );
        })}
        <div className="border-t border-border">{paginationBar}</div>
      </div>
    </BlurFade>
  );
}
