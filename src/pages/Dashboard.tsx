import { NvestivLoader, useNvestivLoaderGate } from "@/components/ui/NvestivLoader";
import { useState, useMemo, useEffect } from "react";
import { Plus } from "lucide-react";
import { CommandSearch } from "@/components/search/CommandSearch";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { AnalyticsCards } from "@/components/dashboard/AnalyticsCards";
import { DealTable } from "@/components/dashboard/DealTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { NewDealModal } from "@/components/dashboard/NewDealModal";
import { FilterBar, type FilterState } from "@/components/dashboard/FilterBar";
import { BlurFade } from "@/components/magicui/BlurFade";
import { supabase } from "@/integrations/supabase/client";
import { getScoreTier } from "@/lib/score-utils";
import { getVerdict } from "@/lib/verdict-utils";
import type { Tables } from "@/integrations/supabase/types";
import type { CitationChip } from "@/components/project/typed/CitationChips";

const PAGE_SIZE = 100;

export default function Dashboard() {
  const [projects, setProjects] = useState<Tables<"projects">[]>([]);
  const [flagCounts, setFlagCounts] = useState<Record<string, { critical: number; elevated: number }>>({});
  const [citationsByProject, setCitationsByProject] = useState<Record<string, CitationChip[]>>({});
  const [totalFlags, setTotalFlags] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    assetClass: null,
    scoreTier: null,
    recommendation: null,
    status: null,
    stage: null,
    search: "",
    sortBy: "composite_score",
    sortDir: "desc",
  });
  const showLoader = useNvestivLoaderGate(loading);

  const fetchData = async () => {
    let allProjects: Tables<"projects">[] = [];
    let from = 0;
    const batchSize = 1000;
    while (true) {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, from + batchSize - 1);
      if (!data || data.length === 0) break;
      allProjects = [...allProjects, ...data];
      if (data.length < batchSize) break;
      from += batchSize;
    }
    setProjects(allProjects);

    let allFlags: { project_id: string; severity: string }[] = [];
    from = 0;
    while (true) {
      const { data } = await supabase
        .from("red_flags")
        .select("project_id, severity")
        .range(from, from + batchSize - 1);
      if (!data || data.length === 0) break;
      allFlags = [...allFlags, ...data];
      if (data.length < batchSize) break;
      from += batchSize;
    }

    const counts: Record<string, { critical: number; elevated: number }> = {};
    let total = 0;
    allFlags.forEach((f) => {
      if (!counts[f.project_id]) counts[f.project_id] = { critical: 0, elevated: 0 };
      if (f.severity === "critical") { counts[f.project_id].critical++; total++; }
      if (f.severity === "elevated") { counts[f.project_id].elevated++; total++; }
    });
    setFlagCounts(counts);
    setTotalFlags(total);

    // PRD §6.4 — top-3 primary citations per project, surfaced on dashboard rows.
    const projectIds = allProjects.map((p) => p.id);
    if (projectIds.length) {
      const { data: srcRows } = await supabase
        .from("research_sources")
        .select("id, project_id, title, url, source_type, accessed_date, is_primary")
        .in("project_id", projectIds)
        .order("is_primary", { ascending: false })
        .order("added_at", { ascending: false });

      const grouped: Record<string, CitationChip[]> = {};
      (srcRows ?? []).forEach((s) => {
        const list = grouped[s.project_id] ?? (grouped[s.project_id] = []);
        if (list.length >= 3) return;
        list.push({
          id: s.id,
          label: s.title || (s.url ? new URL(s.url).hostname.replace(/^www\./, "") : "source"),
          url: s.url,
          type: s.source_type,
          date: s.accessed_date,
        });
      });
      setCitationsByProject(grouped);
    } else {
      setCitationsByProject({});
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("projects-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const assetClasses = useMemo(() => {
    const unique = new Set(projects.map((p) => p.asset_class).filter(Boolean) as string[]);
    return Array.from(unique).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (filters.assetClass) {
      result = result.filter((p) => p.asset_class === filters.assetClass);
    }
    if (filters.scoreTier) {
      result = result.filter((p) => getScoreTier(p.composite_score) === filters.scoreTier);
    }
    if (filters.recommendation) {
      result = result.filter((p) => {
        const verdict = getVerdict(p.composite_score, p.status);
        return verdict === filters.recommendation;
      });
    }
    if (filters.status) {
      result = result.filter((p) => {
        if (filters.status === "processing") {
          return ["processing", "analyzing", "extracting", "uploading"].includes(p.status);
        }
        if (filters.status === "pending") {
          return p.status === "pending";
        }
        return p.status === filters.status;
      });
    }
    if (filters.stage) {
      // Currently all are L1; filter is ready for when L2/L3 are added
      result = result.filter(() => filters.stage === "L1");
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.fund_name.toLowerCase().includes(q) ||
          (p.asset_class?.toLowerCase().includes(q)) ||
          (p.gp_entity_name?.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      const dir = filters.sortDir === "asc" ? 1 : -1;
      switch (filters.sortBy) {
        case "fund_name":
          return dir * a.fund_name.localeCompare(b.fund_name);
        case "composite_score":
          return dir * ((a.composite_score || 0) - (b.composite_score || 0));
        case "asset_class":
          return dir * (a.asset_class || "").localeCompare(b.asset_class || "");
        default:
          return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      }
    });

    return result;
  }, [projects, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE));
  const paginatedProjects = filteredProjects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background flex flex-col">
        {/* Main content */}
        <main className="flex-1 px-4 sm:px-6 py-4 sm:py-6 pb-20 lg:pb-6">
          <BlurFade>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Deals</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Sorted by score, highest first</p>
              </div>
              <div className="flex items-center gap-2">
                <CommandSearch />
                <button
                onClick={() => setModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Plus className="h-4 w-4" />
                Submit new fund
                </button>
              </div>
            </div>
          </BlurFade>

          {showLoader ? (
            <NvestivLoader fullscreen size={120} />
          ) : projects.length === 0 ? (
            <EmptyState onNewDeal={() => setModalOpen(true)} />
          ) : (
            <div className="space-y-4">
              <AnalyticsCards projects={projects} />
              <FilterBar filters={filters} onChange={handleFiltersChange} assetClasses={assetClasses} />
              <DealTable
                projects={paginatedProjects}
                flagCounts={flagCounts}
                citationsByProject={citationsByProject}
                totalCount={filteredProjects.length}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                sortBy={filters.sortBy}
                sortDir={filters.sortDir}
                onSort={(column) =>
                  handleFiltersChange({
                    ...filters,
                    sortBy: column,
                    sortDir: filters.sortBy === column && filters.sortDir === "asc" ? "desc" : "asc",
                  })
                }
                onRefresh={fetchData}
              />

            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="hidden lg:flex items-center justify-between border-t border-border px-6 py-3 text-[11px] text-muted-foreground">
          <span>© 2024 Nvestiv Institutional Archive</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-score-strong" />
              API Stable
            </span>
            <span>Build 4.2.0-ARC</span>
          </div>
        </footer>

      {/* Mobile FAB */}
      <button
        onClick={() => setModalOpen(true)}
        className="sm:hidden fixed right-4 bottom-16 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg"
      >
        <Plus className="h-6 w-6" />
      </button>

      <MobileBottomNav />
      <NewDealModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
