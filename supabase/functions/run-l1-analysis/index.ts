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

const OPUS_MODEL = "claude-opus-4-20250514";
const SONNET_MODEL = "claude-sonnet-4-20250514";

// The 13 nodes from the L1 skill
const ANALYSIS_STEPS = [
  { key: "node_0", label: "Document Ingestion & Classification", index: 0 },
  { key: "node_1", label: "Phase 1A — Triage", index: 1 },
  { key: "node_2", label: "Module A — Financial & Performance", index: 2 },
  { key: "node_3", label: "Module B — Team & Management", index: 3 },
  { key: "node_4", label: "Module C — Strategy & Market Validation", index: 4 },
  { key: "node_5", label: "Module D — Terms & Structure", index: 5 },
  { key: "node_6", label: "Module E — Operational Quick-Check", index: 6 },
  { key: "node_7", label: "Red Flag Synthesis", index: 7 },
  { key: "node_8", label: "Interrogatory Matrix", index: 8 },
  { key: "node_9", label: "Data Room Request Checklist", index: 9 },
  { key: "node_10", label: "Scoring & Final Recommendation", index: 10 },
  { key: "node_11", label: "Citation Compilation", index: 11 },
  { key: "node_12", label: "Report Assembly", index: 12 },
];

const PIPELINE_STEPS = [
  { key: "download_docs", label: "Downloading Documents", index: 0 },
  { key: "opus_analysis", label: "Opus Deep Analysis & Research", index: 1 },
  { key: "sonnet_assembly", label: "Sonnet Report Assembly", index: 2 },
  { key: "saving_report", label: "Saving Report", index: 3 },
  { key: "extracting_data", label: "Extracting Structured Data", index: 4 },
];

// Total = 13 analysis nodes + 5 pipeline steps
const TOTAL_STEPS = ANALYSIS_STEPS.length + PIPELINE_STEPS.length;

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

/**
 * Process a streaming Claude response and extract text, tracking step markers.
 * Returns the full text content.
 */
