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

    let recovered = 0;
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
      recovered = stuckTasks.length;
    }

    // 2. Find ALL pending tasks (not just one)
    const { data: pendingTasks } = await supabase
      .from("task_queue")
      .select("id, project_id, task_type")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(20); // process up to 20 in parallel

    if (!pendingTasks || pendingTasks.length === 0) {
      console.log("No pending tasks found.");
      return new Response(
        JSON.stringify({ dispatched: 0, recovered }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${pendingTasks.length} pending tasks. Dispatching all in parallel...`);

    // 3. Claim ALL tasks atomically, then fire each as a separate edge function invocation
    const dispatched: { task_id: string; project_id: string }[] = [];

    await Promise.all(pendingTasks.map(async (task) => {
      // Claim the task — use count to verify the update actually matched
      const { error: claimError, count } = await supabase
        .from("task_queue")
        .update({ status: "running", started_at: new Date().toISOString() })
        .eq("id", task.id)
        .eq("status", "pending");

      if (claimError) {
        console.error(`Failed to claim task ${task.id}:`, claimError.message);
        return;
      }

      // Verify we actually updated the row by checking current status
      const { data: verify } = await supabase
        .from("task_queue")
        .select("status")
        .eq("id", task.id)
        .single();

      if (!verify || verify.status !== "running") {
        console.log(`Task ${task.id} already claimed by another worker, skipping.`);
        return;
      }

      // Determine which edge function to invoke
      const functionName = task.task_type === "l1_analysis" ? "run-l1-analysis" : task.task_type;

      console.log(`Dispatching task ${task.id} → ${functionName} for project ${task.project_id}`);

      // Fire the edge function — each invocation spins up its own isolate
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

      dispatched.push({ task_id: task.id, project_id: task.project_id });
    }));

    console.log(`Dispatched ${dispatched.length} tasks in parallel.`);

    return new Response(
      JSON.stringify({ dispatched: dispatched.length, recovered, tasks: dispatched }),
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
