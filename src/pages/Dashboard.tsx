import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { AnalyticsCards } from "@/components/dashboard/AnalyticsCards";
import { DealTable } from "@/components/dashboard/DealTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { NewDealModal } from "@/components/dashboard/NewDealModal";
import { FilterBar, type FilterState } from "@/components/dashboard/FilterBar";
import { BlurFade } from "@/components/magicui/BlurFade";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { getScoreTier } from "@/lib/score-utils";
import type { Tables } from "@/integrations/supabase/types";

export default function Dashboard() {
  const [projects, setProjects] = useState<Tables<"projects">[]>([]);
  const [flagCounts, setFlagCounts] = useState<Record<string, { critical: number; elevated: number }>>({});
  const [totalFlags, setTotalFlags] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    assetClass: null,
    scoreTier: null,
    recommendation: null,
    search: "",
    sortBy: "created_at",
    sortDir: "desc",
  });

  const fetchData = async () => {
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectsData) {
      setProjects(projectsData);

      const { data: flags } = await supabase.from('red_flags').select('project_id, severity');
      if (flags) {
        const counts: Record<string, { critical: number; elevated: number }> = {};
        let total = 0;
        flags.forEach(f => {
          if (!counts[f.project_id]) counts[f.project_id] = { critical: 0, elevated: 0 };
          if (f.severity === 'critical') { counts[f.project_id].critical++; total++; }
          if (f.severity === 'elevated') { counts[f.project_id].elevated++; total++; }
        });
        setFlagCounts(counts);
        setTotalFlags(total);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('projects-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const assetClasses = useMemo(() => {
    const unique = new Set(projects.map(p => p.asset_class).filter(Boolean) as string[]);
    return Array.from(unique).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Filter by asset class
    if (filters.assetClass) {
      result = result.filter(p => p.asset_class === filters.assetClass);
    }

    // Filter by score tier
    if (filters.scoreTier) {
      result = result.filter(p => {
        const tier = p.score_tier || getScoreTier(p.composite_score);
        return tier === filters.scoreTier;
      });
    }

    // Filter by recommendation
    if (filters.recommendation) {
      result = result.filter(p => p.recommendation === filters.recommendation);
    }

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(p =>
        p.fund_name.toLowerCase().includes(q) ||
        (p.asset_class?.toLowerCase().includes(q))
      );
    }

    // Sort
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

  return (
    <div className="min-h-screen bg-background">
      <Header onNewDeal={() => setModalOpen(true)} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-6">
        <BlurFade>
          <div className="mb-4 sm:mb-6 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Dashboard</span>
            <span className="text-muted-foreground">&gt;</span>
            <span className="font-medium text-foreground">Due Diligence</span>
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
            <AnalyticsCards projects={projects} flagCount={totalFlags} />
            <FilterBar filters={filters} onChange={setFilters} assetClasses={assetClasses} />
            <DealTable projects={filteredProjects} flagCounts={flagCounts} totalCount={projects.length} />
          </div>
        )}
      </main>

      <NewDealModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