async function processStream(
  resp: Response,
  projectId: string,
  onThinkingStart?: () => Promise<void>,
  onThinkingEnd?: () => Promise<void>,
): Promise<string> {
  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let isThinking = false;

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

        switch (event.type) {
          case "content_block_start":
            if (event.content_block?.type === "thinking") {
              isThinking = true;
              if (onThinkingStart) await onThinkingStart();
            }
            break;

          case "content_block_delta":
            if (event.delta?.type === "text_delta") {
              isThinking = false;
              fullText += event.delta.text;

              // Check for step markers
              const stepPattern = /<!-- STEP:(node_\d+):(running|complete) -->/g;
              let match;
              while ((match = stepPattern.exec(fullText)) !== null) {
                const stepKey = match[1];
                const stepStatus = match[2];
                const step = ANALYSIS_STEPS.find(s => s.key === stepKey);
                if (step) {
                  const detail = stepStatus === "running"
                    ? `Analyzing: ${step.label}...`
                    : `Completed: ${step.label}`;
                  await logStep(projectId, step.key, step.label, step.index + 5, stepStatus, detail);
                }
              }
            }
            break;

          case "content_block_stop":
            if (isThinking) {
              isThinking = false;
              if (onThinkingEnd) await onThinkingEnd();
            }
            break;
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  return fullText;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const { project_id } = await req.json();
    if (!project_id) {
      return new Response(JSON.stringify({ error: "project_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clear previous logs
    await supabase.from("analysis_logs").delete().eq("project_id", project_id);

    await supabase.from("task_queue")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("project_id", project_id)
      .eq("status", "pending");

    await supabase.from("projects").update({ status: "analyzing" }).eq("id", project_id);

    // ─── STEP 1: Download Documents ───
    await logStep(project_id, "download_docs", "Downloading Documents", 0, "running", "Fetching system files and project documents...");

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
        const content = await fetchDocumentAsBase64(doc.file_path);
        documentContents.push(content);
      } catch (e) {
        console.error(`Failed to download ${doc.file_name}:`, e);
      }
    }

    if (documentContents.length === 0) {
      await logStep(project_id, "download_docs", "Downloading Documents", 0, "error", "Could not download any documents");
      throw new Error("Could not download any documents for analysis");
    }

    await logStep(project_id, "download_docs", "Downloading Documents", 0, "complete", `Downloaded ${documentContents.length} documents`);

    // Build document content blocks (shared by both phases)
    const docBlocks: any[] = [];
    for (const doc of documentContents) {
      if (doc.mediaType === "application/pdf") {
        docBlocks.push({
          type: "document",
          source: { type: "base64", media_type: doc.mediaType, data: doc.base64 },
          title: doc.name,
        });
      } else {
        docBlocks.push({
          type: "image",
          source: { type: "base64", media_type: doc.mediaType, data: doc.base64 },
        });
      }
    }

    // ─── STEP 2: Opus Deep Analysis & Research ───
    await logStep(project_id, "opus_analysis", "Opus Deep Analysis & Research", 1, "running", "Initializing Opus for deep research...");

    // Initialize analysis node steps as pending
    for (const step of ANALYSIS_STEPS) {
      await logStep(project_id, step.key, step.label, step.index + 5, "pending");
    }

    const opusSystemPrompt = `You are an institutional-grade due diligence analyst operating in DEEP RESEARCH & ANALYSIS mode. You are powered by Claude Opus — the most capable reasoning model available.

Your job is to perform exhaustive, thorough analysis of fund documents. Leave no stone unturned. You have unlimited thinking budget — use it.

## Your Task
Perform Nodes 0-11 of the L1 Pre-Data Room Due Diligence analysis. For each node, produce DETAILED analytical findings, not a final polished report. Think of this as your research workbook — raw, thorough, and comprehensive.

Key priorities:
- Extract EVERY data point, claim, and figure from the documents
- Cross-reference claims against each other for consistency
- Flag ALL contradictions, gaps, omissions, and anomalies
- Assess team credibility with maximum skepticism
- Evaluate performance claims against stated benchmarks critically
- Identify what's missing as thoroughly as what's present

IMPORTANT: Include progress markers as you work:
<!-- STEP:node_0:running --> when you START a node
<!-- STEP:node_0:complete --> when you FINISH a node

Output your findings in structured markdown sections, one per node. Be exhaustive.

${skillContent}`;

    const opusUserContent: any[] = [
      ...docBlocks,
      {
        type: "text",
        text: `Perform deep analysis on these fund documents. Execute Nodes 0 through 11 of the L1 process.

For each node, include <!-- STEP:node_X:running --> and <!-- STEP:node_X:complete --> markers.

Be exhaustive. Extract every data point. Flag every inconsistency. This is the research phase — prioritize depth and completeness over polish.`,
      },
    ];

    console.log(`[${project_id}] Starting Opus deep analysis...`);

    const opusResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: OPUS_MODEL,
        max_tokens: 16000,
        thinking: { type: "enabled", budget_tokens: 32000 },
        temperature: 1,
        stream: true,
        system: opusSystemPrompt,
        messages: [{ role: "user", content: opusUserContent }],
      }),
    });

    if (!opusResp.ok) {
      const errText = await opusResp.text();
      console.error("Opus API error:", opusResp.status, errText);
      await logStep(project_id, "opus_analysis", "Opus Deep Analysis & Research", 1, "error", `Opus API error: ${opusResp.status}`);
      throw new Error(`Opus API error: ${opusResp.status}`);
    }

    const opusFindings = await processStream(
      opusResp,
      project_id,
      async () => { await logStep(project_id, "opus_analysis", "Opus Deep Analysis & Research", 1, "running", "Opus is reasoning deeply..."); },
      async () => { await logStep(project_id, "opus_analysis", "Opus Deep Analysis & Research", 1, "running", "Opus thinking complete. Generating analysis..."); },
    );

    // Strip step markers from findings
    const cleanFindings = opusFindings.replace(/<!-- STEP:node_\d+:(running|complete) -->\n?/g, "");

    console.log(`[${project_id}] Opus analysis complete: ${cleanFindings.length} chars`);
    await logStep(project_id, "opus_analysis", "Opus Deep Analysis & Research", 1, "complete", `Deep analysis complete: ${cleanFindings.length} characters of findings`);

    // Mark any remaining analysis nodes as complete
    for (const step of ANALYSIS_STEPS) {
      await logStep(project_id, step.key, step.label, step.index + 5, "complete", `Completed: ${step.label}`);
    }

    // ─── STEP 3: Sonnet Report Assembly ───
    await logStep(project_id, "sonnet_assembly", "Sonnet Report Assembly", 2, "running", "Initializing Sonnet for report compilation...");

    const sonnetSystemPrompt = `You are an institutional-grade report writer. You will receive raw analytical findings from a deep research phase and must compile them into a polished, publication-ready L1 Preliminary Due Diligence Report.

Your job is Node 12: Report Assembly. Take the raw findings and structure them into the exact report format shown in the sample output.

Requirements:
- Professional, institutional-grade prose
- Proper markdown formatting with headers, tables, and lists
- All scores, flags, and recommendations clearly presented
- Inline citations preserved from the analysis
- Executive summary that captures the key verdict
- Final assessment with clear recommendation

Do NOT fabricate data. Only use findings from the analysis phase.`;

    const sonnetUserContent: any[] = [
      {
        type: "text",
        text: `Here are the complete analytical findings from the Opus deep research phase. Compile these into a polished L1 Preliminary Report following the exact format shown in the sample.

<opus_findings>
${cleanFindings}
</opus_findings>

<sample_report_format>
${sampleContent}
</sample_report_format>

Produce the complete, polished markdown report now. Match the sample format exactly.`,
      },
    ];

    console.log(`[${project_id}] Starting Sonnet report assembly...`);

    const sonnetResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: SONNET_MODEL,
        max_tokens: 16000,
        thinking: { type: "enabled", budget_tokens: 8000 },
        temperature: 1,
        stream: true,
        system: sonnetSystemPrompt,
        messages: [{ role: "user", content: sonnetUserContent }],
      }),
    });

    if (!sonnetResp.ok) {
      const errText = await sonnetResp.text();
      console.error("Sonnet API error:", sonnetResp.status, errText);
      await logStep(project_id, "sonnet_assembly", "Sonnet Report Assembly", 2, "error", `Sonnet API error: ${sonnetResp.status}`);
      throw new Error(`Sonnet API error: ${sonnetResp.status}`);
    }

    // For Sonnet assembly, we don't need step markers — just collect text
    const sonnetReader = sonnetResp.body!.getReader();
    const sonnetDecoder = new TextDecoder();
    let sonnetBuffer = "";
    let reportMarkdown = "";
    let sonnetThinkingDone = false;

    await logStep(project_id, "sonnet_assembly", "Sonnet Report Assembly", 2, "running", "Sonnet is structuring the report...");

    while (true) {
      const { done, value } = await sonnetReader.read();
      if (done) break;
      sonnetBuffer += sonnetDecoder.decode(value, { stream: true });

      let newlineIdx;
      while ((newlineIdx = sonnetBuffer.indexOf("\n")) !== -1) {
        const line = sonnetBuffer.slice(0, newlineIdx).trim();
        sonnetBuffer = sonnetBuffer.slice(newlineIdx + 1);

        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6);
        if (jsonStr === "[DONE]") continue;

        try {
          const event = JSON.parse(jsonStr);
          if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
            reportMarkdown += event.delta.text;
          }
          if (event.type === "content_block_stop" && !sonnetThinkingDone) {
            sonnetThinkingDone = true;
            await logStep(project_id, "sonnet_assembly", "Sonnet Report Assembly", 2, "running", "Writing final report...");
          }
        } catch {}
      }
    }

    console.log(`[${project_id}] Sonnet assembly complete: ${reportMarkdown.length} chars`);
    await logStep(project_id, "sonnet_assembly", "Sonnet Report Assembly", 2, "complete", `Report assembled: ${reportMarkdown.length} characters`);

    if (!reportMarkdown || reportMarkdown.length < 500) {
      await logStep(project_id, "saving_report", "Saving Report", 3, "error", "Insufficient report content");
      throw new Error("Sonnet returned insufficient report content");
    }

    // ─── STEP 4: Save Report ───
    await logStep(project_id, "saving_report", "Saving Report", 3, "running", "Writing report to database...");

    const { error: updateError } = await supabase.from("projects")
      .update({
        report_markdown: reportMarkdown,
        status: "extracting",
        analysis_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", project_id);

    if (updateError) {
      await logStep(project_id, "saving_report", "Saving Report", 3, "error", updateError.message);
      throw new Error(`Failed to save report: ${updateError.message}`);
    }

    await logStep(project_id, "saving_report", "Saving Report", 3, "complete", "Report saved successfully");

    // ─── STEP 5: Trigger Extraction ───
    await logStep(project_id, "extracting_data", "Extracting Structured Data", 4, "running", "Parsing report into structured tables...");

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
      await logStep(project_id, "extracting_data", "Extracting Structured Data", 4, "complete", "Structured data extraction triggered");
    } catch (e) {
      console.error("Failed to trigger extraction:", e);
      await logStep(project_id, "extracting_data", "Extracting Structured Data", 4, "error", "Failed to trigger extraction");
    }

    return new Response(
      JSON.stringify({
        success: true,
        report_length: reportMarkdown.length,
        findings_length: cleanFindings.length,
        documents_processed: documentContents.length,
        models_used: { analysis: OPUS_MODEL, assembly: SONNET_MODEL },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("run-l1-analysis error:", e);

    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body.project_id) {
        await supabase.from("projects")
          .update({ status: "error", error_message: e instanceof Error ? e.message : "Unknown error" })
          .eq("id", body.project_id);
        await supabase.from("task_queue")
          .update({ status: "failed", error_message: e instanceof Error ? e.message : "Unknown error", completed_at: new Date().toISOString() })
          .eq("project_id", body.project_id)
          .eq("task_type", "l1_analysis");
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
