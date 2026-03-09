import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { AnalyticsCards } from "@/components/dashboard/AnalyticsCards";
import { DealTable } from "@/components/dashboard/DealTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { NewDealModal } from "@/components/dashboard/NewDealModal";
import { BlurFade } from "@/components/magicui/BlurFade";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export default function Dashboard() {
  const [projects, setProjects] = useState<Tables<"projects">[]>([]);
  const [flagCounts, setFlagCounts] = useState<Record<string, { critical: number; elevated: number }>>({});
  const [totalFlags, setTotalFlags] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectsData) {
      setProjects(projectsData);

      // Fetch flag counts per project
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

    // Realtime subscription
    const channel = supabase
      .channel('projects-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header onNewDeal={() => setModalOpen(true)} />

      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* Breadcrumbs */}
        <BlurFade>
          <div className="mb-6 flex items-center gap-2 text-sm">
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
          <div className="space-y-6">
            <AnalyticsCards projects={projects} flagCount={totalFlags} />
            <DealTable projects={projects} flagCounts={flagCounts} />
          </div>
        )}
      </main>

      <NewDealModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
