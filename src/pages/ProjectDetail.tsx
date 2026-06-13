import { NvestivLoader, useNvestivLoaderGate } from "@/components/ui/NvestivLoader";
import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useChatContext } from "@/contexts/ChatContext";
import { ShareModal } from "@/components/project/ShareModal";
import { ProjectSidebar } from "@/components/project/ProjectSidebar";
import { CommentsRail } from "@/components/project/CommentsRail";
import { OverviewTab } from "@/components/project/OverviewTab";
import { RedFlagsTab } from "@/components/project/RedFlagsTab";
import { InterrogatoryTab } from "@/components/project/InterrogatoryTab";
import { DataRoomTab } from "@/components/project/DataRoomTab";
import { SourceFilesTab } from "@/components/project/SourceFilesTab";
import { TeamTab } from "@/components/project/TeamTab";
import { TrackRecordTab } from "@/components/project/TrackRecordTab";
import { InvestmentThesisTab } from "@/components/project/InvestmentThesisTab";
import { MarketRealityTab } from "@/components/project/MarketRealityTab";
import { EconomicsTab } from "@/components/project/EconomicsTab";
import { RegulatoryOpsTab } from "@/components/project/RegulatoryOpsTab";
import { ProcessingState } from "@/components/project/ProcessingState";
import { BlurFade } from "@/components/magicui/BlurFade";
import { ShimmerButton } from "@/components/magicui/ShimmerButton";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ProjectTopBar } from "@/components/project/ProjectTopBar";
import { MeetingModeProvider } from "@/contexts/MeetingModeContext";
import { CitationsProvider } from "@/contexts/CitationsContext";
import { PinnedCitationsStack } from "@/components/project/typed/PinnedCitationsStack";
import { SectionProvider } from "@/contexts/SectionContext";
import { HardFloorBanner } from "@/components/project/primitives/HardFloorBanner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useUiVariant } from "@/contexts/UiVariantContext";
import { OddWorkspace } from "@/components/odd/OddWorkspace";
import { L1OnePager } from "@/components/project/l1/L1OnePager";
import type { L1PageKey } from "@/components/project/l1/L1OnePager";
import { payloadFor } from "@/mocks/renderPayloads";
import { ProjectStageRail } from "@/components/project/ProjectStageRail";
import { L1SectionBookmarks } from "@/components/project/L1SectionBookmarks";
import { useReportZoom } from "@/hooks/use-report-zoom";

