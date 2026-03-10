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

    // Update task status
    await supabase.from("task_queue")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("project_id", project_id)
      .eq("status", "pending");

    await supabase.from("projects").update({ status: "analyzing" }).eq("id", project_id);

    console.log(`Starting L1 analysis for project ${project_id}`);

    // Fetch system files and project documents in parallel
    const [skillContent, sampleContent, { data: documents }] = await Promise.all([
      fetchSystemFile("l1-skill.md"),
      fetchSystemFile("l1-sample-output.md"),
      supabase.from("documents").select("*").eq("project_id", project_id),
    ]);

    if (!documents || documents.length === 0) {
      throw new Error("No documents found for this project");
    }

    console.log(`Found ${documents.length} documents. Downloading for analysis...`);

    // Download all PDFs as base64 for Claude
    const documentContents: { base64: string; mediaType: string; name: string }[] = [];
    for (const doc of documents) {
      if (!doc.file_path) continue;
      try {
        const content = await fetchDocumentAsBase64(doc.file_path);
        documentContents.push(content);
        console.log(`Downloaded: ${doc.file_name} (${content.mediaType})`);
      } catch (e) {
        console.error(`Failed to download ${doc.file_name}:`, e);
      }
    }

    if (documentContents.length === 0) {
      throw new Error("Could not download any documents for analysis");
    }

    // Build the Claude message with documents
    const systemPrompt = `You are an institutional-grade due diligence analyst. You will perform an L1 Pre-Data Room Due Diligence analysis following the skill instructions precisely.

IMPORTANT: Your output must be a single, complete markdown report following the exact structure and format shown in the sample output. Do NOT produce JSON or DOCX — only the markdown report.

Focus on producing the markdown (.md) report ONLY. Follow the 13-node process exactly as described in the skill document.

${skillContent}`;

    // Build content blocks: documents first, then instructions
    const userContent: any[] = [];

    // Add each document as a document block
    for (const doc of documentContents) {
      if (doc.mediaType === "application/pdf") {
        userContent.push({
          type: "document",
          source: {
            type: "base64",
            media_type: doc.mediaType,
            data: doc.base64,
          },
          title: doc.name,
        });
      } else {
        userContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: doc.mediaType,
            data: doc.base64,
          },
        });
      }
    }

    // Add the instruction text with sample reference
    userContent.push({
      type: "text",
      text: `Analyze the uploaded fund documents following the L1 skill instructions. Produce a complete markdown L1 Preliminary Report.

Here is a sample output showing the exact format, structure, depth, and quality expected. Your report should match this level of detail and follow the same section structure:

<sample_report>
${sampleContent}
</sample_report>

Now produce the L1 report for the uploaded documents. Follow the 13-node process. Include:
1. Executive Summary with L1 Score
2. Submission Quality Assessment
3. Module A: Financial & Performance
4. Module B: Team & Management (with autonomous research verification)
5. Module C: Strategy & Market Validation (with autonomous research)
6. Module D: Terms & Structure
7. Module E: Operational Quick-Check
8. Red Flag Summary
9. Interrogatory Matrix
10. Data Room Request Checklist
11. Final Assessment & Recommendation
12. Appendix: Research Sources

Be thorough, cite sources, and maintain institutional-grade analysis quality throughout.`,
    });

    console.log("Calling Claude API for L1 analysis...");

    // Call Claude with extended thinking for deep analysis
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
        thinking: {
          type: "enabled",
          budget_tokens: 10000,
        },
        temperature: 1,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userContent,
          },
        ],
      }),
    });

    if (!anthropicResp.ok) {
      const errText = await anthropicResp.text();
      console.error("Claude API error:", anthropicResp.status, errText);
      throw new Error(`Claude API error: ${anthropicResp.status}`);
    }

    const result = await anthropicResp.json();
    console.log("Claude API response received. Extracting markdown...");

    // Extract the text content from Claude's response
    let reportMarkdown = "";
    for (const block of result.content) {
      if (block.type === "text") {
        reportMarkdown += block.text;
      }
    }

    if (!reportMarkdown || reportMarkdown.length < 500) {
      throw new Error("Claude returned insufficient report content");
    }

    console.log(`Report generated: ${reportMarkdown.length} characters`);

    // Store the report markdown in the project
    const { error: updateError } = await supabase.from("projects")
      .update({
        report_markdown: reportMarkdown,
        status: "extracting",
        analysis_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", project_id);

    if (updateError) throw new Error(`Failed to save report: ${updateError.message}`);

    // Update task queue
    await supabase.from("task_queue")
      .update({ status: "extracting" })
      .eq("project_id", project_id)
      .eq("task_type", "l1_analysis");

    console.log("Report saved. Triggering structured data extraction...");

    // Trigger the extract-structured-data function
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/extract-structured-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({ project_id }),
      });
    } catch (e) {
      console.error("Failed to trigger extraction:", e);
      // Don't fail the whole process — the report is saved
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

    // Try to update project status to error
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
