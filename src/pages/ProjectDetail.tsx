import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useChatContext } from "@/contexts/ChatContext";
import { ProjectSidebar } from "@/components/project/ProjectSidebar";
import { OverviewTab } from "@/components/project/OverviewTab";
import { ModuleTab } from "@/components/project/ModuleTab";
import { RedFlagsTab } from "@/components/project/RedFlagsTab";
import { InterrogatoryTab } from "@/components/project/InterrogatoryTab";
import { DataRoomTab } from "@/components/project/DataRoomTab";
import { SourceFilesTab } from "@/components/project/SourceFilesTab";
import { ProcessingState } from "@/components/project/ProcessingState";
import { BlurFade } from "@/components/magicui/BlurFade";
import { ShimmerButton } from "@/components/magicui/ShimmerButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setProjectScope } = useChatContext();

  const [project, setProject] = useState<Tables<"projects"> | null>(null);
  const [reportSections, setReportSections] = useState<Tables<"report_sections">[]>([]);
  const [redFlags, setRedFlags] = useState<Tables<"red_flags">[]>([]);
  const [interrogatoryItems, setInterrogatoryItems] = useState<Tables<"interrogatory_items">[]>([]);
  const [dataRoomItems, setDataRoomItems] = useState<Tables<"data_room_items">[]>([]);
  const [documents, setDocuments] = useState<Tables<"documents">[]>([]);
  const [researchSources, setResearchSources] = useState<Tables<"research_sources">[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeModule, setActiveModule] = useState("module_a");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;

    const [projectRes, sectionsRes, flagsRes, interrogatoryRes, dataRoomRes, docsRes, sourcesRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('report_sections').select('*').eq('project_id', id).order('order_index'),
      supabase.from('red_flags').select('*').eq('project_id', id).order('logged_at', { ascending: false }),
      supabase.from('interrogatory_items').select('*').eq('project_id', id).order('order_index'),
      supabase.from('data_room_items').select('*').eq('project_id', id).order('order_index'),
      supabase.from('documents').select('*').eq('project_id', id).order('uploaded_at', { ascending: false }),
      supabase.from('research_sources').select('*').eq('project_id', id).order('added_at', { ascending: false }),
    ]);

    if (projectRes.data) setProject(projectRes.data);
    if (sectionsRes.data) setReportSections(sectionsRes.data);
    if (flagsRes.data) setRedFlags(flagsRes.data);
    if (interrogatoryRes.data) setInterrogatoryItems(interrogatoryRes.data);
    if (dataRoomRes.data) setDataRoomItems(dataRoomRes.data);
    if (docsRes.data) setDocuments(docsRes.data);
    if (sourcesRes.data) setResearchSources(sourcesRes.data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`project-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'projects', filter: `id=eq.${id}` }, (payload) => {
        const updated = payload.new as Tables<"projects">;
        setProject(updated);
        if (updated.status === 'complete') {
          toast({ title: "Analysis Complete", description: `Analysis complete for ${updated.fund_name}` });
          fetchData();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, fetchData, toast]);

  // Auto-scope chat to this project
  useEffect(() => {
    if (project) {
      setProjectScope({ id: project.id, name: project.fund_name });
    }
    return () => { setProjectScope(null); };
  }, [project?.id, project?.fund_name, setProjectScope]);

  const handleRerunAnalysis = async () => {
    if (!project) return;
    await supabase.from('task_queue').insert({
      project_id: project.id,
      task_type: 'l1_analysis',
      status: 'pending',
    });
    await supabase.from('projects').update({ status: 'processing', error_message: null }).eq('id', project.id);
    toast({ title: "Analysis queued", description: "The report will be updated with the latest data." });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Project not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Breadcrumbs */}
      <div className="border-b border-border bg-card px-4 sm:px-6 py-2 overflow-x-auto">
        <div className="flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap">
          <button onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-foreground transition-colors">Projects</button>
          <span className="text-muted-foreground">&gt;</span>
          <span className="text-muted-foreground hidden sm:inline">{project.asset_class}</span>
          <span className="text-muted-foreground hidden sm:inline">&gt;</span>
          <span className="font-medium text-foreground truncate">{project.fund_name}</span>
        </div>
      </div>

      {/* Mobile only: horizontal nav */}
      <div className="lg:hidden">
        <ProjectSidebar project={project} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Desktop only: sidebar alongside content */}
        <div className="hidden lg:flex">
          <ProjectSidebar project={project} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {project.status === 'processing' ? (
            <ProcessingState />
          ) : project.status === 'error' ? (
            <BlurFade>
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-severity-critical font-semibold text-lg mb-2">Analysis Error</p>
                <p className="text-sm text-muted-foreground mb-4 text-center px-4">{project.error_message || 'An unexpected error occurred.'}</p>
                <ShimmerButton onClick={handleRerunAnalysis}>Retry Analysis</ShimmerButton>
              </div>
            </BlurFade>
          ) : (
            <>
              {activeTab === "overview" && (
                <OverviewTab project={project} redFlags={redFlags} reportSections={reportSections} documents={documents} onRerunAnalysis={handleRerunAnalysis} />
              )}
              {activeTab === "modules" && (
                <ModuleTab sections={reportSections} activeModule={activeModule} onModuleChange={setActiveModule} />
              )}
              {activeTab === "red_flags" && (
                <RedFlagsTab redFlags={redFlags} />
              )}
              {activeTab === "interrogatory" && (
                <InterrogatoryTab items={interrogatoryItems} fundName={project.fund_name} />
              )}
              {activeTab === "data_room" && (
                <DataRoomTab
                  items={dataRoomItems}
                  documents={documents}
                  projectId={project.id}
                  projectStatus={project.status}
                  lastAnalysisAt={project.updated_at}
                  onRefresh={fetchData}
                  onRerunAnalysis={handleRerunAnalysis}
                />
              )}
              {activeTab === "documents" && (
                <SourceFilesTab researchSources={researchSources} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
