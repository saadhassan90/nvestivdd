import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useChatContext } from "@/contexts/ChatContext";
import { ProjectSidebar } from "@/components/project/ProjectSidebar";
import { InsightsPanel } from "@/components/project/InsightsPanel";
import { OverviewTab } from "@/components/project/OverviewTab";
import { RedFlagsTab } from "@/components/project/RedFlagsTab";
import { InterrogatoryTab } from "@/components/project/InterrogatoryTab";
import { DataRoomTab } from "@/components/project/DataRoomTab";
import { SourceFilesTab } from "@/components/project/SourceFilesTab";
import { TeamTab } from "@/components/project/TeamTab";
import { PerformanceTab } from "@/components/project/PerformanceTab";
import { StrategyTab } from "@/components/project/StrategyTab";
import { ProcessingState } from "@/components/project/ProcessingState";
import { BlurFade } from "@/components/magicui/BlurFade";
import { ShimmerButton } from "@/components/magicui/ShimmerButton";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ProjectTopBar } from "@/components/project/ProjectTopBar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useReportMarkdown } from "@/hooks/use-report-markdown";
import { getTabMarkdown } from "@/lib/markdown-sections";

import type { Tables } from "@/integrations/supabase/types";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  
  const { toast } = useToast();
  const { setProjectScope, isOpen, setIsOpen } = useChatContext();

  const [project, setProject] = useState<Tables<"projects"> | null>(null);
  const [reportSections, setReportSections] = useState<Tables<"report_sections">[]>([]);
  const [redFlags, setRedFlags] = useState<Tables<"red_flags">[]>([]);
  const [interrogatoryItems, setInterrogatoryItems] = useState<Tables<"interrogatory_items">[]>([]);
  const [dataRoomItems, setDataRoomItems] = useState<Tables<"data_room_items">[]>([]);
  const [documents, setDocuments] = useState<Tables<"documents">[]>([]);
  const [researchSources, setResearchSources] = useState<Tables<"research_sources">[]>([]);
  const [moduleScores, setModuleScores] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([]);
  const [feeStructure, setFeeStructure] = useState<any[]>([]);
  const [thesisValidations, setThesisValidations] = useState<any[]>([]);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [marketFactors, setMarketFactors] = useState<any[]>([]);
  const [serviceProviders, setServiceProviders] = useState<any[]>([]);
  const [submissionQuality, setSubmissionQuality] = useState<any[]>([]);
  const [docQualityFlags, setDocQualityFlags] = useState<any[]>([]);
  const [criticalInfoGaps, setCriticalInfoGaps] = useState<any[]>([]);
  const [engagementCaseStudies, setEngagementCaseStudies] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const [loading, setLoading] = useState(true);

  const { sections: reportMarkdownSections } = useReportMarkdown(id);

  const isProcessing = project
    ? ["processing", "pending", "uploading", "analyzing", "extracting"].includes(project.status)
    : false;

  // Default to analysis_log tab when processing
  useEffect(() => {
    if (isProcessing && activeTab === "overview") {
      setActiveTab("analysis_log");
    }
  }, [isProcessing]);

  const fetchData = useCallback(async () => {
    if (!id) return;

    const [
      projectRes, sectionsRes, flagsRes, interrogatoryRes, dataRoomRes, docsRes, sourcesRes,
      moduleScoresRes, teamRes, perfRes, feesRes, thesisRes, compRes, marketRes, spRes, sqRes, dqRes, cigRes, ecsRes,
    ] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase.from("report_sections").select("*").eq("project_id", id).order("order_index"),
      supabase.from("red_flags").select("*").eq("project_id", id).order("order_index", { ascending: true }),
      supabase.from("interrogatory_items").select("*").eq("project_id", id).order("order_index"),
      supabase.from("data_room_items").select("*").eq("project_id", id).order("order_index"),
      supabase.from("documents").select("*").eq("project_id", id).order("uploaded_at", { ascending: false }),
      supabase.from("research_sources").select("*").eq("project_id", id).order("added_at", { ascending: false }),
      supabase.from("module_scores").select("*").eq("project_id", id).order("order_index"),
      supabase.from("team_members").select("*").eq("project_id", id).order("order_index"),
      supabase.from("performance_metrics").select("*").eq("project_id", id).order("order_index"),
      supabase.from("fee_structure").select("*").eq("project_id", id).order("order_index"),
      supabase.from("thesis_validations").select("*").eq("project_id", id).order("order_index"),
      supabase.from("competitive_landscape").select("*").eq("project_id", id).order("order_index"),
      supabase.from("market_factors").select("*").eq("project_id", id).order("order_index"),
      supabase.from("service_providers").select("*").eq("project_id", id),
      supabase.from("submission_quality").select("*").eq("project_id", id).order("order_index"),
      supabase.from("document_quality_flags").select("*").eq("project_id", id),
      supabase.from("critical_info_gaps").select("*").eq("project_id", id).order("order_index"),
      supabase.from("engagement_case_studies").select("*").eq("project_id", id).order("order_index"),
    ]);

    if (projectRes.data) setProject(projectRes.data);
    if (sectionsRes.data) setReportSections(sectionsRes.data);
    if (flagsRes.data) setRedFlags(flagsRes.data);
    if (interrogatoryRes.data) setInterrogatoryItems(interrogatoryRes.data);
    if (dataRoomRes.data) setDataRoomItems(dataRoomRes.data);
    if (docsRes.data) setDocuments(docsRes.data);
    if (sourcesRes.data) setResearchSources(sourcesRes.data);
    if (moduleScoresRes.data) setModuleScores(moduleScoresRes.data);
    if (teamRes.data) setTeamMembers(teamRes.data);
    if (perfRes.data) setPerformanceMetrics(perfRes.data);
    if (feesRes.data) setFeeStructure(feesRes.data);
    if (thesisRes.data) setThesisValidations(thesisRes.data);
    if (compRes.data) setCompetitors(compRes.data);
    if (marketRes.data) setMarketFactors(marketRes.data);
    if (spRes.data) setServiceProviders(spRes.data);
    if (sqRes.data) setSubmissionQuality(sqRes.data);
    if (dqRes.data) setDocQualityFlags(dqRes.data);
    if (cigRes.data) setCriticalInfoGaps(cigRes.data);
    if (ecsRes.data) setEngagementCaseStudies(ecsRes.data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`project-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "projects", filter: `id=eq.${id}` }, (payload) => {
        const updated = payload.new as Tables<"projects">;
        setProject(updated);
        if (updated.status === "complete" || updated.status === "completed") {
          toast({ title: "Analysis Complete", description: `Analysis complete for ${updated.fund_name}` });
          fetchData();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, fetchData, toast]);

  useEffect(() => {
    if (project) {
      setProjectScope({ id: project.id, name: project.fund_name });
    }
    return () => { setProjectScope(null); };
  }, [project?.id, project?.fund_name, setProjectScope]);

  const handleRerunAnalysis = async () => {
    if (!project) return;
    await supabase.from("projects").update({ status: "processing", error_message: null }).eq("id", project.id);
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dispatch-analysis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ project_id: project.id }),
    }).catch((err) => console.error("Analysis dispatch error:", err));
    toast({ title: "Analysis dispatched", description: "The analysis has been sent to the processing agent." });
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  const hasReportMarkdown = reportMarkdownSections.length > 0;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Full-width top bar */}
      <ProjectTopBar project={project} isProcessing={isProcessing} />

      {/* Three-panel body below the top bar */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left sidebar */}
        <ProjectSidebar project={project} activeTab={activeTab} onTabChange={setActiveTab} moduleScoresData={moduleScores} />

        {/* Center column */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Mobile nav pills */}
          <div className="lg:hidden">
            <ProjectSidebar project={project} activeTab={activeTab} onTabChange={setActiveTab} moduleScoresData={moduleScores} />
          </div>

          {/* Content area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 lg:pb-6">
            {activeTab === "analysis_log" ? (
              <ProcessingState startedAt={project.updated_at} projectId={project.id} />
            ) : isProcessing && activeTab === "overview" ? (
              <ProcessingState startedAt={project.updated_at} projectId={project.id} />
            ) : project.status === "error" ? (
              <BlurFade>
                <div className="flex flex-col items-center justify-center py-20">
                  <p className="text-severity-critical font-semibold text-lg mb-2">Analysis Error</p>
                  <p className="text-sm text-muted-foreground mb-4 text-center px-4">{project.error_message || "An unexpected error occurred."}</p>
                  <ShimmerButton onClick={handleRerunAnalysis}>Retry Analysis</ShimmerButton>
                </div>
              </BlurFade>
            ) : (
              <>
                {activeTab === "overview" && (
                  <OverviewTab
                    project={project}
                    redFlags={redFlags}
                    reportSections={reportSections}
                    documents={documents}
                    moduleScoresData={moduleScores}
                    submissionQuality={submissionQuality}
                    docQualityFlags={docQualityFlags}
                    criticalInfoGaps={criticalInfoGaps}
                    onRerunAnalysis={handleRerunAnalysis}
                    reportMarkdown={hasReportMarkdown ? getTabMarkdown(reportMarkdownSections, "overview") : null}
                  />
                )}
                {activeTab === "team" && (
                  <TeamTab
                    teamMembers={teamMembers}
                    serviceProviders={serviceProviders}
                    reportSection={reportSections.find((s) => s.section_title?.toLowerCase().includes("team") || s.section_title?.toLowerCase().includes("leadership"))}
                    reportMarkdown={hasReportMarkdown ? getTabMarkdown(reportMarkdownSections, "team") : null}
                    moduleScore={moduleScores.find((ms: any) => ms.module_key?.includes("team"))?.score}
                  />
                )}
                {activeTab === "performance" && (
                  <PerformanceTab
                    metrics={performanceMetrics}
                    fees={feeStructure}
                    engagementCaseStudies={engagementCaseStudies}
                    performanceWriteup={reportSections.find((s) => s.section_title?.toLowerCase().includes("performance") || s.section_title?.toLowerCase().includes("track record"))}
                    feesWriteup={reportSections.find((s) => s.section_title?.toLowerCase().includes("fee") || s.section_title?.toLowerCase().includes("economics"))}
                    reportMarkdown={hasReportMarkdown ? getTabMarkdown(reportMarkdownSections, "performance") : null}
                    moduleScore={moduleScores.find((ms: any) => ms.module_key?.includes("financial"))?.score}
                  />
                )}
                {activeTab === "strategy" && (
                  <StrategyTab
                    thesisValidations={thesisValidations}
                    competitors={competitors}
                    marketFactors={marketFactors}
                    reportSection={reportSections.find((s) => s.section_title?.toLowerCase().includes("strategy") || s.section_title?.toLowerCase().includes("market"))}
                    reportMarkdown={hasReportMarkdown ? getTabMarkdown(reportMarkdownSections, "strategy") : null}
                    moduleScore={moduleScores.find((ms: any) => ms.module_key?.includes("strategy"))?.score}
                    fundName={project.fund_name}
                  />
                )}
                {activeTab === "red_flags" && (
                  <RedFlagsTab
                    redFlags={redFlags}
                    reportMarkdown={hasReportMarkdown ? getTabMarkdown(reportMarkdownSections, "red_flags") : null}
                    moduleScore={moduleScores.find((ms: any) => ms.module_key?.includes("operations") || ms.module_key?.includes("risk"))?.score}
                    fundName={project.fund_name}
                    submissionQuality={submissionQuality}
                    criticalInfoGaps={criticalInfoGaps}
                  />
                )}
                {activeTab === "interrogatory" && (
                  <InterrogatoryTab
                    items={interrogatoryItems}
                    fundName={project.fund_name}
                    reportMarkdown={hasReportMarkdown ? getTabMarkdown(reportMarkdownSections, "interrogatory") : null}
                  />
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
                    reportMarkdown={hasReportMarkdown ? getTabMarkdown(reportMarkdownSections, "data_room") : null}
                  />
                )}
                {activeTab === "documents" && (
                  <SourceFilesTab
                    researchSources={researchSources}
                    reportMarkdown={hasReportMarkdown ? getTabMarkdown(reportMarkdownSections, "documents") : null}
                  />
                )}
              </>
            )}
          </main>
        </div>

        {/* Right insights panel */}
        <InsightsPanel projectName={project.fund_name} isProcessing={isProcessing} />
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </div>
  );
}
