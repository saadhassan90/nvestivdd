import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Sparkles } from "lucide-react";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";

import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { AnalyticsCards } from "@/components/dashboard/AnalyticsCards";
import { DealTable } from "@/components/dashboard/DealTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { NewDealModal } from "@/components/dashboard/NewDealModal";
import { FilterBar, type FilterState } from "@/components/dashboard/FilterBar";
import { BlurFade } from "@/components/magicui/BlurFade";
import { useChatContext } from "@/contexts/ChatContext";

import { supabase } from "@/integrations/supabase/client";
import { getScoreTier } from "@/lib/score-utils";
import type { Tables } from "@/integrations/supabase/types";

const PAGE_SIZE = 100;

export default function Dashboard() {
  const [projects, setProjects] = useState<Tables<"projects">[]>([]);
  const [flagCounts, setFlagCounts] = useState<Record<string, { critical: number; elevated: number }>>({});
  const [totalFlags, setTotalFlags] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    assetClass: null,
    scoreTier: null,
    recommendation: null,
    search: "",
    sortBy: "composite_score",
    sortDir: "desc",
  });
  const { isOpen, setIsOpen } = useChatContext();

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
      result = result.filter((p) => {
        const tier = p.score_tier || getScoreTier(p.composite_score);
        return tier === filters.scoreTier;
      });
    }
    if (filters.recommendation) {
      result = result.filter((p) => p.recommendation === filters.recommendation);
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

        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-card">
          <div className="flex h-14 items-center justify-between px-4 sm:px-6">
            {/* Logo for mobile */}
            <span className="lg:hidden text-lg font-bold text-foreground">Nvestiv</span>
            {/* Desktop title area */}
            <span className="hidden lg:block text-lg font-bold text-foreground">Nvestiv</span>

            {/* Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search institutional data..."
                  className="w-full rounded-lg border-0 bg-muted py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NotificationsDropdown />
              {!isOpen && (
                <button
                  onClick={() => setIsOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">Ask Iris</span>
                </button>
              )}
              <div className="h-8 w-8 rounded-full bg-muted border border-border" />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-4 sm:px-6 py-4 sm:py-6 pb-20 lg:pb-6">
          <BlurFade>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Fund submissions</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Sorted by L1 score, highest first</p>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Plus className="h-4 w-4" />
                Submit new fund
              </button>
            </div>
          </BlurFade>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
            </div>
          ) : projects.length === 0 ? (
            <EmptyState onNewDeal={() => setModalOpen(true)} />
          ) : (
            <div className="space-y-4">
              <AnalyticsCards projects={projects} />
              <FilterBar filters={filters} onChange={handleFiltersChange} assetClasses={assetClasses} />
              <DealTable
                projects={paginatedProjects}
                flagCounts={flagCounts}
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
              />

              {/* System integrity footer */}
              <BlurFade delay={0.25}>
                <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-severity-monitor/10 flex items-center justify-center shrink-0">
                    <span className="text-severity-monitor text-xs font-bold">i</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">System Integrity Check</p>
                    <p className="text-sm text-severity-monitor mt-0.5">
                      All scores are calculated using the L1 Institutional Framework v4.2. Scores below 50 trigger an automatic "Hard Floor" status and require manual compliance override for further processing.
                    </p>
                  </div>
                </div>
              </BlurFade>
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