import type { Tables } from "@/integrations/supabase/types";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { toast } = useToast();
  const { setProjectScope, setIsOpen: setChatOpen, chatExpanded, isOpen: chatIsOpen } = useChatContext();
  const sidebarCollapsed = chatIsOpen && chatExpanded;
  const { variant } = useUiVariant();

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
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);

  // PRD v2.0 §2.1 — old → new slug redirects
  const TAB_REDIRECTS: Record<string, string> = {
    scorecard: "overview",      // Phase 4 will eliminate; for now route to Overview
    strategy: "investment_thesis",
    performance: "track_record",
  };
  const initialTabRaw = searchParams.get("tab") || "overview";
  const stageParam = searchParams.get("stage");
  // ADIA variant defaults to ODD; General must opt in via ?stage=odd. Both variants can access ODD.
  const isOddStage =
    stageParam === "odd" || (variant === "adia" && !stageParam && !searchParams.get("tab"));
  const initialTab = TAB_REDIRECTS[initialTabRaw] ?? initialTabRaw;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const oddZoom = useReportZoom();

  const isProcessing = project ? ["processing", "pending", "uploading", "analyzing", "extracting"].includes(project.status) : false;

  // URL ↔ tab sync
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (params.get("tab") !== activeTab) {
      params.set("tab", activeTab);
      setSearchParams(params, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  // URL → state sync: when something else (e.g. citation chips) updates ?tab=,
  // reflect that into local state so the page actually switches.
  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(TAB_REDIRECTS[urlTab] ?? urlTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

  // Live unread/total comment count for the top-bar badge
  useEffect(() => {
    if (!id) return;
    const loadCount = async () => {
      const { count } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("project_id", id)
        .is("resolved_at", null);
      setCommentsCount(count ?? 0);
    };
    loadCount();
    const ch = supabase
      .channel(`comments-count-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `project_id=eq.${id}` },
        loadCount,
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

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

  const showLoader = useNvestivLoaderGate(loading);
  if (showLoader || !project) {
    return (
      <div className="flex flex-col h-screen bg-background overflow-hidden">
        <ProjectTopBar project={null} isProcessing={false} />
        <div className="flex-1 flex items-center justify-center">
          {showLoader ? (
            <NvestivLoader size={140} />
          ) : (
            <p className="text-muted-foreground">Project not found</p>
          )}
        </div>
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

  const L1_PAGE_KEYS: L1PageKey[] = ["summary", "analysis", "agenda"];
  const l1Page: L1PageKey = (L1_PAGE_KEYS as string[]).includes(activeTab)
    ? (activeTab as L1PageKey)
    : "summary";

  return (
    <MeetingModeProvider dealId={project.id}>
    <CitationsProvider projectId={project.id} initialSources={researchSources}>
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <ProjectTopBar
        project={project}
        isProcessing={isProcessing}
        reportLevel={isOddStage ? "ODD" : "L1"}
        onReportLevelChange={(lvl) => {
          if (lvl === "L3") navigate(`/project/${project.id}/memo`);
          else if (lvl === "ODD") {
            const p = new URLSearchParams(searchParams);
            p.set("stage", "odd");
            p.delete("tab");
            setSearchParams(p, { replace: true });
          } else if (lvl === "L1") {
            const p = new URLSearchParams(searchParams);
            p.delete("stage");
            if (!p.get("tab")) p.set("tab", "overview");
            setSearchParams(p, { replace: true });
          }
          // L1 is current; L2 is locked (no-op)
        }}
        onOpenComments={() => setCommentsOpen(true)}
        commentsCount={commentsCount}
        onReimport={
          isOddStage
            ? () => window.dispatchEvent(new CustomEvent("odd:open-import"))
            : undefined
        }
        exportCurrentScope={isOddStage ? "odd" : "triage"}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <ProjectStageRail
          reportLevel={isOddStage ? "ODD" : "L1"}
          bookmarks={
            !isOddStage && !isProcessing && project.status !== "error" ? (
              <L1SectionBookmarks
                page={l1Page}
                onPageChange={(p) => setActiveTab(p)}
              />
            ) : undefined
          }
          onReportLevelChange={(lvl) => {
            if (lvl === "L3") navigate(`/project/${project.id}/memo`);
            else if (lvl === "ODD") {
              const p = new URLSearchParams(searchParams);
              p.set("stage", "odd");
              p.delete("tab");
              setSearchParams(p, { replace: true });
            } else if (lvl === "L1") {
              const p = new URLSearchParams(searchParams);
              p.delete("stage");
              if (!p.get("tab")) p.set("tab", "summary");
              setSearchParams(p, { replace: true });
            }
          }}
        />
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {isOddStage ? (
            <OddWorkspace project={project} zoomCtl={oddZoom} />
          ) : isProcessing ? (
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              <ProcessingState startedAt={project.updated_at} projectId={project.id} />
            </main>
          ) : project.status === "error" ? (
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              <BlurFade>
                <div className="flex flex-col items-center justify-center py-20">
                  <p className="text-severity-critical font-semibold text-lg mb-2">Analysis Error</p>
                  <p className="text-sm text-muted-foreground mb-4 text-center px-4">
                    {project.error_message || "An unexpected error occurred."}
                  </p>
                  <ShimmerButton onClick={handleRerunAnalysis}>Retry Analysis</ShimmerButton>
                </div>
              </BlurFade>
            </main>
          ) : (
            <SectionProvider projectId={project.id} sectionId={l1Page}>
              <div className="flex flex-1 min-h-0 overflow-hidden">
                <L1OnePager payload={payloadFor(project.id, project.fund_name)} page={l1Page} />
              </div>
            </SectionProvider>
          )}
        </div>
      </div>

      {/* Legacy sidebar+tabs layout (disabled — kept for reference, never rendered) */}
      {false && (
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="hidden lg:contents">
          <ProjectSidebar
            project={project}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            moduleScoresData={moduleScores}
            redFlagsCount={redFlags.length}
            regOpsStatus={regOpsStatus}
            collapsed={sidebarCollapsed}
          />
        </div>

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
              <SectionProvider projectId={project.id} sectionId={activeTab}>
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
                    fees={feeStructure}
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
                    redFlags={redFlags}
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
                  <RegulatoryOpsTab
                    project={project}
                    moduleScoresData={moduleScores}
                    submissionQuality={submissionQuality}
                    serviceProviders={serviceProviders}
                    interrogatoryItems={interrogatoryItems}
                    redFlags={redFlags}
                  />
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
                    interrogatoryItems={interrogatoryItems}
                  />
                )}
                {activeTab === "documents" && (
                  <SourceFilesTab researchSources={researchSources} />
                )}
              </SectionProvider>
            )}
          </main>
        </div>

      </div>
      )}

      <MobileBottomNav
        onOpenComments={() => setCommentsOpen(true)}
        commentsCount={commentsCount}
        onOpenShare={() => setShareOpen(true)}
        onOpenAskIris={() => setChatOpen(true)}
      />
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        fundName={project.fund_name}
        projectId={project.id}
      />
      <PinnedCitationsStack />

      {/* Slide-in comments drawer (opens from the top-bar Comments button) */}
      <Sheet open={commentsOpen} onOpenChange={setCommentsOpen}>
        <SheetContent
          side="right"
          className="p-0 w-full sm:max-w-[33vw] sm:w-[33vw]"
        >
          <CommentsRail
            projectId={project.id}
            projectName={project.fund_name}
            activeSection={activeTab}
            isProcessing={isProcessing}
          />
        </SheetContent>
      </Sheet>
    </div>
    </CitationsProvider>
    </MeetingModeProvider>
  );
}
