import { useNavigate } from "react-router-dom";
import { MoreHorizontal, ChevronLeft, ChevronRight, User, Loader2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { ScoreBadge } from "./ScoreBadge";
import { RecommendationPill } from "./RecommendationPill";
import { FlagIndicator } from "./FlagIndicator";
import { BlurFade } from "@/components/magicui/BlurFade";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
      className="px-3 lg:px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors group"
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
  // Build page numbers to show
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
    <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5">
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
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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

export function DealTable({ projects, flagCounts, totalCount, page, totalPages, onPageChange }: DealTableProps) {
  const navigate = useNavigate();

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No deals match your filters.</p>
      </div>
    );
  }

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
      {/* Desktop table — tighter spacing */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 lg:px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Fund Name</th>
              <th className="px-3 lg:px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Asset Class</th>
              <th className="px-3 lg:px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Score</th>
              <th className="px-3 lg:px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recommendation</th>
              <th className="px-3 lg:px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Flags</th>
              <th className="px-3 lg:px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Submitted By</th>
              <th className="px-3 lg:px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-12"></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const flags = flagCounts[project.id] || { critical: 0, elevated: 0 };
              const submitter = (project as any).submitter_name;
              const submitterCompany = (project as any).submitter_company;
              const isProcessing = ['uploading', 'processing', 'analyzing', 'extracting', 'pending'].includes(project.status);
              return (
                <tr
                  key={project.id}
                  className={`border-b border-border last:border-0 transition-colors ${isProcessing ? 'opacity-70' : 'hover:bg-muted/50 cursor-pointer'}`}
                  onClick={() => !isProcessing && navigate(`/project/${project.id}`)}
                >
                  <td className="px-3 lg:px-4 py-2">
                    <p className="font-medium text-foreground text-sm truncate max-w-[200px] lg:max-w-none">{project.fund_name}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Est. {project.established_year} • V{project.vintage}
                    </p>
                  </td>
                  <td className="px-3 lg:px-4 py-2">
                    <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground">
                      {project.asset_class || '—'}
                    </span>
                  </td>
                  <td className="px-3 lg:px-4 py-2">
                    {isProcessing ? (
                      <div className="flex items-center justify-center h-7 w-9">
                        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                      </div>
                    ) : (
                      <ScoreBadge score={project.composite_score} size="sm" />
                    )}
                  </td>
                  <td className="px-3 lg:px-4 py-2">
                    {isProcessing ? (
                      <span className="text-xs text-muted-foreground italic">Running analysis…</span>
                    ) : (
                      <RecommendationPill recommendation={project.recommendation} scoreTier={project.score_tier} />
                    )}
                  </td>
                  <td className="px-3 lg:px-4 py-2" onClick={(e) => { if (!isProcessing) { e.stopPropagation(); navigate(`/project/${project.id}?tab=red_flags`); } }}>
                    <FlagIndicator criticalCount={flags.critical} elevatedCount={flags.elevated} />
                  </td>
                  <td className="px-3 lg:px-4 py-2">
                    {submitter ? (
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm text-foreground cursor-default hover:text-primary transition-colors">
                              {submitter}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="p-0 border-0 bg-transparent shadow-none">
                            <div className="rounded-xl border border-border bg-card p-4 shadow-lg min-w-[200px]">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{submitter}</p>
                                  {submitterCompany && (
                                    <p className="text-xs text-muted-foreground">{submitterCompany}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 lg:px-4 py-2 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="p-1 rounded-md hover:bg-muted transition-colors">
                          <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/project/${project.id}`); }}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Export Report</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Archive</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="border-t border-border">
          {paginationBar}
        </div>
      </div>

      {/* Mobile — compact list rows instead of cards */}
      <div className="md:hidden rounded-xl border border-border bg-card overflow-hidden">
        {projects.map((project, i) => {
          const flags = flagCounts[project.id] || { critical: 0, elevated: 0 };
          const isProcessing = ['uploading', 'processing', 'analyzing', 'extracting', 'pending'].includes(project.status);
          return (
            <div
              key={project.id}
              className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                i < projects.length - 1 ? 'border-b border-border' : ''
              } ${isProcessing ? 'opacity-70' : 'cursor-pointer active:bg-muted/50'}`}
              onClick={() => !isProcessing && navigate(`/project/${project.id}`)}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-[13px] truncate">{project.fund_name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">{project.asset_class || '—'}</span>
                  <span className="text-[10px] text-muted-foreground">•</span>
                  {isProcessing ? (
                    <span className="text-[10px] text-muted-foreground italic">Running analysis…</span>
                  ) : (
                    <RecommendationPill recommendation={project.recommendation} scoreTier={project.score_tier} />
                  )}
                  {(flags.critical > 0 || flags.elevated > 0) && (
                    <FlagIndicator criticalCount={flags.critical} elevatedCount={flags.elevated} />
                  )}
                </div>
              </div>
              {isProcessing ? (
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
              ) : (
                <ScoreBadge score={project.composite_score} size="sm" />
              )}
            </div>
          );
        })}
        <div className="border-t border-border">
          {paginationBar}
        </div>
      </div>
    </BlurFade>
  );
}
