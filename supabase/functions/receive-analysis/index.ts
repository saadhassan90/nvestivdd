import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { project_id, event } = payload;

    if (!project_id) {
      return new Response(JSON.stringify({ error: "project_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Received ${event || "unknown"} event for project ${project_id}`);

    // ─── Handle progress updates ───
    if (event === "progress") {
      const { step_key, step_label, step_index, total_steps, status, detail } = payload;

      const { data: existing } = await supabase
        .from("analysis_logs")
        .select("id")
        .eq("project_id", project_id)
        .eq("step_key", step_key)
        .maybeSingle();

      if (existing) {
        await supabase.from("analysis_logs").update({
          status,
          detail: detail || null,
          completed_at: status === "complete" || status === "error" ? new Date().toISOString() : null,
        }).eq("id", existing.id);
      } else {
        await supabase.from("analysis_logs").insert({
          project_id,
          step_key,
          step_label: step_label || step_key,
          step_index: step_index || 0,
          total_steps: total_steps || 9,
          status,
          detail: detail || null,
          started_at: new Date().toISOString(),
          completed_at: status === "complete" ? new Date().toISOString() : null,
        });
      }

      return new Response(JSON.stringify({ success: true, event: "progress" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Handle completed analysis ───
    if (event === "analysis_complete") {
      const {
        report_markdown,
        structured_data,
        project_metadata,
      } = payload;

      // 1. Save report markdown + project-level fields
      const projectUpdate: Record<string, any> = {
        status: "complete",
        error_message: null,
        report_markdown: report_markdown || null,
        analysis_date: new Date().toISOString().split("T")[0],
      };

      // Merge any project-level metadata the agent sends back
      if (project_metadata) {
        const fields = [
          "composite_score", "completeness_score", "recommendation", "score_tier",
          "executive_summary_narrative", "final_assessment_narrative", "recommended_timeline",
          "asset_class", "strategy", "fund_size_estimated", "fund_inception_date",
          "gp_entity_name", "domicile", "regulatory_status", "established_year", "vintage",
          "key_strengths", "key_risks", "conditions_for_advancement", "market_validation_points",
          "module_scores",
        ];
        for (const field of fields) {
          if (project_metadata[field] !== undefined) {
            projectUpdate[field] = project_metadata[field];
          }
        }
      }

      await supabase.from("projects").update(projectUpdate).eq("id", project_id);

      // 2. Insert structured data into respective tables
      if (structured_data) {
        const tableInserts = [
          { table: "module_scores", data: structured_data.module_scores },
          { table: "red_flags", data: structured_data.red_flags },
          { table: "interrogatory_items", data: structured_data.interrogatory_items },
          { table: "data_room_items", data: structured_data.data_room_items },
          { table: "team_members", data: structured_data.team_members },
          { table: "fee_structure", data: structured_data.fee_structure },
          { table: "performance_metrics", data: structured_data.performance_metrics },
          { table: "competitive_landscape", data: structured_data.competitive_landscape },
          { table: "market_factors", data: structured_data.market_factors },
          { table: "thesis_validations", data: structured_data.thesis_validations },
          { table: "service_providers", data: structured_data.service_providers },
          { table: "submission_quality", data: structured_data.submission_quality },
          { table: "document_quality_flags", data: structured_data.document_quality_flags },
          { table: "critical_info_gaps", data: structured_data.critical_info_gaps },
          { table: "engagement_case_studies", data: structured_data.engagement_case_studies },
          { table: "research_sources", data: structured_data.research_sources },
          { table: "report_sections", data: structured_data.report_sections },
        ];

        for (const { table, data } of tableInserts) {
          if (!data || !Array.isArray(data) || data.length === 0) continue;

          // Clear existing data for this project in this table
          await supabase.from(table).delete().eq("project_id", project_id);

          // Insert new data, adding project_id to each row
          const rows = data.map((row: any) => ({ ...row, project_id }));
          const { error } = await supabase.from(table).insert(rows);
          if (error) {
            console.error(`Failed to insert into ${table}:`, error.message);
          } else {
            console.log(`Inserted ${rows.length} rows into ${table}`);
          }
        }
      }

      // 3. Mark analysis logs as complete
      await supabase.from("analysis_logs").upsert({
        project_id,
        step_key: "complete",
        step_label: "Analysis Complete",
        step_index: 8,
        total_steps: 9,
        status: "complete",
        detail: `Report: ${(report_markdown || "").length} chars`,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      }, { onConflict: "project_id,step_key" }).then(() => {});

      // 4. Complete task queue entry if exists
      await supabase.from("task_queue")
        .update({ status: "complete", completed_at: new Date().toISOString() })
        .eq("project_id", project_id)
        .in("status", ["pending", "running"]);

      console.log(`Analysis complete for project ${project_id}`);

      return new Response(
        JSON.stringify({ success: true, event: "analysis_complete", project_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Handle errors from external agent ───
    if (event === "analysis_error") {
      const { error_message } = payload;
      await supabase.from("projects")
        .update({ status: "error", error_message: error_message || "External analysis failed" })
        .eq("id", project_id);

      return new Response(
        JSON.stringify({ success: true, event: "analysis_error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown event type: ${event}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("receive-analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
