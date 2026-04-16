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
- At least one structured data tool (scores, flags, team, fees, performance, etc.)
- The search_documents RAG tool for semantic/graph context when the question involves "why", analysis rationale, or needs deeper context
NEVER call tools sequentially when they can run in parallel. The system executes all tool calls concurrently.

### Phase 2: SYNTHESIS
After receiving all tool results, synthesize findings into a unified response. Cross-reference structured data against graph/RAG findings. Surface contradictions, confirmations, and novel connections.

## AVAILABLE DATA — FULL APP COVERAGE
You have access to EVERY data point in the Nvestiv platform:
- **Deals & Scores**: Composite scores, module-level scores (A-E), recommendations, score tiers
- **Team & Governance**: All team members, roles, verification status, adverse findings, key person flags, service providers
- **Performance & Track Record**: All performance metrics (returns, risk, portfolio characteristics), benchmarks, alpha
- **Fee Structure**: Fee components by share class, assessments, asset class norms, disclosure status
- **Realized Exits**: Engagement case studies, exit multiples, outcome statuses
- **Strategy & Thesis**: Thesis validations (verified/contradicted/unverified), claim sources
- **Competitive Landscape**: Competitors, types (direct/indirect), AUM, differentiation
- **Market Dynamics**: Market factors (tailwinds/headwinds), confidence levels, time horizons
- **Red Flags**: All flags with severity, module source, implications, resolutions
- **Interrogatory**: Diligence questions, priorities, rationale, GP responses
- **Data Room**: Document checklist, priority tiers, received/reviewed status
- **Source Documents**: Uploaded files, classifications, quality notes
- **Research Sources**: Web sources, citations, excerpts linked to team members and sections
- **Report Sections**: Full narrative analysis by module
- **Module Scores**: Detailed scoring with weights, confidence, and rationale
- **Knowledge Graph**: Semantic search across all entities, relationships, and concepts

## TOOL SELECTION GUIDE
- Questions about people, leadership, governance → query_team_members + search_documents
- Questions about fees, economics, costs → query_fee_structure
- Questions about returns, performance, track record → query_performance_metrics + query_exits
- Questions about strategy, thesis, investment approach → query_thesis_validations + query_market_factors
- Questions about competition → query_competitive_landscape
- Questions about risks, concerns, flags → query_red_flags + query_critical_gaps
- Questions about due diligence process → query_interrogatory + query_data_room
- Questions about WHY a decision/score/assessment was made → query_report_section + query_module_scores + search_documents
- Questions about sources, evidence → query_research_sources + query_documents
- Cross-deal comparisons → query_cross_deal
- Open-ended or "tell me about..." → search_documents + relevant structured tools

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
    if (projectContext.strategy) base += ` Strategy: ${projectContext.strategy}.`;
    if (projectContext.gp_entity_name) base += ` GP: ${projectContext.gp_entity_name}.`;
    base += ` project_id: ${projectContext.id}. Use this for all tool calls unless the user asks about other deals.`;
  } else {
    base += `\n\nGlobal mode — user may ask about any deal. Use cross-deal tools for comparisons.`;
  }

  return base;
}

