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

// Use gpt-4o-mini for cost-efficient structured extraction
const EXTRACTION_MODEL = "gpt-4o-mini";

async function callOpenAI(messages: any[], tools?: any[], toolChoice?: any) {
  const body: any = { model: EXTRACTION_MODEL, messages, temperature: 0.1 };
  if (tools) body.tools = tools;
  if (toolChoice) body.tool_choice = toolChoice;

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenAI error: ${resp.status} ${err}`);
  }

  return await resp.json();
}

function extractToolArgs(result: any): any {
  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return null;
  try {
    return JSON.parse(toolCall.function.arguments);
  } catch {
    return null;
  }
}

// ─── Extract project-level metadata from markdown ───
async function extractProjectMetadata(markdown: string, projectId: string) {
  const header = markdown.slice(0, 3000);

  const result = await callOpenAI(
    [
      { role: "system", content: "Extract structured metadata from this L1 due diligence report header. Be precise with scores and recommendations." },
      { role: "user", content: header },
    ],
    [{
      type: "function",
      function: {
        name: "extract_metadata",
        description: "Extract project metadata from report",
        parameters: {
          type: "object",
          properties: {
            fund_name: { type: "string" },
            asset_class: { type: "string" },
            strategy: { type: "string" },
            composite_score: { type: "integer" },
            recommendation: { type: "string" },
            score_tier: { type: "string" },
            gp_entity_name: { type: "string" },
            domicile: { type: "string" },
            fund_size_estimated: { type: "string" },
            vintage: { type: "string" },
            established_year: { type: "string" },
            fund_inception_date: { type: "string" },
            executive_summary_narrative: { type: "string" },
            key_strengths: { type: "array", items: { type: "string" } },
            key_risks: { type: "array", items: { type: "string" } },
          },
          required: ["fund_name", "composite_score", "recommendation"],
        },
      },
    }],
    { type: "function", function: { name: "extract_metadata" } }
  );

  const data = extractToolArgs(result);
  if (!data) return;

  await supabase.from("projects").update({
    fund_name: data.fund_name,
    asset_class: data.asset_class || null,
    strategy: data.strategy || null,
    composite_score: data.composite_score,
    recommendation: data.recommendation,
    score_tier: data.score_tier || null,
    gp_entity_name: data.gp_entity_name || null,
    domicile: data.domicile || null,
    fund_size_estimated: data.fund_size_estimated || null,
    vintage: data.vintage || null,
    established_year: data.established_year || null,
    fund_inception_date: data.fund_inception_date || null,
    executive_summary_narrative: data.executive_summary_narrative || null,
    key_strengths: data.key_strengths || null,
    key_risks: data.key_risks || null,
  }).eq("id", projectId);

  console.log(`Project metadata extracted: ${data.fund_name}, score ${data.composite_score}`);
}

// ─── Extract module scores ───
async function extractModuleScores(markdown: string, projectId: string) {
  const result = await callOpenAI(
    [
      { role: "system", content: "Extract all module scores from this L1 report. Look for Modules A through E with their scores, weights, and confidence levels." },
      { role: "user", content: markdown.slice(0, 12000) + "\n...\n" + markdown.slice(-3000) },
    ],
    [{
      type: "function",
      function: {
        name: "extract_modules",
        description: "Extract module scores",
        parameters: {
          type: "object",
          properties: {
            modules: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  module_key: { type: "string", description: "e.g. module_a, module_b" },
                  module_label: { type: "string", description: "e.g. Financial & Performance Assessment" },
                  score: { type: "integer" },
                  weight: { type: "number" },
                  confidence: { type: "string" },
                  confidence_rationale: { type: "string" },
                  summary_assessment: { type: "string" },
                },
                required: ["module_key", "module_label", "score"],
              },
            },
          },
          required: ["modules"],
        },
      },
    }],
    { type: "function", function: { name: "extract_modules" } }
  );

  const data = extractToolArgs(result);
  if (!data?.modules) return;

  // Delete existing and insert new
  await supabase.from("module_scores").delete().eq("project_id", projectId);
  await supabase.from("module_scores").insert(
    data.modules.map((m: any, i: number) => ({
      project_id: projectId,
      module_key: m.module_key,
      module_label: m.module_label,
      score: m.score,
      weight: m.weight || null,
      weighted_score: m.weight ? Math.round(m.score * m.weight) / 100 : null,
      confidence: m.confidence || null,
      confidence_rationale: m.confidence_rationale || null,
      summary_assessment: m.summary_assessment || null,
      order_index: i,
    }))
  );

  console.log(`Extracted ${data.modules.length} module scores`);
}

// ─── Extract red flags ───
async function extractRedFlags(markdown: string, projectId: string) {
  // Find the red flag section
  const rfStart = markdown.indexOf("RED FLAG");
  const rfEnd = markdown.indexOf("INTERROGATORY", rfStart);
  const rfSection = rfStart >= 0 ? markdown.slice(rfStart, rfEnd > rfStart ? rfEnd : rfStart + 5000) : markdown.slice(0, 8000);

  const result = await callOpenAI(
    [
      { role: "system", content: "Extract all red flags from this section. Include CRITICAL, ELEVATED, and MONITOR severity flags." },
      { role: "user", content: rfSection },
    ],
    [{
      type: "function",
      function: {
        name: "extract_red_flags",
        description: "Extract red flags",
        parameters: {
          type: "object",
          properties: {
            flags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  severity: { type: "string", enum: ["critical", "elevated", "monitor"] },
                  description: { type: "string" },
                  issue: { type: "string" },
                  implication: { type: "string" },
                  resolution: { type: "string" },
                  timeline: { type: "string" },
                  module: { type: "string" },
                  confidence: { type: "string" },
                },
                required: ["title", "severity"],
              },
            },
          },
          required: ["flags"],
        },
      },
    }],
    { type: "function", function: { name: "extract_red_flags" } }
  );

  const data = extractToolArgs(result);
  if (!data?.flags) return;

  await supabase.from("red_flags").delete().eq("project_id", projectId);
  await supabase.from("red_flags").insert(
    data.flags.map((f: any, i: number) => ({
      project_id: projectId,
      title: f.title,
      severity: f.severity,
      description: f.description || null,
      issue: f.issue || null,
      implication: f.implication || null,
      resolution: f.resolution || null,
      timeline: f.timeline || null,
      module: f.module || null,
      confidence: f.confidence || null,
      flag_number: i + 1,
      order_index: i,
    }))
  );

  console.log(`Extracted ${data.flags.length} red flags`);
}

// ─── Extract team members ───
async function extractTeamMembers(markdown: string, projectId: string) {
  const teamStart = markdown.indexOf("TEAM");
  const teamEnd = markdown.indexOf("## ", teamStart + 10);
  const teamSection = teamStart >= 0 ? markdown.slice(teamStart, teamEnd > teamStart ? Math.min(teamEnd, teamStart + 8000) : teamStart + 8000) : "";
  if (!teamSection) return;

  const result = await callOpenAI(
    [
      { role: "system", content: "Extract all team members from this section with their details, verification status, and assessment." },
      { role: "user", content: teamSection },
    ],
    [{
      type: "function",
      function: {
        name: "extract_team",
        description: "Extract team members",
        parameters: {
          type: "object",
          properties: {
            members: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  title: { type: "string" },
                  is_key_person: { type: "boolean" },
                  years_experience: { type: "integer" },
                  education: { type: "string" },
                  role_category: { type: "string" },
                  prior_affiliations: { type: "array", items: { type: "string" } },
                  verification_status: { type: "string", enum: ["verified", "partially_verified", "unverified"] },
                  verification_detail: { type: "string" },
                  adverse_findings: { type: "string" },
                  adverse_finding_severity: { type: "string" },
                  assessment_rating: { type: "string" },
                },
                required: ["name"],
              },
            },
          },
          required: ["members"],
        },
      },
    }],
    { type: "function", function: { name: "extract_team" } }
  );

  const data = extractToolArgs(result);
  if (!data?.members) return;

  await supabase.from("team_members").delete().eq("project_id", projectId);
  await supabase.from("team_members").insert(
    data.members.map((m: any, i: number) => ({
      project_id: projectId,
      name: m.name,
      title: m.title || null,
      is_key_person: m.is_key_person || false,
      years_experience: m.years_experience || null,
      education: m.education || null,
      role_category: m.role_category || null,
      prior_affiliations: m.prior_affiliations || null,
      verification_status: m.verification_status || "unverified",
      verification_detail: m.verification_detail || null,
      adverse_findings: m.adverse_findings || null,
      adverse_finding_severity: m.adverse_finding_severity || null,
      assessment_rating: m.assessment_rating || null,
      order_index: i,
    }))
  );

  console.log(`Extracted ${data.members.length} team members`);
}

// ─── Extract fee structure ───
async function extractFeeStructure(markdown: string, projectId: string) {
  const feeStart = markdown.search(/fee|management fee|carry|incentive/i);
  const feeSection = feeStart >= 0 ? markdown.slice(Math.max(0, feeStart - 200), feeStart + 4000) : "";
  if (!feeSection) return;

  const result = await callOpenAI(
    [
      { role: "system", content: "Extract fee structure components from this text. Include management fees, carry, hurdle rates, etc. by share class." },
      { role: "user", content: feeSection },
    ],
    [{
      type: "function",
      function: {
        name: "extract_fees",
        description: "Extract fee components",
        parameters: {
          type: "object",
          properties: {
            fees: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  component: { type: "string" },
                  share_class: { type: "string" },
                  value: { type: "string" },
                  is_disclosed: { type: "boolean" },
                  assessment: { type: "string" },
                  assessment_detail: { type: "string" },
                  asset_class_norm: { type: "string" },
                },
                required: ["component", "share_class", "value"],
              },
            },
          },
          required: ["fees"],
        },
      },
    }],
    { type: "function", function: { name: "extract_fees" } }
  );

  const data = extractToolArgs(result);
  if (!data?.fees) return;

  await supabase.from("fee_structure").delete().eq("project_id", projectId);
  await supabase.from("fee_structure").insert(
    data.fees.map((f: any, i: number) => ({
      project_id: projectId,
      component: f.component,
      share_class: f.share_class,
      value: f.value,
      is_disclosed: f.is_disclosed !== false,
      assessment: f.assessment || null,
      assessment_detail: f.assessment_detail || null,
      asset_class_norm: f.asset_class_norm || null,
      order_index: i,
    }))
  );

  console.log(`Extracted ${data.fees.length} fee components`);
}

// ─── Extract interrogatory items ───
async function extractInterrogatory(markdown: string, projectId: string) {
  const intStart = markdown.indexOf("INTERROGATORY");
  const intEnd = markdown.indexOf("DATA ROOM", intStart);
  const intSection = intStart >= 0 ? markdown.slice(intStart, intEnd > intStart ? intEnd : intStart + 6000) : "";
  if (!intSection) return;

  const result = await callOpenAI(
    [
      { role: "system", content: "Extract all interrogatory/diligence questions from this matrix." },
      { role: "user", content: intSection },
    ],
    [{
      type: "function",
      function: {
        name: "extract_interrogatory",
        description: "Extract interrogatory questions",
        parameters: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question_id: { type: "string" },
                  question: { type: "string" },
                  rationale: { type: "string" },
                  priority: { type: "string", enum: ["critical", "high", "standard"] },
                  source_module: { type: "string" },
                  source_module_label: { type: "string" },
                },
                required: ["question", "priority"],
              },
            },
          },
          required: ["questions"],
        },
      },
    }],
    { type: "function", function: { name: "extract_interrogatory" } }
  );

  const data = extractToolArgs(result);
  if (!data?.questions) return;

  await supabase.from("interrogatory_items").delete().eq("project_id", projectId);
  await supabase.from("interrogatory_items").insert(
    data.questions.map((q: any, i: number) => ({
      project_id: projectId,
      question_id: q.question_id || null,
      question: q.question,
      rationale: q.rationale || null,
      priority: q.priority,
      status: "open",
      source_module: q.source_module || null,
      source_module_label: q.source_module_label || null,
      order_index: i,
    }))
  );

  console.log(`Extracted ${data.questions.length} interrogatory items`);
}

// ─── Extract data room items ───
async function extractDataRoom(markdown: string, projectId: string) {
  const drStart = markdown.indexOf("DATA ROOM");
  const drSection = drStart >= 0 ? markdown.slice(drStart, drStart + 6000) : "";
  if (!drSection) return;

  const result = await callOpenAI(
    [
      { role: "system", content: "Extract the data room checklist items organized by priority tier." },
      { role: "user", content: drSection },
    ],
    [{
      type: "function",
      function: {
        name: "extract_data_room",
        description: "Extract data room checklist",
        parameters: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  document_name: { type: "string" },
                  priority: { type: "string", enum: ["essential", "important", "standard", "optional"] },
                  priority_label: { type: "string" },
                  purpose: { type: "string" },
                  module: { type: "string" },
                },
                required: ["document_name", "priority"],
              },
            },
          },
          required: ["items"],
        },
      },
    }],
    { type: "function", function: { name: "extract_data_room" } }
  );

  const data = extractToolArgs(result);
  if (!data?.items) return;

  await supabase.from("data_room_items").delete().eq("project_id", projectId);
  await supabase.from("data_room_items").insert(
    data.items.map((item: any, i: number) => ({
      project_id: projectId,
      document_name: item.document_name,
      priority: item.priority,
      priority_label: item.priority_label || null,
      purpose: item.purpose || null,
      module: item.module || null,
      is_received: false,
      is_reviewed: false,
      order_index: i,
    }))
  );

  console.log(`Extracted ${data.items.length} data room items`);
}

// ─── Extract service providers ───
async function extractServiceProviders(markdown: string, projectId: string) {
  const result = await callOpenAI(
    [
      { role: "system", content: "Extract all service providers mentioned in this report (auditor, administrator, custodian, prime broker, legal counsel, etc.)." },
      { role: "user", content: markdown.slice(0, 12000) },
    ],
    [{
      type: "function",
      function: {
        name: "extract_providers",
        description: "Extract service providers",
        parameters: {
          type: "object",
          properties: {
            providers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  provider_type: { type: "string" },
                  provider_name: { type: "string" },
                  is_disclosed: { type: "boolean" },
                  is_verified: { type: "boolean" },
                  verification_detail: { type: "string" },
                  importance: { type: "string", enum: ["critical", "important", "standard"] },
                  notes: { type: "string" },
                },
                required: ["provider_type"],
              },
            },
          },
          required: ["providers"],
        },
      },
    }],
    { type: "function", function: { name: "extract_providers" } }
  );

  const data = extractToolArgs(result);
  if (!data?.providers) return;

  await supabase.from("service_providers").delete().eq("project_id", projectId);
  await supabase.from("service_providers").insert(
    data.providers.map((p: any) => ({
      project_id: projectId,
      provider_type: p.provider_type,
      provider_name: p.provider_name || null,
      is_disclosed: p.is_disclosed !== false,
      is_verified: p.is_verified || null,
      verification_detail: p.verification_detail || null,
      importance: p.importance || "standard",
      notes: p.notes || null,
    }))
  );

  console.log(`Extracted ${data.providers.length} service providers`);
}

// ─── Main handler ───
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const { project_id } = await req.json();
    if (!project_id) {
      return new Response(JSON.stringify({ error: "project_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Starting structured data extraction for project ${project_id}`);

    // Fetch the report markdown
    const { data: project, error } = await supabase
      .from("projects")
      .select("report_markdown")
      .eq("id", project_id)
      .single();

    if (error || !project?.report_markdown) {
      throw new Error("No report markdown found for this project");
    }

    const markdown = project.report_markdown;
    console.log(`Report length: ${markdown.length} characters. Extracting structured data...`);

    // Run extractions in parallel batches (avoid rate limits)
    // Batch 1: Core metadata
    await Promise.all([
      extractProjectMetadata(markdown, project_id),
      extractModuleScores(markdown, project_id),
    ]);

    // Batch 2: Major entities
    await Promise.all([
      extractRedFlags(markdown, project_id),
      extractTeamMembers(markdown, project_id),
      extractFeeStructure(markdown, project_id),
    ]);

    // Batch 3: Diligence items
    await Promise.all([
      extractInterrogatory(markdown, project_id),
      extractDataRoom(markdown, project_id),
      extractServiceProviders(markdown, project_id),
    ]);

    // Update project status to complete
    await supabase.from("projects")
      .update({ status: "complete" })
      .eq("id", project_id);

    await supabase.from("task_queue")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("project_id", project_id)
      .eq("task_type", "l1_analysis");

    console.log("Structured data extraction complete. Triggering knowledge graph build...");

    // Trigger knowledge graph build
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/build-knowledge-graph`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({ project_id }),
      });
    } catch (e) {
      console.error("Failed to trigger knowledge graph:", e);
    }

    return new Response(
      JSON.stringify({ success: true, project_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("extract-structured-data error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
