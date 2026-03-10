import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const STUCK_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing task queue...");

    // 1. Recover stuck tasks (running for > 10 minutes)
    const stuckCutoff = new Date(Date.now() - STUCK_THRESHOLD_MS).toISOString();
    const { data: stuckTasks } = await supabase
      .from("task_queue")
      .select("id, project_id, task_type")
      .eq("status", "running")
      .lt("started_at", stuckCutoff);

    if (stuckTasks && stuckTasks.length > 0) {
      console.log(`Found ${stuckTasks.length} stuck tasks, resetting to pending...`);
      for (const task of stuckTasks) {
        await supabase.from("task_queue")
          .update({ status: "pending", started_at: null, error_message: "Auto-reset: previous attempt timed out" })
          .eq("id", task.id);
        await supabase.from("projects")
          .update({ status: "processing" })
          .eq("id", task.project_id);
      }
    }

    // 2. Find pending tasks to process
    const { data: pendingTasks } = await supabase
      .from("task_queue")
      .select("id, project_id, task_type")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1);

    if (!pendingTasks || pendingTasks.length === 0) {
      console.log("No pending tasks found.");
      return new Response(
        JSON.stringify({ processed: 0, recovered: stuckTasks?.length || 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const task = pendingTasks[0];
    console.log(`Processing task ${task.id} (${task.task_type}) for project ${task.project_id}`);

    // 3. Claim the task atomically
    const { data: claimed } = await supabase
      .from("task_queue")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", task.id)
      .eq("status", "pending")
      .select()
      .single();

    if (!claimed) {
      console.log("Task already claimed by another worker.");
      return new Response(
        JSON.stringify({ processed: 0, message: "Task already claimed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Dispatch to the appropriate edge function
    const functionName = task.task_type === "l1_analysis" ? "run-l1-analysis" : task.task_type;
    console.log(`Dispatching to ${functionName}...`);

    // Fire the edge function (don't await the full response - it may take a long time)
    fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ project_id: task.project_id }),
    }).catch((err) => {
      console.error(`Failed to dispatch ${functionName}:`, err);
    });

    return new Response(
      JSON.stringify({ processed: 1, task_id: task.id, project_id: task.project_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("process-task-queue error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
