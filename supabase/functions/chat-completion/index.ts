import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const MODEL_MAP: Record<string, string> = {
  "sonnet-4": "claude-sonnet-4-20250514",
  "haiku-3.5": "claude-3-5-haiku-20241022",
};

function buildSystemPrompt(projectContext?: any) {
  let base = `You are Iris, an institutional-grade due diligence intelligence engine built into Nvestiv.

## EXECUTION MODEL — PARALLEL RETRIEVAL + SYNTHESIS

You operate in two phases:

### Phase 1: PARALLEL DATA RETRIEVAL
On EVERY query, fire ALL relevant tools simultaneously in a single tool_use turn. Always include:
- At least one structured data tool (scores, flags, interrogatory, etc.)
- The search_documents RAG tool for semantic/graph context
NEVER call tools sequentially when they can run in parallel. The system executes all tool calls concurrently.

### Phase 2: SYNTHESIS
After receiving all tool results, synthesize findings into a unified response. Cross-reference structured data against graph/RAG findings. Surface contradictions, confirmations, and novel connections.

## RESPONSE STYLE
- Lead with the verdict, not the preamble. No throat-clearing.
- Be punchy, precise, and high-impact. Every sentence must earn its place.
- Use bold for key figures and findings. Use tables for comparisons.
- Cite sources inline: "[Source: filename.pdf]" or "[Graph: node_label]"
- Institutional finance register — no filler, no hedging unless warranted by data gaps.
- When data from structured tables and the knowledge graph conflict, flag it explicitly.
- Prefer 3-5 tight paragraphs over walls of bullet points.
- NEVER fabricate scores, figures, or metrics.`;

  if (projectContext) {
    base += `\n\nCurrent context: Scoped to "${projectContext.fund_name}".`;
    if (projectContext.composite_score) base += ` Score: ${projectContext.composite_score}/100.`;
    if (projectContext.recommendation) base += ` Rec: ${projectContext.recommendation}.`;
    if (projectContext.asset_class) base += ` Class: ${projectContext.asset_class}.`;
    base += ` project_id: ${projectContext.id}. Use this for all tool calls unless the user asks about other deals.`;
  } else {
    base += `\n\nGlobal mode — user may ask about any deal. Use cross-deal tools for comparisons.`;
  }

  return base;
}

const tools = [
  {
    name: "query_deal_scores",
    description: "Query the projects table for deal scores, recommendations, module_scores, and metadata. Can filter by project_id for a specific deal or return all deals.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Optional. Filter to a specific project UUID." },
      },
    },
  },
  {
    name: "query_red_flags",
    description: "Query red flags for deals. Can filter by project_id, severity (critical/elevated/monitor), and module.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Optional project UUID filter" },
        severity: { type: "string", description: "Optional: critical, elevated, or monitor" },
        module: { type: "string", description: "Optional module filter" },
      },
    },
  },
  {
    name: "query_interrogatory",
    description: "Query interrogatory/diligence questions. Can filter by project_id, priority, and status.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Optional project UUID filter" },
        priority: { type: "string", description: "Optional: critical, high, standard" },
        status: { type: "string", description: "Optional: open, addressed, resolved" },
      },
    },
  },
  {
    name: "query_data_room",
    description: "Query data room checklist items. Can filter by project_id, priority, and received status.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Optional project UUID filter" },
        priority: { type: "string", description: "Optional: essential, important, standard" },
        is_received: { type: "boolean", description: "Optional: filter by received status" },
      },
    },
  },
  {
    name: "query_report_section",
    description: "Fetch report section content by section_key (e.g., executive_summary, module_a, module_b, etc.) for a project.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Required project UUID" },
        section_key: { type: "string", description: "Section key like executive_summary, module_a, module_b, module_c, module_d, module_e" },
      },
      required: ["project_id"],
    },
  },
  {
    name: "query_cross_deal",
    description: "Aggregate data across all projects for comparative analysis. Returns all projects with their scores, recommendations, and flag counts.",
    input_schema: {
      type: "object",
      properties: {
        metric: { type: "string", description: "What to compare: scores, flags, recommendations, asset_classes" },
      },
      required: ["metric"],
    },
  },
  {
    name: "query_documents",
    description: "List uploaded documents and their metadata for a project.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Required project UUID" },
      },
      required: ["project_id"],
    },
  },
  {
    name: "search_documents",
    description: "Semantic search over the knowledge graph using vector similarity. Returns relevant entities, concepts, people, risks, and their relationships from the fund's knowledge graph. Use this for open-ended questions, finding connections, or when structured tools don't cover the query.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural language search query" },
        project_id: { type: "string", description: "Optional project UUID to scope search" },
        include_relationships: { type: "boolean", description: "Whether to also return connected nodes via edges. Default true." },
      },
      required: ["query"],
    },
  },
];

