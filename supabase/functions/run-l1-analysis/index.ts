import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const OPUS_MODEL = "claude-opus-4-6";
const SONNET_MODEL = "claude-sonnet-4-5-20250929";

// ─── Pipeline Steps ───
const PIPELINE_STEPS = [
  { key: "download_docs", label: "Downloading Documents", index: 0 },
  { key: "phase1_triage", label: "Phase 1: Triage & Classification", index: 1 },
  { key: "phase2_group1", label: "Modules A+E: Financial & Operational", index: 2 },
  { key: "phase2_group2", label: "Modules B+C: Team & Strategy", index: 3 },
  { key: "phase2_group3", label: "Module D: Terms & Structure", index: 4 },
  { key: "phase3_synthesis", label: "Synthesis: Red Flags, Interrogatory, Scoring", index: 5 },
  { key: "sonnet_assembly", label: "Report Assembly", index: 6 },
  { key: "saving_report", label: "Saving Report", index: 7 },
  { key: "extracting_data", label: "Extracting Structured Data", index: 8 },
];
const TOTAL_STEPS = PIPELINE_STEPS.length;

// ─── Helpers ───

async function logStep(projectId: string, stepKey: string, stepLabel: string, stepIndex: number, status: string, detail?: string) {
  const { data: existing } = await supabase
    .from("analysis_logs")
    .select("id")
    .eq("project_id", projectId)
    .eq("step_key", stepKey)
    .maybeSingle();

  if (existing) {
    await supabase.from("analysis_logs").update({
      status,
      detail: detail || null,
      completed_at: status === "complete" || status === "error" ? new Date().toISOString() : null,
    }).eq("id", existing.id);
  } else {
    await supabase.from("analysis_logs").insert({
      project_id: projectId,
      step_key: stepKey,
      step_label: stepLabel,
      step_index: stepIndex,
      total_steps: TOTAL_STEPS,
      status,
      detail: detail || null,
      started_at: new Date().toISOString(),
      completed_at: status === "complete" ? new Date().toISOString() : null,
    });
  }
}

// ─── Cache Helpers ───

async function getCachedOutput(projectId: string, phaseKey: string): Promise<string | null> {
  const { data } = await supabase
    .from("pipeline_cache")
    .select("output_text")
    .eq("project_id", projectId)
    .eq("phase_key", phaseKey)
    .maybeSingle();
  return data?.output_text || null;
}

async function setCachedOutput(projectId: string, phaseKey: string, output: string, model?: string): Promise<void> {
  await supabase.from("pipeline_cache").upsert({
    project_id: projectId,
    phase_key: phaseKey,
    output_text: output,
    char_count: output.length,
    model_used: model || null,
  }, { onConflict: "project_id,phase_key" });
}

async function fetchSystemFile(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("system").download(path);
  if (error) throw new Error(`Failed to fetch system file ${path}: ${error.message}`);
  return await data.text();
}

async function fetchDocumentAsBase64(filePath: string): Promise<{ base64: string; mediaType: string; name: string }> {
  const { data, error } = await supabase.storage.from("documents").download(filePath);
  if (error) throw new Error(`Failed to download ${filePath}: ${error.message}`);

  const arrayBuffer = await data.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  const base64 = btoa(binary);

  const ext = filePath.split(".").pop()?.toLowerCase();
  const mediaType = ext === "pdf" ? "application/pdf"
    : ext === "png" ? "image/png"
    : ext === "jpg" || ext === "jpeg" ? "image/jpeg"
    : "application/octet-stream";

  return { base64, mediaType, name: filePath.split("/").pop() || filePath };
}

function buildDocBlocks(documentContents: { base64: string; mediaType: string; name: string }[]): any[] {
  return documentContents.map(doc => {
    if (doc.mediaType === "application/pdf") {
      return {
        type: "document",
        source: { type: "base64", media_type: doc.mediaType, data: doc.base64 },
        title: doc.name,
      };
    }
    return {
      type: "image",
      source: { type: "base64", media_type: doc.mediaType, data: doc.base64 },
    };
  });
}

/**
 * Call Claude with streaming and return the text output.
 */
