import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ─── OpenAI Embeddings (text-embedding-3-small, $0.02/1M tokens) ───
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const allEmbeddings: number[][] = [];
  const batchSize = 100;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const resp = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: batch,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`OpenAI embedding error: ${resp.status} ${err}`);
    }

    const data = await resp.json();
    allEmbeddings.push(...data.data.map((d: any) => d.embedding));
  }

  return allEmbeddings;
}

// ─── Node & Edge Types ───
type GraphNode = {
  id?: string;
  project_id: string;
  node_type: string;
  label: string;
  summary: string;
  properties: Record<string, any>;
  parent_node_id?: string | null;
  depth_level: number;
  source_table: string;
  source_id?: string;
  embedding?: number[];
  _temp_key?: string; // for edge resolution
};

type GraphEdge = {
  source_key: string; // temp key for resolution
  target_key: string;
  relationship_type: string;
  properties?: Record<string, any>;
  weight?: number;
};

// ─── Build the hierarchical knowledge graph for a project ───
async function buildProjectGraph(projectId: string) {
  console.log(`Building knowledge graph for project ${projectId}`);

  // Fetch all project data in parallel
  const [
    { data: project },
    { data: moduleScores },
    { data: redFlags },
    { data: teamMembers },
    { data: feeStructure },
    { data: performanceMetrics },
    { data: interrogatoryItems },
    { data: dataRoomItems },
    { data: thesisValidations },
    { data: competitiveLandscape },
    { data: marketFactors },
    { data: serviceProviders },
    { data: submissionQuality },
    { data: criticalInfoGaps },
    { data: researchSources },
    { data: engagementCaseStudies },
    { data: reportSections },
    { data: documents },
  ] = await Promise.all([
    supabase.from("projects").select("*").eq("id", projectId).single(),
    supabase.from("module_scores").select("*").eq("project_id", projectId).order("order_index"),
    supabase.from("red_flags").select("*").eq("project_id", projectId).order("order_index"),
    supabase.from("team_members").select("*").eq("project_id", projectId).order("order_index"),
    supabase.from("fee_structure").select("*").eq("project_id", projectId).order("order_index"),
    supabase.from("performance_metrics").select("*").eq("project_id", projectId).order("order_index"),
    supabase.from("interrogatory_items").select("*").eq("project_id", projectId).order("order_index"),
    supabase.from("data_room_items").select("*").eq("project_id", projectId).order("order_index"),
    supabase.from("thesis_validations").select("*").eq("project_id", projectId).order("order_index"),
    supabase.from("competitive_landscape").select("*").eq("project_id", projectId).order("order_index"),
    supabase.from("market_factors").select("*").eq("project_id", projectId).order("order_index"),
    supabase.from("service_providers").select("*").eq("project_id", projectId),
    supabase.from("submission_quality").select("*").eq("project_id", projectId).order("order_index"),
    supabase.from("critical_info_gaps").select("*").eq("project_id", projectId).order("order_index"),
    supabase.from("research_sources").select("*").eq("project_id", projectId),
    supabase.from("engagement_case_studies").select("*").eq("project_id", projectId).order("order_index"),
    supabase.from("report_sections").select("*").eq("project_id", projectId).order("order_index"),
    supabase.from("documents").select("*").eq("project_id", projectId),
  ]);

  if (!project) throw new Error(`Project ${projectId} not found`);

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // ════════════════════════════════════════
  // LEVEL 0: Fund/Project Root Node
  // ════════════════════════════════════════
  const fundKey = `fund:${projectId}`;
  nodes.push({
    project_id: projectId,
    node_type: "fund",
    label: project.fund_name,
    summary: [
      `${project.fund_name} is a ${project.asset_class || "alternative"} investment fund`,
      project.gp_entity_name ? `managed by ${project.gp_entity_name}` : "",
      project.strategy ? `with a ${project.strategy} strategy` : "",
      project.composite_score ? `Composite due diligence score: ${project.composite_score}/100 (${project.score_tier || "unrated"})` : "",
      project.recommendation ? `Recommendation: ${project.recommendation}` : "",
      project.fund_size_estimated ? `Estimated fund size: ${project.fund_size_estimated}` : "",
      project.domicile ? `Domiciled in ${project.domicile}` : "",
      project.vintage ? `Vintage: ${project.vintage}` : "",
      project.executive_summary_narrative || "",
    ].filter(Boolean).join(". "),
    properties: {
      composite_score: project.composite_score,
      recommendation: project.recommendation,
      score_tier: project.score_tier,
      asset_class: project.asset_class,
      strategy: project.strategy,
      gp_entity_name: project.gp_entity_name,
      fund_size: project.fund_size_estimated,
      domicile: project.domicile,
      vintage: project.vintage,
      status: project.status,
    },
    depth_level: 0,
    source_table: "projects",
    source_id: projectId,
    _temp_key: fundKey,
  });

  // ════════════════════════════════════════
  // LEVEL 1: Domain Nodes
  // ════════════════════════════════════════
  const domains = [
    { key: "domain:team_ops", label: "Team & Operations", type: "domain", tables: ["team_members", "service_providers"] },
    { key: "domain:performance", label: "Performance & Fees", type: "domain", tables: ["performance_metrics", "fee_structure"] },
    { key: "domain:strategy", label: "Strategy & Market", type: "domain", tables: ["thesis_validations", "competitive_landscape", "market_factors", "engagement_case_studies"] },
    { key: "domain:risk_profile", label: "Risk Profile", type: "domain", tables: ["red_flags", "critical_info_gaps", "submission_quality"] },
    { key: "domain:diligence", label: "Diligence Process", type: "domain", tables: ["interrogatory_items", "data_room_items"] },
    { key: "domain:documents", label: "Document Corpus", type: "domain", tables: ["documents", "research_sources"] },
  ];

  for (const domain of domains) {
    // Build domain summary from module scores
    const relatedModules = (moduleScores || []).filter((ms: any) => {
      const moduleMap: Record<string, string[]> = {
        "domain:team_ops": ["module_b"],
        "domain:performance": ["module_c"],
        "domain:strategy": ["module_a"],
        "domain:risk_profile": ["module_d", "module_e"],
        "domain:diligence": [],
        "domain:documents": [],
      };
      return moduleMap[domain.key]?.includes(ms.module_key);
    });

    const scoreSummary = relatedModules.map((ms: any) =>
      `${ms.module_label}: ${ms.score}/100 (${ms.confidence || "unknown"} confidence). ${ms.summary_assessment || ""}`
    ).join(" ");

    nodes.push({
      project_id: projectId,
      node_type: "domain",
      label: `${project.fund_name} — ${domain.label}`,
      summary: `${domain.label} analysis for ${project.fund_name}. ${scoreSummary}`.trim(),
      properties: {
        domain_key: domain.key,
        related_tables: domain.tables,
        module_scores: relatedModules.map((ms: any) => ({ key: ms.module_key, score: ms.score, confidence: ms.confidence })),
      },
      depth_level: 1,
      source_table: "module_scores",
      _temp_key: domain.key,
    });

    edges.push({
      source_key: fundKey,
      target_key: domain.key,
      relationship_type: "has_domain",
      weight: 1.0,
    });
  }

  // ════════════════════════════════════════
  // LEVEL 2: Entity Nodes
  // ════════════════════════════════════════

  // ── Team Members ──
  for (const tm of teamMembers || []) {
    const tmKey = `person:${tm.id}`;
    const affiliations = (tm.prior_affiliations as string[] || []).join(", ");
    nodes.push({
      project_id: projectId,
      node_type: "person",
      label: tm.name,
      summary: [
        `${tm.name}${tm.title ? `, ${tm.title}` : ""} at ${project.fund_name}`,
        tm.is_key_person ? "Key person for the fund" : "",
        tm.years_experience ? `${tm.years_experience} years of experience` : "",
        tm.education ? `Education: ${tm.education}` : "",
        affiliations ? `Prior affiliations: ${affiliations}` : "",
        `Verification: ${tm.verification_status}${tm.verification_detail ? ` — ${tm.verification_detail}` : ""}`,
        tm.adverse_findings ? `Adverse findings (${tm.adverse_finding_severity}): ${tm.adverse_findings}` : "No adverse findings",
        tm.assessment_rating ? `Assessment: ${tm.assessment_rating}` : "",
      ].filter(Boolean).join(". "),
      properties: {
        title: tm.title,
        is_key_person: tm.is_key_person,
        years_experience: tm.years_experience,
        verification_status: tm.verification_status,
        assessment_rating: tm.assessment_rating,
        adverse_finding_severity: tm.adverse_finding_severity,
        role_category: tm.role_category,
      },
      depth_level: 2,
      source_table: "team_members",
      source_id: tm.id,
      _temp_key: tmKey,
    });

    edges.push(
      { source_key: "domain:team_ops", target_key: tmKey, relationship_type: "contains_member", weight: tm.is_key_person ? 1.0 : 0.7 },
      { source_key: tmKey, target_key: fundKey, relationship_type: "manages", weight: tm.is_key_person ? 1.0 : 0.5 },
    );

    // Cross-link to prior affiliations as company nodes
    for (const aff of (tm.prior_affiliations as string[] || [])) {
      const affKey = `company:${aff.toLowerCase().replace(/\s+/g, "_")}`;
      // Check if company node already exists
      if (!nodes.find(n => n._temp_key === affKey)) {
        nodes.push({
          project_id: projectId,
          node_type: "company",
          label: aff,
          summary: `${aff} — prior employer/affiliation of ${tm.name} who is ${tm.title || "team member"} at ${project.fund_name}.`,
          properties: { relationship: "prior_affiliation" },
          depth_level: 3,
          source_table: "team_members",
          source_id: tm.id,
          _temp_key: affKey,
        });
      }
      edges.push({ source_key: tmKey, target_key: affKey, relationship_type: "previously_at", weight: 0.6 });
    }
  }

  // ── Red Flags ──
  for (const rf of redFlags || []) {
    const rfKey = `risk:${rf.id}`;
    nodes.push({
      project_id: projectId,
      node_type: "risk",
      label: rf.title,
      summary: [
        `${rf.severity.toUpperCase()} risk: ${rf.title}`,
        rf.description || rf.issue || "",
        rf.implication ? `Implication: ${rf.implication}` : "",
        rf.resolution ? `Required resolution: ${rf.resolution}` : "",
        rf.timeline ? `Timeline: ${rf.timeline}` : "",
        rf.module ? `Source module: ${rf.module}` : "",
        rf.confidence ? `Confidence: ${rf.confidence}` : "",
      ].filter(Boolean).join(". "),
      properties: {
        severity: rf.severity,
        module: rf.module,
        confidence: rf.confidence,
        flag_number: rf.flag_number,
        has_interrogatory: !!rf.interrogatory_question,
        has_data_room_action: !!rf.data_room_action,
      },
      depth_level: 2,
      source_table: "red_flags",
      source_id: rf.id,
      _temp_key: rfKey,
    });

    edges.push(
      { source_key: "domain:risk_profile", target_key: rfKey, relationship_type: "contains_risk", weight: rf.severity === "critical" ? 1.0 : rf.severity === "elevated" ? 0.8 : 0.5 },
      { source_key: rfKey, target_key: fundKey, relationship_type: "flagged_in", weight: 0.9 },
    );
  }

  // ── Fee Structure ──
  for (const fee of feeStructure || []) {
    const feeKey = `fee:${fee.id}`;
    nodes.push({
      project_id: projectId,
      node_type: "fee",
      label: `${fee.component} (${fee.share_class})`,
      summary: [
        `Fee component: ${fee.component} for ${fee.share_class} share class`,
        `Value: ${fee.value}`,
        fee.asset_class_norm ? `Asset class norm: ${fee.asset_class_norm}` : "",
        fee.assessment ? `Assessment: ${fee.assessment}` : "",
        fee.assessment_detail || "",
        fee.is_disclosed ? "Disclosed" : "Not disclosed — transparency concern",
      ].filter(Boolean).join(". "),
      properties: {
        component: fee.component,
        value: fee.value,
        share_class: fee.share_class,
        is_disclosed: fee.is_disclosed,
        assessment: fee.assessment,
      },
      depth_level: 2,
      source_table: "fee_structure",
      source_id: fee.id,
      _temp_key: feeKey,
    });

    edges.push({ source_key: "domain:performance", target_key: feeKey, relationship_type: "contains_fee", weight: 0.7 });
  }

  // ── Performance Metrics ──
  for (const pm of performanceMetrics || []) {
    const pmKey = `metric:${pm.id}`;
    nodes.push({
      project_id: projectId,
      node_type: "metric",
      label: `${pm.metric_name} — ${pm.fund_name}`,
      summary: [
        `Performance metric: ${pm.metric_name} (${pm.metric_category})`,
        `Value: ${pm.value}`,
        pm.benchmark_name ? `Benchmark (${pm.benchmark_name}): ${pm.benchmark_value || "N/A"}` : "",
        pm.alpha ? `Alpha: ${pm.alpha}` : "",
        pm.as_of_date ? `As of: ${pm.as_of_date}` : "",
      ].filter(Boolean).join(". "),
      properties: {
        metric_name: pm.metric_name,
        metric_category: pm.metric_category,
        value: pm.value,
        value_numeric: pm.value_numeric,
        benchmark_name: pm.benchmark_name,
        benchmark_value: pm.benchmark_value,
        alpha: pm.alpha,
      },
      depth_level: 2,
      source_table: "performance_metrics",
      source_id: pm.id,
      _temp_key: pmKey,
    });

    edges.push({ source_key: "domain:performance", target_key: pmKey, relationship_type: "contains_metric", weight: 0.7 });
  }

  // ── Thesis Validations ──
  for (const tv of thesisValidations || []) {
    const tvKey = `thesis:${tv.id}`;
    nodes.push({
      project_id: projectId,
      node_type: "thesis",
      label: tv.claim.length > 80 ? tv.claim.slice(0, 77) + "..." : tv.claim,
      summary: [
        `Investment thesis claim: "${tv.claim}"`,
        tv.claim_source ? `Source: ${tv.claim_source}` : "",
        `Validation status: ${tv.validation_status} (${tv.confidence} confidence)`,
        tv.validation_detail || "",
      ].filter(Boolean).join(". "),
      properties: {
        validation_status: tv.validation_status,
        confidence: tv.confidence,
        claim_source: tv.claim_source,
      },
      depth_level: 2,
      source_table: "thesis_validations",
      source_id: tv.id,
      _temp_key: tvKey,
    });

    edges.push({ source_key: "domain:strategy", target_key: tvKey, relationship_type: "contains_thesis", weight: 0.8 });
  }

  // ── Competitive Landscape ──
  for (const comp of competitiveLandscape || []) {
    const compKey = `competitor:${comp.id}`;
    nodes.push({
      project_id: projectId,
      node_type: "competitor",
      label: comp.competitor_name,
      summary: [
        `Competitor: ${comp.competitor_name} (${comp.competitor_type})`,
        comp.aum ? `AUM: ${comp.aum}` : "",
        comp.strategy_description || "",
        comp.differentiation_vs_fund ? `Differentiation vs ${project.fund_name}: ${comp.differentiation_vs_fund}` : "",
        comp.competitive_assessment || "",
      ].filter(Boolean).join(". "),
      properties: {
        competitor_type: comp.competitor_type,
        aum: comp.aum,
      },
      depth_level: 2,
      source_table: "competitive_landscape",
      source_id: comp.id,
      _temp_key: compKey,
    });

    edges.push(
      { source_key: "domain:strategy", target_key: compKey, relationship_type: "contains_competitor", weight: 0.7 },
      { source_key: compKey, target_key: fundKey, relationship_type: "competes_with", weight: 0.8 },
    );
  }

  // ── Market Factors ──
  for (const mf of marketFactors || []) {
    const mfKey = `market_factor:${mf.id}`;
    nodes.push({
      project_id: projectId,
      node_type: "market_factor",
      label: mf.title,
      summary: [
        `${mf.factor_type} market factor: ${mf.title}`,
        mf.description,
        mf.supporting_data ? `Supporting data: ${mf.supporting_data}` : "",
        `Confidence: ${mf.confidence}`,
        mf.time_horizon ? `Time horizon: ${mf.time_horizon}` : "",
      ].filter(Boolean).join(". "),
      properties: {
        factor_type: mf.factor_type,
        confidence: mf.confidence,
        time_horizon: mf.time_horizon,
      },
      depth_level: 2,
      source_table: "market_factors",
      source_id: mf.id,
      _temp_key: mfKey,
    });

    edges.push({ source_key: "domain:strategy", target_key: mfKey, relationship_type: "influenced_by", weight: 0.7 });
  }

  // ── Service Providers ──
  for (const sp of serviceProviders || []) {
    const spKey = `service_provider:${sp.id}`;
    nodes.push({
      project_id: projectId,
      node_type: "service_provider",
      label: sp.provider_name || sp.provider_type,
      summary: [
        `Service provider: ${sp.provider_name || "Undisclosed"} (${sp.provider_type})`,
        `Importance: ${sp.importance}`,
        sp.is_disclosed ? "Disclosed" : "NOT DISCLOSED — transparency gap",
        sp.is_verified ? `Verified: ${sp.verification_detail || "yes"}` : "Not verified",
        sp.notes || "",
      ].filter(Boolean).join(". "),
      properties: {
        provider_type: sp.provider_type,
        importance: sp.importance,
        is_disclosed: sp.is_disclosed,
        is_verified: sp.is_verified,
      },
      depth_level: 2,
      source_table: "service_providers",
      source_id: sp.id,
      _temp_key: spKey,
    });

    edges.push(
      { source_key: "domain:team_ops", target_key: spKey, relationship_type: "uses_provider", weight: sp.importance === "critical" ? 1.0 : 0.6 },
      { source_key: spKey, target_key: fundKey, relationship_type: "provides_service_to", weight: 0.7 },
    );
  }

  // ── Interrogatory Items ──
  for (const ii of interrogatoryItems || []) {
    const iiKey = `question:${ii.id}`;
    nodes.push({
      project_id: projectId,
      node_type: "question",
      label: ii.question.length > 80 ? ii.question.slice(0, 77) + "..." : ii.question,
      summary: [
        `Diligence question (${ii.priority} priority): ${ii.question}`,
        ii.rationale ? `Rationale: ${ii.rationale}` : "",
        `Status: ${ii.status}`,
        ii.source_module_label ? `Source: ${ii.source_module_label}` : "",
        ii.gp_response_notes ? `GP response: ${ii.gp_response_notes}` : "Awaiting GP response",
      ].filter(Boolean).join(". "),
      properties: {
        priority: ii.priority,
        status: ii.status,
        source_module: ii.source_module,
        has_response: !!ii.gp_response_notes,
        gp_response_score: ii.gp_response_score,
      },
      depth_level: 2,
      source_table: "interrogatory_items",
      source_id: ii.id,
      _temp_key: iiKey,
    });

    edges.push({ source_key: "domain:diligence", target_key: iiKey, relationship_type: "contains_question", weight: ii.priority === "critical" ? 1.0 : 0.6 });

    // Link to related red flags
    for (const rfId of (ii.related_red_flag_ids as string[] || [])) {
      edges.push({ source_key: iiKey, target_key: `risk:${rfId}`, relationship_type: "addresses_risk", weight: 0.9 });
    }
  }

  // ── Data Room Items ──
  for (const dr of dataRoomItems || []) {
    const drKey = `data_room:${dr.id}`;
    nodes.push({
      project_id: projectId,
      node_type: "data_room_item",
      label: dr.document_name,
      summary: [
        `Data room document: ${dr.document_name}`,
        `Priority: ${dr.priority_label || dr.priority}`,
        dr.is_received ? `Received${dr.received_date ? ` on ${dr.received_date}` : ""}` : "NOT YET RECEIVED",
        dr.is_reviewed ? "Reviewed" : "Pending review",
        dr.purpose || "",
        dr.reviewer_notes ? `Notes: ${dr.reviewer_notes}` : "",
      ].filter(Boolean).join(". "),
      properties: {
        priority: dr.priority,
        is_received: dr.is_received,
        is_reviewed: dr.is_reviewed,
        module: dr.module,
      },
      depth_level: 2,
      source_table: "data_room_items",
      source_id: dr.id,
      _temp_key: drKey,
    });

    edges.push({ source_key: "domain:diligence", target_key: drKey, relationship_type: "requires_document", weight: 0.6 });
  }

  // ── Critical Info Gaps ──
  for (const gap of criticalInfoGaps || []) {
    const gapKey = `gap:${gap.id}`;
    nodes.push({
      project_id: projectId,
      node_type: "info_gap",
      label: gap.gap_title,
      summary: [
        `Critical information gap (${gap.severity}): ${gap.gap_title}`,
        gap.gap_description,
        gap.related_module ? `Related module: ${gap.related_module}` : "",
      ].filter(Boolean).join(". "),
      properties: { severity: gap.severity, related_module: gap.related_module },
      depth_level: 2,
      source_table: "critical_info_gaps",
      source_id: gap.id,
      _temp_key: gapKey,
    });

    edges.push({ source_key: "domain:risk_profile", target_key: gapKey, relationship_type: "has_info_gap", weight: 0.8 });
  }

  // ── Engagement Case Studies ──
  for (const ec of engagementCaseStudies || []) {
    const ecKey = `case_study:${ec.id}`;
    nodes.push({
      project_id: projectId,
      node_type: "case_study",
      label: ec.company_name,
      summary: [
        `Portfolio engagement: ${ec.company_name}`,
        ec.sector ? `Sector: ${ec.sector}` : "",
        ec.investment_thesis || "",
        ec.outcome_status ? `Outcome: ${ec.outcome_status}` : "",
        ec.market_validation || "",
        ec.assessment_rating ? `Assessment: ${ec.assessment_rating}` : "",
        ec.assessment_detail || "",
      ].filter(Boolean).join(". "),
      properties: {
        sector: ec.sector,
        outcome_status: ec.outcome_status,
        assessment_rating: ec.assessment_rating,
      },
      depth_level: 2,
      source_table: "engagement_case_studies",
      source_id: ec.id,
      _temp_key: ecKey,
    });

    edges.push({ source_key: "domain:strategy", target_key: ecKey, relationship_type: "invested_in", weight: 0.8 });
  }

  // ── Research Sources ──
  for (const rs of researchSources || []) {
    const rsKey = `source:${rs.id}`;
    nodes.push({
      project_id: projectId,
      node_type: "source",
      label: rs.title,
      summary: [
        `Research source: ${rs.title}`,
        rs.source_type ? `Type: ${rs.source_type}` : "",
        rs.source_category ? `Category: ${rs.source_category}` : "",
        rs.description || "",
        rs.excerpt ? `Excerpt: ${rs.excerpt.slice(0, 200)}` : "",
        rs.is_primary ? "Primary source" : "Secondary source",
        rs.url ? `URL: ${rs.url}` : "",
      ].filter(Boolean).join(". "),
      properties: {
        source_type: rs.source_type,
        source_category: rs.source_category,
        is_primary: rs.is_primary,
        url: rs.url,
      },
      depth_level: 2,
      source_table: "research_sources",
      source_id: rs.id,
      _temp_key: rsKey,
    });

    edges.push({ source_key: "domain:documents", target_key: rsKey, relationship_type: "references", weight: rs.is_primary ? 1.0 : 0.5 });

    // Link to team members mentioned
    for (const tmName of (rs.linked_team_member_names as string[] || [])) {
      const matchingTm = (teamMembers || []).find((t: any) => t.name === tmName);
      if (matchingTm) {
        edges.push({ source_key: rsKey, target_key: `person:${matchingTm.id}`, relationship_type: "references_person", weight: 0.7 });
      }
    }
  }

  // ── Documents ──
  for (const doc of documents || []) {
    const docKey = `document:${doc.id}`;
    nodes.push({
      project_id: projectId,
      node_type: "document",
      label: doc.file_name,
      summary: [
        `Uploaded document: ${doc.file_name}`,
        doc.document_type_classified ? `Classified as: ${doc.document_type_classified} (${doc.classification_confidence || "unknown"} confidence)` : "",
        doc.page_count ? `${doc.page_count} pages` : "",
        doc.file_type ? `Format: ${doc.file_type}` : "",
        doc.quality_notes || "",
        doc.document_date ? `Document date: ${doc.document_date}` : "",
      ].filter(Boolean).join(". "),
      properties: {
        file_type: doc.file_type,
        document_type: doc.document_type_classified,
        page_count: doc.page_count,
        file_size: doc.file_size,
      },
      depth_level: 2,
      source_table: "documents",
      source_id: doc.id,
      _temp_key: docKey,
    });

    edges.push({ source_key: "domain:documents", target_key: docKey, relationship_type: "contains_document", weight: 0.7 });
  }

  // ── Report Section Nodes (Level 1.5 — between domain and entity) ──
  for (const rs of reportSections || []) {
    if (!rs.content || rs.content.length < 50) continue;
    const rsKey = `section:${rs.id}`;
    nodes.push({
      project_id: projectId,
      node_type: "report_section",
      label: rs.section_title || rs.section_key,
      summary: rs.content.slice(0, 1500), // Cap at 1500 chars for embedding
      properties: {
        section_key: rs.section_key,
        module_key: rs.module_key,
        score: rs.score,
        confidence: rs.confidence,
      },
      depth_level: 1,
      source_table: "report_sections",
      source_id: rs.id,
      _temp_key: rsKey,
    });

    edges.push({ source_key: fundKey, target_key: rsKey, relationship_type: "has_section", weight: 0.8 });
  }

  // ── Submission Quality ──
  for (const sq of submissionQuality || []) {
    const sqKey = `quality:${sq.id}`;
    nodes.push({
      project_id: projectId,
      node_type: "quality_check",
      label: sq.category_label,
      summary: [
        `Submission quality check: ${sq.category_label}`,
        `Status: ${sq.status}`,
        `Severity: ${sq.severity}`,
        `Confidence: ${sq.confidence}`,
      ].filter(Boolean).join(". "),
      properties: {
        category: sq.category,
        status: sq.status,
        severity: sq.severity,
        confidence: sq.confidence,
      },
      depth_level: 2,
      source_table: "submission_quality",
      source_id: sq.id,
      _temp_key: sqKey,
    });

    edges.push({ source_key: "domain:risk_profile", target_key: sqKey, relationship_type: "quality_assessment", weight: 0.5 });
  }

  console.log(`Built ${nodes.length} nodes and ${edges.length} edges. Generating embeddings...`);

  // ════════════════════════════════════════
  // GENERATE EMBEDDINGS
  // ════════════════════════════════════════
  const summaries = nodes.map((n) => n.summary);
  const embeddings = await generateEmbeddings(summaries);
  nodes.forEach((n, i) => {
    n.embedding = embeddings[i];
  });

  console.log(`Embeddings generated. Persisting to database...`);

  // ════════════════════════════════════════
  // PERSIST: Delete old graph, insert new
  // ════════════════════════════════════════
  // Delete edges first (FK constraint), then nodes
  await supabase.from("knowledge_edges").delete().in(
    "source_node_id",
    (await supabase.from("knowledge_nodes").select("id").eq("project_id", projectId)).data?.map((n: any) => n.id) || []
  );
  await supabase.from("knowledge_nodes").delete().eq("project_id", projectId);

  // Insert nodes in batches, building key→id map
  const keyToId: Record<string, string> = {};
  const batchSize = 50;

  for (let i = 0; i < nodes.length; i += batchSize) {
    const batch = nodes.slice(i, i + batchSize).map((n) => {
      const { _temp_key, embedding, ...rest } = n;
      return {
        ...rest,
        embedding: embedding ? `[${embedding.join(",")}]` : null,
      };
    });

    const { data: inserted, error } = await supabase
      .from("knowledge_nodes")
      .insert(batch)
      .select("id");

    if (error) {
      console.error("Node insert error:", error);
      throw new Error(`Failed to insert nodes: ${error.message}`);
    }

    // Map keys to IDs
    for (let j = 0; j < (inserted || []).length; j++) {
      const node = nodes[i + j];
      if (node._temp_key) {
        keyToId[node._temp_key] = inserted![j].id;
      }
    }
  }

  // Now set parent_node_id for child nodes
  const parentUpdates: { id: string; parent_node_id: string }[] = [];
  for (const node of nodes) {
    if (node.depth_level === 1 && node._temp_key) {
      // Domain nodes → parent is fund
      const nodeId = keyToId[node._temp_key];
      const parentId = keyToId[fundKey];
      if (nodeId && parentId) parentUpdates.push({ id: nodeId, parent_node_id: parentId });
    } else if (node.depth_level >= 2 && node._temp_key) {
      // Find which domain this entity belongs to via edges
      const parentEdge = edges.find(
        (e) => e.target_key === node._temp_key && e.source_key.startsWith("domain:")
      );
      if (parentEdge) {
        const nodeId = keyToId[node._temp_key];
        const parentId = keyToId[parentEdge.source_key];
        if (nodeId && parentId) parentUpdates.push({ id: nodeId, parent_node_id: parentId });
      }
    }
  }

  for (const update of parentUpdates) {
    await supabase.from("knowledge_nodes").update({ parent_node_id: update.parent_node_id }).eq("id", update.id);
  }

  // Insert edges
  const resolvedEdges = edges
    .map((e) => ({
      source_node_id: keyToId[e.source_key],
      target_node_id: keyToId[e.target_key],
      relationship_type: e.relationship_type,
      properties: e.properties || {},
      weight: e.weight || 1.0,
    }))
    .filter((e) => e.source_node_id && e.target_node_id);

  for (let i = 0; i < resolvedEdges.length; i += batchSize) {
    const batch = resolvedEdges.slice(i, i + batchSize);
    const { error } = await supabase.from("knowledge_edges").insert(batch);
    if (error) console.error("Edge insert error:", error);
  }

  return {
    nodes_created: nodes.length,
    edges_created: resolvedEdges.length,
    node_types: [...new Set(nodes.map((n) => n.node_type))],
  };
}

// ─── HTTP Handler ───
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { project_id } = await req.json();
    if (!project_id) {
      return new Response(JSON.stringify({ error: "project_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await buildProjectGraph(project_id);

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("build-knowledge-graph error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
