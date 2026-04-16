import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2, ArrowUp, ArrowDown, ArrowUpDown, ArrowRight } from "lucide-react";
import { ScoreBadge } from "./ScoreBadge";
import { BlurFade } from "@/components/magicui/BlurFade";
import { getVerdict, getVerdictLabel, getVerdictColor, getStatusLabel, getStatusColor, formatSubmittedDate } from "@/lib/verdict-utils";
import type { Tables } from "@/integrations/supabase/types";

interface DealTableProps {
  projects: Tables<"projects">[];
  flagCounts: Record<string, { critical: number; elevated: number }>;
  totalCount?: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSort?: (column: string) => void;
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
      className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors group"
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
    <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground">
      {strategy}
    </span>
  );
}

export function DealTable({ projects, flagCounts, totalCount, page, totalPages, onPageChange, sortBy, sortDir, onSort }: DealTableProps) {
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
              <SortableHeader label="L1 Score" column="composite_score" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableHeader label="Fund Name" column="fund_name" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">GP</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Strategy</th>
              <SortableHeader label="Submitted" column="created_at" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Verdict</th>
              <th className="px-4 py-3 w-10"></th>
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

              return (
                <tr
                  key={project.id}
                  className={`border-b border-border last:border-0 transition-colors ${
                    processing ? "opacity-60" : "hover:bg-muted/50 cursor-pointer"
                  }`}
                  onClick={() => !processing && navigate(`/project/${project.id}`)}
                >
                  {/* L1 Score */}
                  <td className="px-4 py-3">
                    {processing ? (
                      <span className="text-xs font-medium text-muted-foreground">—</span>
                    ) : (
                      <ScoreBadge score={project.composite_score} size="sm" />
                    )}
                  </td>

                  {/* Fund Name */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground text-sm">{project.fund_name}</p>
                  </td>

                  {/* GP */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-foreground">
                      {project.gp_entity_name || "—"}
                    </span>
                  </td>

                  {/* Strategy */}
                  <td className="px-4 py-3">
                    <StrategyPill strategy={project.asset_class} />
                  </td>

                  {/* Submitted */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground">
                      {formatSubmittedDate(project.created_at)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${statusColor}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {statusLabel}
                    </span>
                  </td>

                  {/* Verdict */}
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${verdictColor}`}>
                      {verdictLabel}
                    </span>
                  </td>

                  {/* Arrow */}
                  <td className="px-4 py-3">
                    {!processing && verdict === "proceed" && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="border-t border-border">{paginationBar}</div>
      </div>

      {/* Mobile — card list matching mockup */}
      <div className="md:hidden space-y-2">
        {projects.map((project) => {
          const processing = isProcessing(project.status);
          const verdict = getVerdict(project.composite_score, project.status);
          const verdictLabel = verdict === "pending" ? `STATUS: ${getStatusLabel(project.status).toUpperCase()}` : `VERDICT: ${verdict === "proceed" ? "PASS" : verdict === "conditional" ? "PARTIAL" : "FAILED"}`;
          const statusLabel = processing ? getStatusLabel(project.status) : project.status === "complete" ? "Under Review" : getStatusLabel(project.status);
          const statusColor = getStatusColor(project.status);

          return (
            <div
              key={project.id}
              className={`rounded-xl border border-border bg-card p-4 transition-colors ${
                processing ? "opacity-60" : "cursor-pointer active:bg-muted/50"
              }`}
              onClick={() => !processing && navigate(`/project/${project.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-[15px]">{project.fund_name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {project.asset_class || project.strategy || "—"}
                  </p>
                </div>
                <div className="shrink-0">
                  {processing ? (
                    <span className="inline-flex items-center justify-center h-10 w-12 rounded-lg border-2 border-border text-xs font-bold text-muted-foreground">
                      {project.status === "pending" ? "PREP" : "PEND"}
                    </span>
                  ) : (
                    <ScoreBadge score={project.composite_score} size="md" />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
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
