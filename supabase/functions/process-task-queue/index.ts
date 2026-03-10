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
const MAX_RETRIES = 3;

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
      .select("id, project_id, task_type, retry_count, max_retries")
      .eq("status", "running")
      .lt("started_at", stuckCutoff);

    let recovered = 0;
    if (stuckTasks && stuckTasks.length > 0) {
      console.log(`Found ${stuckTasks.length} stuck tasks...`);
      for (const task of stuckTasks) {
        const retryCount = (task.retry_count || 0) + 1;
        const maxRetries = task.max_retries || MAX_RETRIES;

        if (retryCount >= maxRetries) {
          // Max retries reached — mark as permanently failed
          console.log(`Task ${task.id} reached max retries (${maxRetries}). Marking as max_retries_exceeded.`);
          await supabase.from("task_queue")
            .update({
              status: "max_retries_exceeded",
              retry_count: retryCount,
              error_message: `Failed after ${maxRetries} attempts. Last failure: timed out after 10 minutes.`,
              completed_at: new Date().toISOString(),
            })
            .eq("id", task.id);
          await supabase.from("projects")
            .update({ status: "error", error_message: `Analysis failed after ${maxRetries} attempts. Please check the error details and retry.` })
            .eq("id", task.project_id);
        } else {
          // Retry — reset to pending with incremented count
          console.log(`Retrying task ${task.id} (attempt ${retryCount + 1}/${maxRetries})...`);
          await supabase.from("task_queue")
            .update({
              status: "pending",
              started_at: null,
              retry_count: retryCount,
              error_message: `Auto-reset: attempt ${retryCount} timed out. Retrying...`,
            })
            .eq("id", task.id);
          await supabase.from("projects")
            .update({ status: "processing" })
            .eq("id", task.project_id);
        }
        recovered++;
      }
    }

    // 2. Also handle failed tasks that haven't exceeded max retries
    const { data: failedTasks } = await supabase
      .from("task_queue")
      .select("id, project_id, task_type, retry_count, max_retries, error_message")
      .eq("status", "failed");

    let retriedFailed = 0;
    if (failedTasks && failedTasks.length > 0) {
      for (const task of failedTasks) {
        const retryCount = task.retry_count || 0;
        const maxRetries = task.max_retries || MAX_RETRIES;

        if (retryCount >= maxRetries) {
          // Already at max — escalate
          console.log(`Failed task ${task.id} at max retries (${retryCount}/${maxRetries}). Marking as max_retries_exceeded.`);
          await supabase.from("task_queue")
            .update({
              status: "max_retries_exceeded",
              error_message: `Failed after ${maxRetries} attempts. Last error: ${task.error_message || 'Unknown'}`,
              completed_at: new Date().toISOString(),
            })
            .eq("id", task.id);
          await supabase.from("projects")
            .update({ status: "error", error_message: `Analysis failed after ${maxRetries} attempts. Last error: ${task.error_message || 'Unknown'}` })
            .eq("id", task.project_id);
        } else {
          // Retry the failed task
          console.log(`Retrying failed task ${task.id} (attempt ${retryCount + 1}/${maxRetries})...`);
          await supabase.from("task_queue")
            .update({
              status: "pending",
              started_at: null,
              retry_count: retryCount + 1,
              error_message: `Retrying after failure: ${task.error_message || 'Unknown'}`,
            })
            .eq("id", task.id);
          await supabase.from("projects")
            .update({ status: "processing", error_message: null })
            .eq("id", task.project_id);
          retriedFailed++;
        }
      }
    }

    // 3. Find ALL pending tasks
    const { data: pendingTasks } = await supabase
      .from("task_queue")
      .select("id, project_id, task_type, retry_count")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(20);

    if (!pendingTasks || pendingTasks.length === 0) {
      console.log("No pending tasks found.");
      return new Response(
        JSON.stringify({ dispatched: 0, recovered, retried_failed: retriedFailed }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${pendingTasks.length} pending tasks. Dispatching...`);

    const dispatched: { task_id: string; project_id: string; attempt: number }[] = [];

    await Promise.all(pendingTasks.map(async (task) => {
      const { error: claimError } = await supabase
        .from("task_queue")
        .update({ status: "running", started_at: new Date().toISOString() })
        .eq("id", task.id)
        .eq("status", "pending");

      if (claimError) {
        console.error(`Failed to claim task ${task.id}:`, claimError.message);
        return;
      }

      const { data: verify } = await supabase
        .from("task_queue")
        .select("status")
        .eq("id", task.id)
        .single();

      if (!verify || verify.status !== "running") {
        console.log(`Task ${task.id} already claimed, skipping.`);
        return;
      }

      const functionName = task.task_type === "l1_analysis" ? "run-l1-analysis" : task.task_type;

      console.log(`Dispatching task ${task.id} → ${functionName} (attempt ${(task.retry_count || 0) + 1})`);

      fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ project_id: task.project_id }),
      }).catch((err) => {
        console.error(`Failed to dispatch ${functionName} for ${task.project_id}:`, err);
      });

      dispatched.push({ task_id: task.id, project_id: task.project_id, attempt: (task.retry_count || 0) + 1 });
    }));

    console.log(`Dispatched ${dispatched.length} tasks.`);

    return new Response(
      JSON.stringify({ dispatched: dispatched.length, recovered, retried_failed: retriedFailed, tasks: dispatched }),
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
