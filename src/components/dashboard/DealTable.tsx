import { useNavigate } from "react-router-dom";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Card, CardBody, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  Button, Pagination,
} from "@heroui/react";
import { MoreHorizontal } from "lucide-react";
import { ScoreBadge } from "./ScoreBadge";
import { RecommendationPill } from "./RecommendationPill";
import { FlagIndicator } from "./FlagIndicator";
import { BlurFade } from "@/components/magicui/BlurFade";
import type { Tables } from "@/integrations/supabase/types";

interface DealTableProps {
  projects: Tables<"projects">[];
  flagCounts: Record<string, { critical: number; elevated: number }>;
  totalCount?: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function DealTable({ projects, flagCounts, totalCount, page, totalPages, onPageChange }: DealTableProps) {
  const navigate = useNavigate();

  if (projects.length === 0) {
    return (
      <Card shadow="sm">
        <CardBody className="p-8 text-center">
          <p className="text-sm text-default-500">No deals match your filters.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <BlurFade delay={0.15}>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Card shadow="sm">
          <CardBody className="p-0 overflow-hidden">
            <Table
              aria-label="Deals"
              removeWrapper
              classNames={{
                th: "text-[10px] font-semibold uppercase tracking-wider text-default-500 bg-default-50",
                td: "py-3",
                tr: "cursor-pointer hover:bg-default-50 transition-colors",
              }}
              bottomContent={
                totalPages > 1 ? (
                  <div className="flex justify-between items-center px-4 py-2">
                    <span className="text-xs text-default-400">
                      {projects.length} of {totalCount ?? projects.length} results
                    </span>
                    <Pagination
                      total={totalPages}
                      page={page}
                      onChange={onPageChange}
                      size="sm"
                      showControls
                      classNames={{ cursor: "bg-primary text-white" }}
                    />
                  </div>
                ) : (
                  <div className="px-4 py-2">
                    <span className="text-xs text-default-400">
                      {projects.length} of {totalCount ?? projects.length} results
                    </span>
                  </div>
                )
              }
            >
              <TableHeader>
                <TableColumn>Fund Name</TableColumn>
                <TableColumn>Asset Class</TableColumn>
                <TableColumn>Score</TableColumn>
                <TableColumn>Recommendation</TableColumn>
                <TableColumn>Flags</TableColumn>
                <TableColumn width={48}>{""}</TableColumn>
              </TableHeader>
              <TableBody>
                {projects.map((project) => {
                  const flags = flagCounts[project.id] || { critical: 0, elevated: 0 };
                  return (
                    <TableRow key={project.id} onClick={() => navigate(`/project/${project.id}`)}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground text-sm">{project.fund_name}</p>
                          <p className="text-[10px] text-default-400">
                            Est. {project.established_year} • V{project.vintage}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat" classNames={{ content: "text-[10px] font-semibold uppercase tracking-wider" }}>
                          {project.asset_class}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <ScoreBadge score={project.composite_score} size="sm" />
                      </TableCell>
                      <TableCell>
                        <RecommendationPill recommendation={project.recommendation} scoreTier={project.score_tier} />
                      </TableCell>
                      <TableCell>
                        <FlagIndicator criticalCount={flags.critical} elevatedCount={flags.elevated} />
                      </TableCell>
                      <TableCell>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly variant="light" size="sm" onPress={(e) => e.continuePropagation?.()}>
                              <MoreHorizontal className="h-3.5 w-3.5 text-default-400" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu aria-label="Actions">
                            <DropdownItem key="view" onPress={() => navigate(`/project/${project.id}`)}>View Details</DropdownItem>
                            <DropdownItem key="export">Export Report</DropdownItem>
                            <DropdownItem key="archive">Archive</DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>

      {/* Mobile list */}
      <div className="md:hidden">
        <Card shadow="sm">
          <CardBody className="p-0">
            {projects.map((project, i) => {
              const flags = flagCounts[project.id] || { critical: 0, elevated: 0 };
              return (
                <div
                  key={project.id}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer active:bg-default-50 transition-colors ${
                    i < projects.length - 1 ? 'border-b border-divider' : ''
                  }`}
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-[13px] truncate">{project.fund_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-default-400">{project.asset_class}</span>
                      <span className="text-[10px] text-default-400">•</span>
                      <RecommendationPill recommendation={project.recommendation} scoreTier={project.score_tier} />
                      {(flags.critical > 0 || flags.elevated > 0) && (
                        <FlagIndicator criticalCount={flags.critical} elevatedCount={flags.elevated} />
                      )}
                    </div>
                  </div>
                  <ScoreBadge score={project.composite_score} size="sm" />
                </div>
              );
            })}
            {totalPages > 1 && (
              <div className="flex justify-center py-3 border-t border-divider">
                <Pagination total={totalPages} page={page} onChange={onPageChange} size="sm" showControls />
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </BlurFade>
  );
}
