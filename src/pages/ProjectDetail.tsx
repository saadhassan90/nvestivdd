import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useChatContext } from "@/contexts/ChatContext";
import { ProjectSidebar } from "@/components/project/ProjectSidebar";
import { InsightsPanel } from "@/components/project/InsightsPanel";
import { OverviewTab } from "@/components/project/OverviewTab";
import { ScorecardTab } from "@/components/project/ScorecardTab";
import { RedFlagsTab } from "@/components/project/RedFlagsTab";
import { InterrogatoryTab } from "@/components/project/InterrogatoryTab";
import { DataRoomTab } from "@/components/project/DataRoomTab";
import { SourceFilesTab } from "@/components/project/SourceFilesTab";
import { TeamTab } from "@/components/project/TeamTab";
import { TrackRecordTab } from "@/components/project/TrackRecordTab";
import { InvestmentThesisTab } from "@/components/project/InvestmentThesisTab";
import { MarketRealityTab } from "@/components/project/MarketRealityTab";
import { EconomicsTab } from "@/components/project/EconomicsTab";
import { ProcessingState } from "@/components/project/ProcessingState";
import { BlurFade } from "@/components/magicui/BlurFade";
import { ShimmerButton } from "@/components/magicui/ShimmerButton";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ProjectTopBar } from "@/components/project/ProjectTopBar";
import { HardFloorBanner } from "@/components/project/primitives/HardFloorBanner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import type { Tables } from "@/integrations/supabase/types";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const { toast } = useToast();
  const { setProjectScope } = useChatContext();

  const [project, setProject] = useState<Tables<"projects"> | null>(null);
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
  const [reportSections, setReportSections] = useState<Tables<"report_sections">[]>([]);

  // PRD v2.0 §2.1 — old → new slug redirects
  const TAB_REDIRECTS: Record<string, string> = {
    scorecard: "overview",      // Phase 4 will eliminate; for now route to Overview
    strategy: "investment_thesis",
    performance: "track_record",
  };
  const initialTabRaw = searchParams.get("tab") || "overview";
  const initialTab = TAB_REDIRECTS[initialTabRaw] ?? initialTabRaw;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);

  const isProcessing = project ? ["processing", "pending", "uploading", "analyzing", "extracting"].includes(project.status) : false;

  // URL ↔ tab sync
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (params.get("tab") !== activeTab) {
      params.set("tab", activeTab);
      setSearchParams(params, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  useEffect(() => {
    if (isProcessing && activeTab === "overview") setActiveTab("analysis_log");
  }, [isProcessing]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const ch = supabase
      .channel(`project-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "projects", filter: `id=eq.${id}` }, (payload) => {
        const u = payload.new as Tables<"projects">;
        setProject(u);
        if (u.status === "complete" || u.status === "completed") {
          toast({ title: "Analysis Complete", description: `Analysis complete for ${u.fund_name}` });
          fetchData();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, fetchData, toast]);

  useEffect(() => {
    if (project) setProjectScope({ id: project.id, name: project.fund_name });
    return () => { setProjectScope(null); };
  }, [project?.id, project?.fund_name, setProjectScope]);

  const handleRerunAnalysis = async () => {
    if (!project) return;
    await supabase.from("projects").update({ status: "processing", error_message: null }).eq("id", project.id);
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dispatch-analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      body: JSON.stringify({ project_id: project.id }),
    }).catch((e) => console.error("dispatch error", e));
    toast({ title: "Analysis dispatched" });
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

  // global hard-floor signal
  const hardFloors = submissionQuality.filter((sq) => sq.severity === "hard_floor" || sq.category?.includes("hard_floor"));
  const hardFloorTriggered = hardFloors.some((h: any) => h.status === "fail" || h.status === "flagged");

  // PRD §2.2 — Reg & Ops chip status: derived from hard floor + submission_quality severities
  const regOpsStatus: "pass" | "conditional" | "fail" | null = (() => {
    if (hardFloorTriggered) return "fail";
    const hasElevated = submissionQuality.some((sq: any) => sq.severity === "elevated" || sq.status === "warning" || sq.status === "flagged");
    if (hasElevated) return "conditional";
    if (submissionQuality.length > 0) return "pass";
    return null;
  })();

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <ProjectTopBar project={project} isProcessing={isProcessing} />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <ProjectSidebar
          project={project}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          moduleScoresData={moduleScores}
          redFlagsCount={redFlags.length}
          regOpsStatus={regOpsStatus}
        />

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="lg:hidden">
            <ProjectSidebar
              project={project}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              moduleScoresData={moduleScores}
              redFlagsCount={redFlags.length}
              regOpsStatus={regOpsStatus}
            />
          </div>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 lg:pb-6 space-y-4">
            {/* Global hard-floor banner */}
            {hardFloorTriggered && activeTab !== "regulatory_ops" && activeTab !== "red_flags" && activeTab !== "overview" && (
              <HardFloorBanner triggered />
            )}

            {activeTab === "analysis_log" || (isProcessing && activeTab === "overview") ? (
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
                  />
                )}
                {activeTab === "team" && (
                  <TeamTab
                    teamMembers={teamMembers}
                    serviceProviders={serviceProviders}
                    redFlags={redFlags}
                    interrogatoryItems={interrogatoryItems}
                    gpEntityName={project.gp_entity_name}
                    moduleScoresData={moduleScores}
                  />
                )}
                {activeTab === "track_record" && (
                  <TrackRecordTab
                    metrics={performanceMetrics}
                    fees={feeStructure}
                    engagementCaseStudies={engagementCaseStudies}
                    redFlags={redFlags}
                    interrogatoryItems={interrogatoryItems}
                    moduleScoresData={moduleScores}
                    project={project}
                  />
                )}
                {activeTab === "investment_thesis" && (
                  <InvestmentThesisTab
                    thesisValidations={thesisValidations}
                    marketFactors={marketFactors}
                    competitors={competitors}
                    interrogatoryItems={interrogatoryItems}
                    moduleScoresData={moduleScores}
                    project={project}
                  />
                )}
                {activeTab === "market_reality" && (
                  <MarketRealityTab
                    marketFactors={marketFactors}
                    competitors={competitors}
                    thesisValidations={thesisValidations}
                    interrogatoryItems={interrogatoryItems}
                    moduleScoresData={moduleScores}
                    project={project}
                  />
                )}
                {activeTab === "economics" && (
                  <EconomicsTab
                    fees={feeStructure}
                    redFlags={redFlags}
                    interrogatoryItems={interrogatoryItems}
                    moduleScoresData={moduleScores}
                    project={project}
                  />
                )}
                {activeTab === "regulatory_ops" && (
                  <ScorecardTab project={project} moduleScores={moduleScores} submissionQuality={submissionQuality} />
                )}
                {activeTab === "red_flags" && (
                  <RedFlagsTab
                    redFlags={redFlags}
                    fundName={project.fund_name}
                    submissionQuality={submissionQuality}
                    criticalInfoGaps={criticalInfoGaps}
                  />
                )}
                {activeTab === "interrogatory" && (
                  <InterrogatoryTab items={interrogatoryItems} fundName={project.fund_name} projectId={project.id} />
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
                    submissionQuality={submissionQuality}
                  />
                )}
                {activeTab === "documents" && (
                  <SourceFilesTab researchSources={researchSources} />
                )}
              </>
            )}
          </main>
        </div>

        <InsightsPanel projectName={project.fund_name} isProcessing={isProcessing} />
      </div>

      <MobileBottomNav />
    </div>
  );
}
