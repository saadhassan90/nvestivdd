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

// Pipeline-level steps that wrap the Claude call
const PIPELINE_STEPS = [
  { key: "download_docs", label: "Downloading Documents", index: 13 },
  { key: "calling_claude", label: "Calling Claude API", index: 14 },
  { key: "saving_report", label: "Saving Report", index: 15 },
  { key: "extracting_data", label: "Extracting Structured Data", index: 16 },
];

const TOTAL_STEPS = ANALYSIS_STEPS.length + PIPELINE_STEPS.length;

async function logStep(projectId: string, stepKey: string, stepLabel: string, stepIndex: number, status: string, detail?: string) {
  // Upsert: update if exists, insert if not
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

    // Clear previous analysis logs for this project
    await supabase.from("analysis_logs").delete().eq("project_id", project_id);

    // Update task status
    await supabase.from("task_queue")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("project_id", project_id)
      .eq("status", "pending");

    await supabase.from("projects").update({ status: "analyzing" }).eq("id", project_id);

    // Step: Download documents
    await logStep(project_id, "download_docs", "Downloading Documents", 0, "running", "Fetching system files and project documents...");

    const [skillContent, sampleContent, { data: documents }] = await Promise.all([
      fetchSystemFile("l1-skill.md"),
      fetchSystemFile("l1-sample-output.md"),
      supabase.from("documents").select("*").eq("project_id", project_id),
    ]);

    if (!documents || documents.length === 0) {
      await logStep(project_id, "download_docs", "Downloading Documents", 0, "error", "No documents found for this project");
      throw new Error("No documents found for this project");
    }

    await logStep(project_id, "download_docs", "Downloading Documents", 0, "running", `Found ${documents.length} documents. Downloading...`);

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

    // Step: Call Claude API (streaming)
    await logStep(project_id, "calling_claude", "Calling Claude API", 1, "running", "Initializing analysis with extended thinking...");

    // Initialize all 13 node steps as pending
    for (const step of ANALYSIS_STEPS) {
      await logStep(project_id, step.key, step.label, step.index + 2, "pending");
    }

    const systemPrompt = `You are an institutional-grade due diligence analyst. You will perform an L1 Pre-Data Room Due Diligence analysis following the skill instructions precisely.

IMPORTANT: Your output must be a single, complete markdown report following the exact structure and format shown in the sample output. Do NOT produce JSON or DOCX — only the markdown report.

IMPORTANT: As you work through the 13-node process, include progress markers in your output. At the START of each node's work, output a line like:
<!-- STEP:node_0:running -->
And when that node is complete:
<!-- STEP:node_0:complete -->

These markers help us track your progress. They will be stripped from the final report.

Focus on producing the markdown (.md) report ONLY. Follow the 13-node process exactly as described in the skill document.

${skillContent}`;

    const userContent: any[] = [];

    for (const doc of documentContents) {
      if (doc.mediaType === "application/pdf") {
        userContent.push({
          type: "document",
          source: { type: "base64", media_type: doc.mediaType, data: doc.base64 },
          title: doc.name,
        });
      } else {
        userContent.push({
          type: "image",
          source: { type: "base64", media_type: doc.mediaType, data: doc.base64 },
        });
      }
    }

    userContent.push({
      type: "text",
      text: `Analyze the uploaded fund documents following the L1 skill instructions. Produce a complete markdown L1 Preliminary Report.

CRITICAL: Include <!-- STEP:node_X:running --> and <!-- STEP:node_X:complete --> markers as you progress through each of the 13 nodes (node_0 through node_12). Place the "running" marker when you BEGIN working on that node, and the "complete" marker when you FINISH it.

Here is a sample output showing the exact format, structure, depth, and quality expected:

<sample_report>
${sampleContent}
</sample_report>

Now produce the L1 report for the uploaded documents. Follow the 13-node process with progress markers.`,
    });

    // Stream the Claude response
    const anthropicResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 16000,
        thinking: { type: "enabled", budget_tokens: 10000 },
        temperature: 1,
        stream: true,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!anthropicResp.ok) {
      const errText = await anthropicResp.text();
      console.error("Claude API error:", anthropicResp.status, errText);
      await logStep(project_id, "calling_claude", "Calling Claude API", 1, "error", `API error: ${anthropicResp.status}`);
      throw new Error(`Claude API error: ${anthropicResp.status}`);
    }

    // Process the stream, tracking step markers
    const reader = anthropicResp.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let reportMarkdown = "";
    let isThinking = false;
    let thinkingLogged = false;

    await logStep(project_id, "calling_claude", "Calling Claude API", 1, "running", "Claude is thinking...");

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
                if (!thinkingLogged) {
                  await logStep(project_id, "calling_claude", "Calling Claude API", 1, "running", "Claude is reasoning through the analysis...");
                  thinkingLogged = true;
                }
              }
              break;

            case "content_block_delta":
              if (event.delta?.type === "thinking_delta") {
                // Thinking — we log periodic updates
              } else if (event.delta?.type === "text_delta") {
                isThinking = false;
                reportMarkdown += event.delta.text;

                // Check for step markers in accumulated text
                const stepPattern = /<!-- STEP:(node_\d+):(running|complete) -->/g;
                let match;
                while ((match = stepPattern.exec(reportMarkdown)) !== null) {
                  const stepKey = match[1];
                  const stepStatus = match[2];
                  const step = ANALYSIS_STEPS.find(s => s.key === stepKey);
                  if (step) {
                    const detail = stepStatus === "running"
                      ? `Analyzing: ${step.label}...`
                      : `Completed: ${step.label}`;
                    await logStep(project_id, step.key, step.label, step.index + 2, stepStatus, detail);
                  }
                }
              }
              break;

            case "content_block_stop":
              if (isThinking) {
                isThinking = false;
                await logStep(project_id, "calling_claude", "Calling Claude API", 1, "running", "Thinking complete. Generating report...");
              }
              break;
          }
        } catch {
          // Ignore parse errors
        }
      }
    }

    // Strip step markers from the final report
    reportMarkdown = reportMarkdown.replace(/<!-- STEP:node_\d+:(running|complete) -->\n?/g, "");

    await logStep(project_id, "calling_claude", "Calling Claude API", 1, "complete", `Report generated: ${reportMarkdown.length} characters`);

    if (!reportMarkdown || reportMarkdown.length < 500) {
      await logStep(project_id, "saving_report", "Saving Report", TOTAL_STEPS - 2, "error", "Insufficient report content generated");
      throw new Error("Claude returned insufficient report content");
    }

    // Step: Save report
    await logStep(project_id, "saving_report", "Saving Report", TOTAL_STEPS - 2, "running", "Writing report to database...");

    const { error: updateError } = await supabase.from("projects")
      .update({
        report_markdown: reportMarkdown,
        status: "extracting",
        analysis_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", project_id);

    if (updateError) {
      await logStep(project_id, "saving_report", "Saving Report", TOTAL_STEPS - 2, "error", updateError.message);
      throw new Error(`Failed to save report: ${updateError.message}`);
    }

    await logStep(project_id, "saving_report", "Saving Report", TOTAL_STEPS - 2, "complete", "Report saved successfully");

    // Step: Trigger extraction
    await logStep(project_id, "extracting_data", "Extracting Structured Data", TOTAL_STEPS - 1, "running", "Parsing report into structured tables...");

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
      await logStep(project_id, "extracting_data", "Extracting Structured Data", TOTAL_STEPS - 1, "complete", "Structured data extraction triggered");
    } catch (e) {
      console.error("Failed to trigger extraction:", e);
      await logStep(project_id, "extracting_data", "Extracting Structured Data", TOTAL_STEPS - 1, "error", "Failed to trigger extraction");
    }

    return new Response(
      JSON.stringify({
        success: true,
        report_length: reportMarkdown.length,
        documents_processed: documentContents.length,
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