async function callClaude(
  model: string,
  system: string,
  userContent: any[],
  maxTokens: number,
  thinkingBudget: number,
): Promise<string> {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      thinking: { type: "enabled", budget_tokens: thinkingBudget },
      temperature: 1,
      stream: true,
      system,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Claude API error ${resp.status}: ${errText}`);
  }

  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIdx;
    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIdx).trim();
      buffer = buffer.slice(newlineIdx + 1);

      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6);
      if (jsonStr === "[DONE]") continue;

      try {
        const event = JSON.parse(jsonStr);
        if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
          fullText += event.delta.text;
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  return fullText;
}

// ─── Phase Definitions ───

const PHASE1_SYSTEM = `You are an institutional-grade due diligence analyst performing TRIAGE & CLASSIFICATION.

Your task: Execute Nodes 0-1 of the L1 Pre-Data Room Due Diligence analysis.

Node 0 — Document Ingestion & Classification:
- Classify each document by type (pitch deck, DDQ, financial statements, legal docs, etc.)
- Assess document quality, completeness, and recency
- Note any missing critical document types

Node 1 — Phase 1A Triage:
- Extract key fund identifiers: fund name, GP entity, strategy, AUM, vintage, domicile
- Determine asset class and strategy classification
- Perform initial viability assessment
- Flag any immediate disqualifiers

Output your findings in structured markdown. Be thorough — this output feeds all subsequent analysis modules.`;

function makeModuleGroupSystem(modules: string, skillContent: string): string {
  return `You are an institutional-grade due diligence analyst performing DEEP MODULE ANALYSIS.

You will receive: (1) the source documents, (2) triage findings from Phase 1.

Your task: Execute the following analysis modules with maximum depth and rigor:

${modules}

Key priorities:
- Extract EVERY data point, claim, and figure relevant to these modules
- Cross-reference claims against each other for consistency
- Flag ALL contradictions, gaps, omissions, and anomalies
- Be exhaustive — this is the research phase, prioritize depth over polish

Output your findings in structured markdown, one section per module.

Reference material:
${skillContent}`;
}

const GROUP1_MODULES = `Module A — Financial & Performance Analysis:
- Analyze all performance data, track records, benchmarks, alpha generation
- Evaluate fee structures, fund economics, waterfall mechanics
- Assess AUM trajectory, fundraising history, capacity constraints

Module E — Operational Quick-Check:
- Evaluate operational infrastructure, service providers, compliance
- Assess fund administration, custody, audit arrangements
- Review regulatory registrations and compliance history`;

const GROUP2_MODULES = `Module B — Team & Management Assessment:
- Deep-dive on key personnel backgrounds, experience, track records
- Evaluate team stability, succession planning, key-person risk
- Assess alignment of interests, co-investment, compensation structures

Module C — Strategy & Market Validation:
- Validate investment thesis against market data
- Assess competitive positioning and differentiation
- Evaluate market timing, opportunity set, and capacity`;

const GROUP3_MODULES = `Module D — Terms & Structure Analysis:
- Analyze fund terms, governance, investor protections
- Evaluate liquidity provisions, lock-ups, redemption terms
- Assess legal structure, domicile implications, tax efficiency
- Review side letter provisions and MFN clauses`;

const SYNTHESIS_SYSTEM = `You are an institutional-grade due diligence analyst performing SYNTHESIS & SCORING.

You will receive: (1) the triage output, (2) all module analysis findings.

Your task: Execute Nodes 7-11:

Node 7 — Red Flag Synthesis:
- Compile all red flags from every module into a unified severity-ranked list
- Assess cumulative risk and flag interactions
- Determine deal-breakers vs. negotiable concerns

Node 8 — Interrogatory Matrix:
- Generate prioritized questions for the GP based on all findings
- Link questions to specific red flags and information gaps
- Classify by urgency and module

Node 9 — Data Room Request Checklist:
- Compile all documents needed for L2 deep-dive
- Prioritize by criticality and link to findings

Node 10 — Scoring & Final Recommendation:
- Score each module (1-10) with confidence levels
- Calculate composite score with appropriate weighting
- Determine recommendation: Advance / Conditional / Decline
- Provide conditions for advancement if applicable

Node 11 — Citation Compilation:
- Compile all source references and cross-references

Output in structured markdown. Be comprehensive and cite specific evidence for every score and recommendation.`;

// ─── Main Handler ───

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const { project_id } = await req.json();
    if (!project_id) {
      return new Response(JSON.stringify({ error: "project_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Don't clear previous logs — we'll update them. Don't clear cache!
    await supabase.from("task_queue")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("project_id", project_id)
      .eq("status", "pending");
    await supabase.from("projects").update({ status: "analyzing" }).eq("id", project_id);

    // Initialize all steps as pending
    for (const step of PIPELINE_STEPS) {
      await logStep(project_id, step.key, step.label, step.index, "pending");
    }

    // ─── STEP 0: Download Documents ───
    await logStep(project_id, "download_docs", "Downloading Documents", 0, "running", "Fetching documents...");

    const [skillContent, sampleContent, { data: documents }] = await Promise.all([
      fetchSystemFile("l1-skill.md"),
      fetchSystemFile("l1-sample-output.md"),
      supabase.from("documents").select("*").eq("project_id", project_id),
    ]);

    if (!documents || documents.length === 0) {
      await logStep(project_id, "download_docs", "Downloading Documents", 0, "error", "No documents found");
      throw new Error("No documents found for this project");
    }

    const documentContents: { base64: string; mediaType: string; name: string }[] = [];
    for (const doc of documents) {
      if (!doc.file_path) continue;
      try {
        documentContents.push(await fetchDocumentAsBase64(doc.file_path));
      } catch (e) {
        console.error(`Failed to download ${doc.file_name}:`, e);
      }
    }

    if (documentContents.length === 0) {
      await logStep(project_id, "download_docs", "Downloading Documents", 0, "error", "Could not download any documents");
      throw new Error("Could not download any documents for analysis");
    }

    await logStep(project_id, "download_docs", "Downloading Documents", 0, "complete", `Downloaded ${documentContents.length} documents`);
    const docBlocks = buildDocBlocks(documentContents);

    // ─── STEP 1: Phase 1 — Triage (Sequential, cached) ───
    let triageOutput = await getCachedOutput(project_id, "phase1_triage");
    if (triageOutput) {
      console.log(`[${project_id}] Phase 1: CACHED (${triageOutput.length} chars)`);
      await logStep(project_id, "phase1_triage", "Phase 1: Triage & Classification", 1, "complete", `Cached: ${triageOutput.length} chars`);
    } else {
      await logStep(project_id, "phase1_triage", "Phase 1: Triage & Classification", 1, "running", "Opus analyzing document classification & triage...");
      console.log(`[${project_id}] Phase 1: Triage starting...`);

      triageOutput = await callClaude(
        OPUS_MODEL,
        PHASE1_SYSTEM,
        [...docBlocks, { type: "text", text: "Perform document classification (Node 0) and triage (Node 1) on these fund documents. Be thorough — your output feeds all subsequent parallel analysis modules." }],
        16000,
        10000,
      );

      await setCachedOutput(project_id, "phase1_triage", triageOutput, OPUS_MODEL);
      console.log(`[${project_id}] Phase 1 complete: ${triageOutput.length} chars`);
      await logStep(project_id, "phase1_triage", "Phase 1: Triage & Classification", 1, "complete", `Triage complete: ${triageOutput.length} chars`);
    }

    // ─── STEP 2: Phase 2 — Parallel Module Groups (cached per group) ───
    console.log(`[${project_id}] Phase 2: Checking cache for module groups...`);

    const [cachedG1, cachedG2, cachedG3] = await Promise.all([
      getCachedOutput(project_id, "phase2_group1"),
      getCachedOutput(project_id, "phase2_group2"),
      getCachedOutput(project_id, "phase2_group3"),
    ]);

    const makeModuleUserContent = (groupInstruction: string): any[] => [
      ...docBlocks,
      {
        type: "text",
        text: `<triage_findings>\n${triageOutput}\n</triage_findings>\n\n${groupInstruction}`,
      },
    ];

    // Only run groups that aren't cached
    const groupPromises: [Promise<string>, Promise<string>, Promise<string>] = [
      cachedG1
        ? (async () => {
            console.log(`[${project_id}] Group 1 (A+E): CACHED (${cachedG1.length} chars)`);
            await logStep(project_id, "phase2_group1", "Modules A+E: Financial & Operational", 2, "complete", `Cached: ${cachedG1.length} chars`);
            return cachedG1;
          })()
        : (async () => {
            await logStep(project_id, "phase2_group1", "Modules A+E: Financial & Operational", 2, "running", "Opus analyzing Financial & Operational...");
            const result = await callClaude(OPUS_MODEL, makeModuleGroupSystem(GROUP1_MODULES, skillContent), makeModuleUserContent("Analyze Module A (Financial & Performance) and Module E (Operational Quick-Check). Use the triage findings for context. Be exhaustive."), 32000, 16000);
            await setCachedOutput(project_id, "phase2_group1", result, OPUS_MODEL);
            console.log(`[${project_id}] Group 1 (A+E) complete: ${result.length} chars`);
            await logStep(project_id, "phase2_group1", "Modules A+E: Financial & Operational", 2, "complete", `Complete: ${result.length} chars`);
            return result;
          })().catch(async (err) => { await logStep(project_id, "phase2_group1", "Modules A+E: Financial & Operational", 2, "error", err.message); throw err; }),

      cachedG2
        ? (async () => {
            console.log(`[${project_id}] Group 2 (B+C): CACHED (${cachedG2.length} chars)`);
            await logStep(project_id, "phase2_group2", "Modules B+C: Team & Strategy", 3, "complete", `Cached: ${cachedG2.length} chars`);
            return cachedG2;
          })()
        : (async () => {
            await logStep(project_id, "phase2_group2", "Modules B+C: Team & Strategy", 3, "running", "Opus analyzing Team & Strategy...");
            const result = await callClaude(OPUS_MODEL, makeModuleGroupSystem(GROUP2_MODULES, skillContent), makeModuleUserContent("Analyze Module B (Team & Management) and Module C (Strategy & Market Validation). Use the triage findings for context. Be exhaustive."), 32000, 16000);
            await setCachedOutput(project_id, "phase2_group2", result, OPUS_MODEL);
            console.log(`[${project_id}] Group 2 (B+C) complete: ${result.length} chars`);
            await logStep(project_id, "phase2_group2", "Modules B+C: Team & Strategy", 3, "complete", `Complete: ${result.length} chars`);
            return result;
          })().catch(async (err) => { await logStep(project_id, "phase2_group2", "Modules B+C: Team & Strategy", 3, "error", err.message); throw err; }),

      cachedG3
        ? (async () => {
            console.log(`[${project_id}] Group 3 (D): CACHED (${cachedG3.length} chars)`);
            await logStep(project_id, "phase2_group3", "Module D: Terms & Structure", 4, "complete", `Cached: ${cachedG3.length} chars`);
            return cachedG3;
          })()
        : (async () => {
            await logStep(project_id, "phase2_group3", "Module D: Terms & Structure", 4, "running", "Opus analyzing Terms & Structure...");
            const result = await callClaude(OPUS_MODEL, makeModuleGroupSystem(GROUP3_MODULES, skillContent), makeModuleUserContent("Analyze Module D (Terms & Structure). Use the triage findings for context. Be exhaustive."), 24000, 12000);
            await setCachedOutput(project_id, "phase2_group3", result, OPUS_MODEL);
            console.log(`[${project_id}] Group 3 (D) complete: ${result.length} chars`);
            await logStep(project_id, "phase2_group3", "Module D: Terms & Structure", 4, "complete", `Complete: ${result.length} chars`);
            return result;
          })().catch(async (err) => { await logStep(project_id, "phase2_group3", "Module D: Terms & Structure", 4, "error", err.message); throw err; }),
    ];

    const [group1Output, group2Output, group3Output] = await Promise.all(groupPromises);

    console.log(`[${project_id}] Phase 2 complete. All module groups finished.`);

    // ─── STEP 3: Phase 3 — Synthesis (Sequential) ───
    await logStep(project_id, "phase3_synthesis", "Synthesis: Red Flags, Interrogatory, Scoring", 5, "running", "Opus synthesizing all findings...");
    console.log(`[${project_id}] Phase 3: Synthesis starting...`);

    const allModuleFindings = `<triage_findings>\n${triageOutput}\n</triage_findings>

<module_a_e_findings>\n${group1Output}\n</module_a_e_findings>

<module_b_c_findings>\n${group2Output}\n</module_b_c_findings>

<module_d_findings>\n${group3Output}\n</module_d_findings>`;

    const synthesisOutput = await callClaude(
      OPUS_MODEL,
      SYNTHESIS_SYSTEM,
      [{ type: "text", text: `Here are all the analytical findings from the triage and module analysis phases. Perform the synthesis (Nodes 7-11).\n\n${allModuleFindings}` }],
      32000,
      16000,
    );

    console.log(`[${project_id}] Phase 3 complete: ${synthesisOutput.length} chars`);
    await logStep(project_id, "phase3_synthesis", "Synthesis: Red Flags, Interrogatory, Scoring", 5, "complete", `Synthesis complete: ${synthesisOutput.length} chars`);

    // ─── STEP 4: Phase 4 — Report Assembly (Sonnet) ───
    await logStep(project_id, "sonnet_assembly", "Report Assembly", 6, "running", "Sonnet assembling final report...");
    console.log(`[${project_id}] Phase 4: Report Assembly starting...`);

    const reportAssemblyPrompt = `You are an institutional-grade report writer. Compile the raw analytical findings into a polished, publication-ready L1 Preliminary Due Diligence Report.

Requirements:
- Professional, institutional-grade prose
- Proper markdown formatting with headers, tables, and lists
- All scores, flags, and recommendations clearly presented
- Inline citations preserved from the analysis
- Executive summary that captures the key verdict
- Final assessment with clear recommendation

Do NOT fabricate data. Only use findings from the analysis phases.`;

    const reportMarkdown = await callClaude(
      SONNET_MODEL,
      reportAssemblyPrompt,
      [{
        type: "text",
        text: `Here are the complete analytical findings from all phases. Compile into a polished L1 Preliminary Report matching the sample format exactly.

${allModuleFindings}

<synthesis_findings>\n${synthesisOutput}\n</synthesis_findings>

<sample_report_format>\n${sampleContent}\n</sample_report_format>

Produce the complete, polished markdown report now.`,
      }],
      16000,
      8000,
    );

    console.log(`[${project_id}] Phase 4 complete: ${reportMarkdown.length} chars`);
    await logStep(project_id, "sonnet_assembly", "Report Assembly", 6, "complete", `Report: ${reportMarkdown.length} chars`);

    if (!reportMarkdown || reportMarkdown.length < 500) {
      await logStep(project_id, "saving_report", "Saving Report", 7, "error", "Insufficient report content");
      throw new Error("Sonnet returned insufficient report content");
    }

    // ─── STEP 5: Save Report ───
    await logStep(project_id, "saving_report", "Saving Report", 7, "running", "Writing report to database...");

    const { error: updateError } = await supabase.from("projects")
      .update({
        report_markdown: reportMarkdown,
        status: "extracting",
        analysis_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", project_id);

    if (updateError) {
      await logStep(project_id, "saving_report", "Saving Report", 7, "error", updateError.message);
      throw new Error(`Failed to save report: ${updateError.message}`);
    }

    await logStep(project_id, "saving_report", "Saving Report", 7, "complete", "Report saved successfully");

    // ─── STEP 6: Trigger Extraction ───
    await logStep(project_id, "extracting_data", "Extracting Structured Data", 8, "running", "Parsing report into structured tables...");

    await supabase.from("task_queue")
      .update({ status: "extracting" })
      .eq("project_id", project_id)
      .eq("task_type", "l1_analysis");

    try {
      await fetch(`${SUPABASE_URL}/functions/v1/extract-structured-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({ project_id }),
      });
      await logStep(project_id, "extracting_data", "Extracting Structured Data", 8, "complete", "Extraction triggered");
    } catch (e) {
      console.error("Failed to trigger extraction:", e);
      await logStep(project_id, "extracting_data", "Extracting Structured Data", 8, "error", "Failed to trigger extraction");
    }

    return new Response(
      JSON.stringify({
        success: true,
        report_length: reportMarkdown.length,
        phases: {
          triage: triageOutput.length,
          group1_financial_ops: group1Output.length,
          group2_team_strategy: group2Output.length,
          group3_terms: group3Output.length,
          synthesis: synthesisOutput.length,
        },
        documents_processed: documentContents.length,
        models_used: { analysis: OPUS_MODEL, assembly: SONNET_MODEL },
        architecture: "parallel_grouped",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : "Unknown error";
    console.error("run-l1-analysis error:", errorMsg);

    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body.project_id) {
        const { data: taskData } = await supabase.from("task_queue")
          .select("retry_count, max_retries")
          .eq("project_id", body.project_id)
          .eq("task_type", "l1_analysis")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const retryCount = (taskData?.retry_count || 0);
        const maxRetries = taskData?.max_retries || 3;

        await logStep(body.project_id, "error", `Attempt ${retryCount + 1} Failed`, 0, "error", errorMsg);

        if (retryCount + 1 >= maxRetries) {
          console.log(`Project ${body.project_id}: max retries (${maxRetries}) reached.`);
          await supabase.from("projects")
            .update({ status: "error", error_message: `Analysis failed after ${maxRetries} attempts. Last error: ${errorMsg}` })
            .eq("id", body.project_id);
          await supabase.from("task_queue")
            .update({
              status: "max_retries_exceeded",
              retry_count: retryCount + 1,
              error_message: `Failed after ${maxRetries} attempts. Last error: ${errorMsg}`,
              completed_at: new Date().toISOString(),
            })
            .eq("project_id", body.project_id)
            .eq("task_type", "l1_analysis");
        } else {
          console.log(`Project ${body.project_id}: attempt ${retryCount + 1}/${maxRetries} failed. Will retry.`);
          await supabase.from("projects")
            .update({ status: "error", error_message: `Attempt ${retryCount + 1}/${maxRetries} failed: ${errorMsg}. Retrying...` })
            .eq("id", body.project_id);
          await supabase.from("task_queue")
            .update({
              status: "failed",
              retry_count: retryCount + 1,
              error_message: errorMsg,
            })
            .eq("project_id", body.project_id)
            .eq("task_type", "l1_analysis");
        }
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
