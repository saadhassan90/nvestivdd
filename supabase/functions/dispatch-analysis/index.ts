import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_URL = Deno.env.get("ANALYSIS_WEBHOOK_URL");
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SIGNED_URL_EXPIRY = 60 * 60; // 1 hour

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { project_id } = await req.json();
    if (!project_id) {
      return new Response(JSON.stringify({ error: "project_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!WEBHOOK_URL) {
      return new Response(JSON.stringify({ error: "ANALYSIS_WEBHOOK_URL is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch project metadata
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch documents
    const { data: documents } = await supabase
      .from("documents")
      .select("*")
      .eq("project_id", project_id);

    if (!documents || documents.length === 0) {
      return new Response(JSON.stringify({ error: "No documents found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate signed URLs for each document
    const documentPayloads = [];
    for (const doc of documents) {
      if (!doc.file_path) continue;

      const { data: signedData, error: signError } = await supabase.storage
        .from("documents")
        .createSignedUrl(doc.file_path, SIGNED_URL_EXPIRY);

      if (signError || !signedData) {
        console.error(`Failed to sign URL for ${doc.file_name}:`, signError?.message);
        continue;
      }

      documentPayloads.push({
        id: doc.id,
        file_name: doc.file_name,
        file_type: doc.file_type,
        file_size: doc.file_size,
        signed_url: signedData.signedUrl,
        expires_in_seconds: SIGNED_URL_EXPIRY,
      });
    }

    // Build the outbound payload
    const payload = {
      event: "analysis_requested",
      project_id: project.id,
      callback_url: `${SUPABASE_URL}/functions/v1/receive-analysis`,
      project: {
        fund_name: project.fund_name,
        asset_class: project.asset_class,
        strategy: project.strategy,
        submitter_name: project.submitter_name,
        submitter_company: project.submitter_company,
        submitter_email: project.submitter_email,
        created_at: project.created_at,
      },
      documents: documentPayloads,
      system_files: {
        skill_url: `${SUPABASE_URL}/storage/v1/object/system/l1-skill.md`,
        sample_url: `${SUPABASE_URL}/storage/v1/object/system/l1-sample-output.md`,
      },
      requested_at: new Date().toISOString(),
    };

    // Update project status
    await supabase.from("projects")
      .update({ status: "analyzing", error_message: null })
      .eq("id", project_id);

    // Log initial step
    await supabase.from("analysis_logs").upsert({
      project_id,
      step_key: "dispatch",
      step_label: "Dispatched to Analysis Agent",
      step_index: 0,
      total_steps: 9,
      status: "complete",
      detail: `Sent ${documentPayloads.length} documents to external agent`,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }, { onConflict: "project_id,step_key" }).then(() => {
      // Ignore upsert conflict errors since there's no unique constraint yet
    });

    // Fire webhook to external agent
    console.log(`Dispatching analysis for project ${project_id} to ${WEBHOOK_URL}`);
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!webhookResponse.ok) {
      const errText = await webhookResponse.text();
      console.error(`Webhook failed (${webhookResponse.status}):`, errText);
      await supabase.from("projects")
        .update({ status: "error", error_message: `Webhook dispatch failed: ${webhookResponse.status}` })
        .eq("id", project_id);

      return new Response(JSON.stringify({ error: "Webhook dispatch failed", status: webhookResponse.status }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Webhook dispatched successfully for project ${project_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        project_id,
        documents_sent: documentPayloads.length,
        callback_url: payload.callback_url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("dispatch-analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