const tools = [
  {
    name: "query_deal_scores",
    description: "Query the projects table for deal scores, recommendations, module_scores, metadata, executive summary, key strengths/risks, and conditions for advancement. Can filter by project_id for a specific deal or return all deals.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Optional. Filter to a specific project UUID." },
      },
    },
  },
  {
    name: "query_module_scores",
    description: "Query detailed module-level scores (A through E) with weights, confidence ratings, rationale, and summary assessments for a project. Essential for understanding WHY a composite score was given.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Required project UUID" },
      },
      required: ["project_id"],
    },
  },
  {
    name: "query_team_members",
    description: "Query all team members for a project including their roles, titles, years of experience, education, prior affiliations, verification status, adverse findings, key person flags, and assessment ratings.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Required project UUID" },
        is_key_person: { type: "boolean", description: "Optional: filter to key persons only" },
      },
      required: ["project_id"],
    },
  },
  {
    name: "query_service_providers",
    description: "Query service providers (auditors, administrators, legal counsel, custodians) for a project. Includes verification status, importance level, and disclosure status.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Required project UUID" },
      },
      required: ["project_id"],
    },
  },
  {
    name: "query_performance_metrics",
    description: "Query all performance metrics including returns (IRR, TVPI, DPI, MOIC), risk metrics, portfolio characteristics. Includes fund values, benchmark comparisons, and alpha calculations.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Required project UUID" },
        metric_category: { type: "string", description: "Optional: return, risk, or portfolio_characteristic" },
      },
      required: ["project_id"],
    },
  },
  {
    name: "query_fee_structure",
    description: "Query fee structure broken down by share class. Includes management fees, performance fees, hurdle rates, etc. with assessment ratings (at_market, above_market, below_market), asset class norms, and disclosure status.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Required project UUID" },
      },
      required: ["project_id"],
    },
  },
  {
    name: "query_exits",
    description: "Query realized exits / engagement case studies including company names, sectors, exit multiples, investment theses, market validation, and outcome verification status.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Required project UUID" },
      },
      required: ["project_id"],
    },
  },
  {
    name: "query_thesis_validations",
    description: "Query investment thesis validation items. Each claim has a validation status (verified/partially_verified/unverified/contradicted), confidence level, claim source, and validation detail explaining the assessment.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Required project UUID" },
      },
      required: ["project_id"],
    },
  },
  {
    name: "query_competitive_landscape",
    description: "Query competitive landscape analysis including competitor names, types (direct/indirect/adjacent), AUM, strategy descriptions, differentiation vs the fund, and competitive assessments.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Required project UUID" },
      },
      required: ["project_id"],
    },
  },
  {
    name: "query_market_factors",
    description: "Query market factors including tailwinds and headwinds with confidence levels, time horizons, supporting data, and descriptions. Essential for understanding market dynamics around a fund's strategy.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Required project UUID" },
        factor_type: { type: "string", description: "Optional: tailwind or headwind" },
      },
      required: ["project_id"],
    },
  },
  {
    name: "query_red_flags",
    description: "Query red flags for deals. Can filter by project_id, severity (critical/elevated/monitor), and module. Includes issue descriptions, implications, resolutions, and linked interrogatory/data room items.",
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
    name: "query_critical_gaps",
    description: "Query critical information gaps — missing data that impacts the analysis quality. Includes severity, related module, and descriptions.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Required project UUID" },
      },
      required: ["project_id"],
    },
  },
  {
    name: "query_interrogatory",
    description: "Query interrogatory/diligence questions. Can filter by project_id, priority, and status. Includes rationale, source module, and GP response data.",
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
    description: "Query data room checklist items. Can filter by project_id, priority, and received status. Includes purpose, source module, sub-items, and reviewer notes.",
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
    description: "Fetch report section narrative content by section_key. These contain the detailed written analysis for each module. Use to understand WHY assessments were made.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Required project UUID" },
        section_key: { type: "string", description: "Section key like executive_summary, module_a, module_b, module_c, module_d, module_e, conclusion, flags, meeting_conditions, meeting_questions" },
      },
      required: ["project_id"],
    },
  },
  {
    name: "query_research_sources",
    description: "Query research sources — web references, regulatory filings, LinkedIn profiles, etc. used to verify claims. Includes URLs, excerpts, source categories, and links to team members and report sections.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Required project UUID" },
        source_category: { type: "string", description: "Optional: regulatory, corporate, social_media, news, registry, etc." },
      },
      required: ["project_id"],
    },
  },
  {
    name: "query_documents",
    description: "List uploaded source documents and their metadata including classifications, page counts, quality notes, and dates.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Required project UUID" },
      },
      required: ["project_id"],
    },
  },
  {
    name: "query_cross_deal",
    description: "Aggregate data across all projects for comparative analysis. Returns all projects with their scores, recommendations, and optionally flag counts.",
    input_schema: {
      type: "object",
      properties: {
        metric: { type: "string", description: "What to compare: scores, flags, recommendations, asset_classes" },
      },
      required: ["metric"],
    },
  },
  {
    name: "search_documents",
    description: "Semantic search over the knowledge graph using vector similarity. Returns relevant entities, concepts, people, risks, and their relationships. Use this for open-ended questions, finding connections, understanding rationale behind decisions, or when structured tools don't cover the query.",
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
        let q = supabase.from("projects").select("id, fund_name, composite_score, recommendation, score_tier, asset_class, module_scores, established_year, vintage, status, strategy, gp_entity_name, fund_size_estimated, domicile, regulatory_status, key_strengths, key_risks, conditions_for_advancement, executive_summary_narrative, final_assessment_narrative, recommended_timeline, completeness_score, created_at");
        if (input.project_id) q = q.eq("id", input.project_id);
        const { data, error } = await q.order("created_at", { ascending: false }).limit(50);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data);
      }
      case "query_module_scores": {
        const { data, error } = await supabase.from("module_scores").select("*").eq("project_id", input.project_id).order("order_index");
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data);
      }
      case "query_team_members": {
        let q = supabase.from("team_members").select("*").eq("project_id", input.project_id);
        if (input.is_key_person !== undefined) q = q.eq("is_key_person", input.is_key_person);
        const { data, error } = await q.order("order_index");
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data);
      }
      case "query_service_providers": {
        const { data, error } = await supabase.from("service_providers").select("*").eq("project_id", input.project_id);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data);
      }
      case "query_performance_metrics": {
        let q = supabase.from("performance_metrics").select("*").eq("project_id", input.project_id);
        if (input.metric_category) q = q.eq("metric_category", input.metric_category);
        const { data, error } = await q.order("order_index");
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data);
      }
      case "query_fee_structure": {
        const { data, error } = await supabase.from("fee_structure").select("*").eq("project_id", input.project_id).order("order_index");
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data);
      }
      case "query_exits": {
        const { data, error } = await supabase.from("engagement_case_studies").select("*").eq("project_id", input.project_id).order("order_index");
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data);
      }
      case "query_thesis_validations": {
        const { data, error } = await supabase.from("thesis_validations").select("*").eq("project_id", input.project_id).order("order_index");
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data);
      }
      case "query_competitive_landscape": {
        const { data, error } = await supabase.from("competitive_landscape").select("*").eq("project_id", input.project_id).order("order_index");
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data);
      }
      case "query_market_factors": {
        let q = supabase.from("market_factors").select("*").eq("project_id", input.project_id);
        if (input.factor_type) q = q.eq("factor_type", input.factor_type);
        const { data, error } = await q.order("order_index");
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data);
      }
      case "query_red_flags": {
        let q = supabase.from("red_flags").select("*");
        if (input.project_id) q = q.eq("project_id", input.project_id);
        if (input.severity) q = q.eq("severity", input.severity);
        if (input.module) q = q.eq("module", input.module);
        const { data, error } = await q.order("order_index").limit(100);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data);
      }
      case "query_critical_gaps": {
        const { data, error } = await supabase.from("critical_info_gaps").select("*").eq("project_id", input.project_id).order("order_index");
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
      case "query_research_sources": {
        let q = supabase.from("research_sources").select("*").eq("project_id", input.project_id);
        if (input.source_category) q = q.eq("source_category", input.source_category);
        const { data, error } = await q.order("added_at", { ascending: false }).limit(100);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data);
      }
      case "query_documents": {
        const { data, error } = await supabase.from("documents").select("*").eq("project_id", input.project_id);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data);
      }
      case "query_cross_deal": {
        const { data: projects } = await supabase.from("projects").select("id, fund_name, composite_score, recommendation, score_tier, asset_class, module_scores, strategy, gp_entity_name").order("created_at", { ascending: false });
        if (input.metric === "flags") {
          const { data: flags } = await supabase.from("red_flags").select("project_id, severity");
          return JSON.stringify({ projects, flags });
        }
        return JSON.stringify(projects);
      }
      case "search_documents": {
        if (!OPENAI_API_KEY) return JSON.stringify({ error: "OPENAI_API_KEY not configured for semantic search" });
        
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
        
        const includeRels = input.include_relationships !== false;
        let relationships: any[] = [];
        
        if (includeRels && graphResults.length > 0) {
          const nodeIds = graphResults.slice(0, 8).map((r: any) => r.id);
          
          const { data: edgesOut } = await supabase
            .from("knowledge_edges")
            .select("relationship_type, weight, source_node_id, target_node_id, properties")
            .in("source_node_id", nodeIds)
            .limit(50);
          
          const { data: edgesIn } = await supabase
            .from("knowledge_edges")
            .select("relationship_type, weight, source_node_id, target_node_id, properties")
            .in("target_node_id", nodeIds)
            .limit(50);
          
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
          
          for (const r of graphResults) {
            connectedNodes[r.id] = { label: r.label, node_type: r.node_type };
          }
          
          relationships = [
            ...(edgesOut || []).map((e: any) => ({
              from: connectedNodes[e.source_node_id]?.label || "unknown",
              from_type: connectedNodes[e.source_node_id]?.node_type || "unknown",
              type: e.relationship_type,
              to: connectedNodes[e.target_node_id]?.label || "unknown",
              to_type: connectedNodes[e.target_node_id]?.node_type || "unknown",
              weight: e.weight,
            })),
            ...(edgesIn || []).map((e: any) => ({
              from: connectedNodes[e.source_node_id]?.label || "unknown",
              from_type: connectedNodes[e.source_node_id]?.node_type || "unknown",
              type: e.relationship_type,
              to: connectedNodes[e.target_node_id]?.label || "unknown",
              to_type: connectedNodes[e.target_node_id]?.node_type || "unknown",
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

    const anthropicMessages = messages.map((m: any) => ({
      role: m.role === "system" ? "user" : m.role,
      content: m.content,
    }));

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

      if (modelId.includes("sonnet")) {
        body.thinking = {
          type: "enabled",
          budget_tokens: 10000,
        };
        body.temperature = 1;
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
                        const toolResults = await Promise.all(
                          pendingToolUses.map(async (tu) => {
                            send("tool_executing", { name: tu.name, id: tu.id });
                            const result = await executeTool(tu.name, tu.input);
                            const toolCall = { name: tu.name, input: tu.input, output: JSON.parse(result) };
                            allToolCalls.push(toolCall);
                            const parsed = JSON.parse(result);
                            const summary = Array.isArray(parsed) ? `${parsed.length} results` : parsed.total_matches ? `${parsed.total_matches} matches` : "done";
                            send("tool_complete", { name: tu.name, id: tu.id, resultSummary: summary });
                            return { type: "tool_result", tool_use_id: tu.id, content: result };
                          })
                        );

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
