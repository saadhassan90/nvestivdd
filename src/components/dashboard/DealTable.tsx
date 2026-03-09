import { useNavigate } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
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
import type { Tables } from "@/integrations/supabase/types";

interface DealTableProps {
  projects: Tables<"projects">[];
  flagCounts: Record<string, { critical: number; elevated: number }>;
  totalCount?: number;
}

export function DealTable({ projects, flagCounts, totalCount }: DealTableProps) {
  const navigate = useNavigate();

  if (projects.length === 0) return null;

  return (
    <BlurFade delay={0.3}>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Fund Name</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Asset Class</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Score</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recommendation</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Flags</th>
              <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const flags = flagCounts[project.id] || { critical: 0, elevated: 0 };
              return (
                <tr
                  key={project.id}
                  className="border-b border-border last:border-0 transition-colors hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-foreground">{project.fund_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Established {project.established_year} • Vintage {project.vintage}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground">
                      {project.asset_class}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <ScoreBadge score={project.composite_score} />
                  </td>
                  <td className="px-6 py-4">
                    <RecommendationPill recommendation={project.recommendation} scoreTier={project.score_tier} />
                  </td>
                  <td className="px-6 py-4">
                    <FlagIndicator criticalCount={flags.critical} elevatedCount={flags.elevated} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="p-1 rounded-md hover:bg-muted transition-colors">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/project/${project.id}`); }}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          Export Report
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-border px-6 py-3">
          <p className="text-xs text-muted-foreground">
            Showing {projects.length} of {projects.length} results
          </p>
          <div className="flex items-center gap-1">
            <button className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">1</button>
          </div>
        </div>
      </div>
    </BlurFade>
  );
}