async function executeTool(name: string, input: any): Promise<string> {
  try {
    switch (name) {
      case "query_deal_scores": {
        let q = supabase.from("projects").select("id, fund_name, composite_score, recommendation, score_tier, asset_class, module_scores, established_year, vintage, status, created_at");
        if (input.project_id) q = q.eq("id", input.project_id);
        const { data, error } = await q.order("created_at", { ascending: false }).limit(50);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data);
      }
      case "query_red_flags": {
        let q = supabase.from("red_flags").select("*");
        if (input.project_id) q = q.eq("project_id", input.project_id);
        if (input.severity) q = q.eq("severity", input.severity);
        if (input.module) q = q.eq("module", input.module);
        const { data, error } = await q.limit(100);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data);
      }
      case "query_interrogatory": {
        let q = supabase.from("interrogatory_items").select("*");
        if (input.project_id) q = q.eq("project_id", input.project_id);
        if (input.priority) q = q.eq("priority", input.priority);
        if (input.status) q = q.eq("status", input.status);
        const { data, error } = await q.order("order_index").limit(100);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data);
      }
      case "query_data_room": {
        let q = supabase.from("data_room_items").select("*");
        if (input.project_id) q = q.eq("project_id", input.project_id);
        if (input.priority) q = q.eq("priority", input.priority);
        if (input.is_received !== undefined) q = q.eq("is_received", input.is_received);
        const { data, error } = await q.order("order_index").limit(100);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data);
      }
      case "query_report_section": {
        let q = supabase.from("report_sections").select("*").eq("project_id", input.project_id);
        if (input.section_key) q = q.eq("section_key", input.section_key);
        const { data, error } = await q.order("order_index").limit(20);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data);
      }
      case "query_cross_deal": {
        const { data: projects } = await supabase.from("projects").select("id, fund_name, composite_score, recommendation, score_tier, asset_class, module_scores").order("created_at", { ascending: false });
        if (input.metric === "flags") {
          const { data: flags } = await supabase.from("red_flags").select("project_id, severity");
          return JSON.stringify({ projects, flags });
        }
        return JSON.stringify(projects);
      }
      case "query_documents": {
        const { data, error } = await supabase.from("documents").select("*").eq("project_id", input.project_id);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data);
      }
      case "search_documents": {
        if (!OPENAI_API_KEY) return JSON.stringify({ error: "OPENAI_API_KEY not configured for semantic search" });
        
        // Generate query embedding using OpenAI text-embedding-3-small
        const embResp = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "text-embedding-3-small",
            input: input.query,
          }),
        });
        
        if (!embResp.ok) {
          const errText = await embResp.text();
          return JSON.stringify({ error: `Embedding error: ${embResp.status} ${errText}` });
        }
        
        const embData = await embResp.json();
        const queryEmbedding = embData.data[0].embedding;
        
        // Search knowledge graph using pgvector similarity
        const { data: graphResults, error: searchError } = await supabase.rpc("search_knowledge_graph", {
          query_embedding: `[${queryEmbedding.join(",")}]`,
          match_threshold: 0.6,
          match_count: 15,
          filter_project_id: input.project_id || null,
        });
        
        if (searchError) return JSON.stringify({ error: searchError.message });
        if (!graphResults || graphResults.length === 0) {
          return JSON.stringify({ results: [], note: "No matching knowledge graph nodes found." });
        }
        
        // Optionally fetch relationships for top results
        const includeRels = input.include_relationships !== false;
        let relationships: any[] = [];
        
        if (includeRels && graphResults.length > 0) {
          const nodeIds = graphResults.slice(0, 8).map((r: any) => r.id);
          
          // Get edges where these nodes are source or target
          const { data: edgesOut } = await supabase
            .from("knowledge_edges")
            .select("relationship_type, weight, target_node_id, properties")
            .in("source_node_id", nodeIds)
            .limit(50);
          
          const { data: edgesIn } = await supabase
            .from("knowledge_edges")
            .select("relationship_type, weight, source_node_id, properties")
            .in("target_node_id", nodeIds)
            .limit(50);
          
          // Get connected node labels
          const connectedIds = [
            ...(edgesOut || []).map((e: any) => e.target_node_id),
            ...(edgesIn || []).map((e: any) => e.source_node_id),
          ].filter((id) => !nodeIds.includes(id));
          
          const uniqueConnectedIds = [...new Set(connectedIds)];
          let connectedNodes: Record<string, any> = {};
          
          if (uniqueConnectedIds.length > 0) {
            const { data: connected } = await supabase
              .from("knowledge_nodes")
              .select("id, label, node_type, summary")
              .in("id", uniqueConnectedIds.slice(0, 30));
            
            for (const cn of connected || []) {
              connectedNodes[cn.id] = cn;
            }
          }
          
          // Also index result nodes for label lookup
          for (const r of graphResults) {
            connectedNodes[r.id] = { label: r.label, node_type: r.node_type };
          }
          
          relationships = [
            ...(edgesOut || []).map((e: any) => ({
              from: connectedNodes[nodeIds.find((id: string) => true)]?.label, // simplified
              type: e.relationship_type,
              to: connectedNodes[e.target_node_id]?.label || "unknown",
              to_type: connectedNodes[e.target_node_id]?.node_type || "unknown",
              weight: e.weight,
            })),
            ...(edgesIn || []).map((e: any) => ({
              from: connectedNodes[e.source_node_id]?.label || "unknown",
              from_type: connectedNodes[e.source_node_id]?.node_type || "unknown",
              type: e.relationship_type,
              to: "matched node",
              weight: e.weight,
            })),
          ];
        }
        
        return JSON.stringify({
          results: graphResults.map((r: any) => ({
            node_type: r.node_type,
            label: r.label,
            summary: r.summary,
            properties: r.properties,
            depth_level: r.depth_level,
            similarity: r.similarity?.toFixed(3),
            source_table: r.source_table,
          })),
          relationships: relationships.slice(0, 20),
          total_matches: graphResults.length,
        });
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (e) {
    return JSON.stringify({ error: e instanceof Error ? e.message : "Tool execution failed" });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, model = "sonnet-4", project_id, conversation_id } = await req.json();

    // Get project context if scoped
    let projectContext = null;
    if (project_id) {
      const { data } = await supabase.from("projects").select("*").eq("id", project_id).single();
      projectContext = data;
    }

    const systemPrompt = buildSystemPrompt(projectContext);
    const modelId = MODEL_MAP[model] || MODEL_MAP["sonnet-4"];

    // Build Anthropic messages (convert from our format)
    const anthropicMessages = messages.map((m: any) => ({
      role: m.role === "system" ? "user" : m.role,
      content: m.content,
    }));

    // Initial Anthropic API call with streaming
    const startTime = Date.now();

    const makeAnthropicCall = async (msgs: any[], pendingToolResults?: any[]) => {
      const body: any = {
        model: modelId,
        max_tokens: 16000,
        system: systemPrompt,
        messages: pendingToolResults ? [...msgs, ...pendingToolResults] : msgs,
        tools,
        stream: true,
      };

      // Enable extended thinking for Sonnet
      if (modelId.includes("sonnet")) {
        body.thinking = {
          type: "enabled",
          budget_tokens: 10000,
        };
        body.temperature = 1; // Required for extended thinking
      }

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error("Anthropic error:", resp.status, errorText);
        throw new Error(`Anthropic API error: ${resp.status} ${errorText}`);
      }

      return resp;
    };

    // We'll use a TransformStream to process Anthropic SSE and forward our own events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        try {
          let allMessages = [...anthropicMessages];
          let fullContent = "";
          let fullThinking = "";
          let allToolCalls: any[] = [];
          let tokensInput = 0;
          let tokensOutput = 0;
          let continueLoop = true;

          while (continueLoop) {
            continueLoop = false;
            const resp = await makeAnthropicCall(allMessages);
            const reader = resp.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let currentToolName = "";
            let currentToolId = "";
            let currentToolInput = "";
            let pendingToolUses: any[] = [];

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
                    case "message_start":
                      if (event.message?.usage) {
                        tokensInput += event.message.usage.input_tokens || 0;
                      }
                      break;

                    case "content_block_start":
                      if (event.content_block?.type === "thinking") {
                        send("thinking_start", {});
                      } else if (event.content_block?.type === "tool_use") {
                        currentToolName = event.content_block.name;
                        currentToolId = event.content_block.id;
                        currentToolInput = "";
                        send("tool_start", { name: currentToolName, id: currentToolId });
                      }
                      break;

                    case "content_block_delta":
                      if (event.delta?.type === "thinking_delta") {
                        fullThinking += event.delta.thinking;
                        send("thinking_delta", { text: event.delta.thinking });
                      } else if (event.delta?.type === "text_delta") {
                        fullContent += event.delta.text;
                        send("content_delta", { text: event.delta.text });
                      } else if (event.delta?.type === "input_json_delta") {
                        currentToolInput += event.delta.partial_json;
                      }
                      break;

                    case "content_block_stop":
                      if (currentToolName) {
                        let parsedInput = {};
                        try { parsedInput = JSON.parse(currentToolInput); } catch {}
                        pendingToolUses.push({
                          id: currentToolId,
                          name: currentToolName,
                          input: parsedInput,
                        });
                        currentToolName = "";
                        currentToolId = "";
                        currentToolInput = "";
                      }
                      break;

                    case "message_delta":
                      if (event.usage) {
                        tokensOutput += event.usage.output_tokens || 0;
                      }
                      if (event.delta?.stop_reason === "tool_use" && pendingToolUses.length > 0) {
                        // Execute all pending tools in parallel
                        const toolResults = await Promise.all(
                          pendingToolUses.map(async (tu) => {
                            send("tool_executing", { name: tu.name, id: tu.id });
                            const result = await executeTool(tu.name, tu.input);
                            const toolCall = { name: tu.name, input: tu.input, output: JSON.parse(result) };
                            allToolCalls.push(toolCall);
                            send("tool_complete", { name: tu.name, id: tu.id, resultSummary: `${JSON.parse(result)?.length || 0} results` });
                            return { type: "tool_result", tool_use_id: tu.id, content: result };
                          })
                        );

                        // Add assistant message with tool_use blocks and tool results
                        allMessages.push({
                          role: "assistant",
                          content: pendingToolUses.map((tu) => ({
                            type: "tool_use",
                            id: tu.id,
                            name: tu.name,
                            input: tu.input,
                          })),
                        });
                        allMessages.push({ role: "user", content: toolResults });

                        pendingToolUses = [];
                        continueLoop = true;
                      }
                      break;
                  }
                } catch {
                  // Ignore parse errors
                }
              }
            }
          }

          const durationMs = Date.now() - startTime;

          // Save to database
          if (conversation_id) {
            await supabase.from("chat_messages").insert({
              conversation_id,
              role: "assistant",
              content: fullContent,
              thinking_content: fullThinking || null,
              tool_calls: allToolCalls.length > 0 ? allToolCalls : null,
              model_used: modelId,
              tokens_input: tokensInput,
              tokens_output: tokensOutput,
              duration_ms: durationMs,
            });
          }

          send("message_complete", {
            tokens_input: tokensInput,
            tokens_output: tokensOutput,
            duration_ms: durationMs,
          });

          controller.close();
        } catch (e) {
          console.error("Stream error:", e);
          const send = (event: string, data: any) => {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          };
          send("error", { message: e instanceof Error ? e.message : "Unknown error" });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("chat-completion error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
