import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ODD report section keys (must mirror src/lib/odd-template.ts)
const ODD_SECTION_KEYS = [
  "firm_stability",
  "staffing",
  "people_process_systems",
  "fund_terms",
  "discrepancy_register",
  "sources_appendix",
] as const;
const ODD_SECTION_TITLES: Record<string, string> = {
  firm_stability: "Firm Stability",
  staffing: "Staffing",
  people_process_systems: "People / Process / Systems",
  fund_terms: "Fund Terms",
  discrepancy_register: "Discrepancy Register",
  sources_appendix: "Sources & Appendix",
};

// Shared additions appended to every system prompt.
const CHART_FENCE_INSTRUCTIONS = `

## RICH CANVAS BLOCKS — animated chart fences
When writing markdown to the canvas (via edit_memo / edit_odd_section), you can embed an
animated SVG chart by emitting a fenced code block with language \`chart\` whose body is JSON:

\`\`\`chart
{
  "type": "bar",           // bar | line | area | pie | donut
  "title": "...",          // optional
  "subtitle": "...",       // optional
  "xLabel": "Year",        // optional
  "yLabel": "Net IRR (%)", // optional
  "palette": "mono",       // mono | signal
  "data": [
    { "label": "2021", "value": 18.2 },
    { "label": "2022", "value": 12.4 }
  ]
}
\`\`\`

For multi-series charts use multiple numeric keys per row, e.g.
\`{ "label": "2021", "fund": 18.2, "benchmark": 11.0 }\`.

If the user asks for a chart, graph, plot, visualization, "show me X", or any visual
depiction of numeric data: insert a chart fence directly into the relevant section using
the appropriate edit operation. NEVER paste the raw chart JSON or instructions into the
chat — the chart belongs in the canvas.`;

const CHAT_CLARIFY_INSTRUCTIONS = `

## CLARIFICATION UI
When the user's request is ambiguous, prefer asking via interactive UI tools instead of
plain prose questions:
- \`ask_quick_reply\` — for a single question with 2–5 discrete options (renders chips).
- \`ask_form\`        — for multi-field clarifications (renders a real form).
After calling one of these tools, do NOT generate additional prose — wait for the user's
next message which will carry their answer. Use these sparingly; only when truly needed.`;

// Map legacy model aliases (used by the client) to Gemini model IDs.
// Memo mode wants the fastest possible model; chat mode can take a slightly stronger one.
const MODEL_MAP: Record<string, string> = {
  "sonnet-4": "claude-sonnet-4-5-20250929",
  "haiku-3.5": "claude-3-5-haiku-20241022",
  "gemini-flash": "claude-sonnet-4-5-20250929",
  "gemini-flash-lite": "claude-3-5-haiku-20241022",
  "gemini-pro": "claude-sonnet-4-5-20250929",
};

function buildSystemPrompt(
  projectContext?: any,
  memoContext?: { id: string; markdown: string } | null,
  oddContext?: { projectId: string; sections: { key: string; title: string; content: string }[] } | null,
) {
  // FAST PATH: in ODD mode, single-purpose tool + tight prompt.
  if (oddContext) {
    let oddBase = `You are Iris, co-authoring an ADIA Operational Due Diligence (ODD) report. You have direct write access to the report sections via the \`edit_odd_section\` tool.

## RULES (ODD mode)
- For ANY user request to draft / write / add / append / prepend / tighten / rewrite / restructure / expand / shorten / change ANY part of the report: call \`edit_odd_section\` immediately. Do not explain first, do not ask permission, do not say "I'll do that" — just call the tool.
- Never refuse or defer canvas edits. Never tell the user to edit it themselves. Do NOT mention IC memos — this is an ODD report.
- Operations: \`replace_section\`, \`append_to_section\`, \`prepend_to_section\`. Match \`section_key\` exactly to one of the six allowed keys.
- After the edit succeeds, reply with ONE short sentence summarizing what changed.
- For pure questions about the report content, answer directly without calling tools.

## Section keys (use these exact values)
${ODD_SECTION_KEYS.map((k) => `- \`${k}\` — ${ODD_SECTION_TITLES[k]}`).join("\n")}

If the user asks for a generic addition (e.g. "add a footer") that doesn't name a section, append to \`sources_appendix\`.`;

    if (projectContext) {
      oddBase += `\n\nFund: "${projectContext.fund_name}" (project_id: ${projectContext.id}).`;
    }

    // Tight per-section excerpts (1.2k chars each — enough for orientation, full body fetched on edit).
    oddBase += `\n\n## Current report sections (truncated)\n\n`;
    for (const s of oddContext.sections) {
      oddBase += `### ${s.title} (\`${s.key}\`)\n\n\`\`\`markdown\n${(s.content || "").slice(0, 1200)}\n\`\`\`\n\n`;
    }
    return oddBase + CHART_FENCE_INSTRUCTIONS + CHAT_CLARIFY_INSTRUCTIONS;
  }

  // FAST PATH: in IC Memo mode we want minimal prompt + single-purpose tool to keep TTFT low.
  if (memoContext) {
    let memoBase = `You are Iris, co-authoring an IC memo. You have direct write access to the canvas via the \`edit_memo\` tool.

## RULES (memo mode)
- For ANY user request to draft / write / add / append / prepend / insert / tighten / rewrite / restructure / expand / shorten / change ANY part of the memo: call \`edit_memo\` immediately. Do not explain first, do not ask permission, do not say "I'll do that" — just call the tool.
- Never refuse or defer canvas edits. Never tell the user to edit it themselves.
- Operations: \`replace_section\`, \`append_to_section\`, \`prepend_to_section\`, \`insert_section_after\`, \`replace_all\`. Match section_heading case-insensitively against existing H2 headings.
- After the edit succeeds, reply with ONE short sentence summarizing what changed. Do not paste the new content back.
- For pure questions about the memo content, answer directly without calling tools.`;

    if (projectContext) {
      memoBase += `\n\nFund: "${projectContext.fund_name}" (project_id: ${projectContext.id}).`;
    }

    // Keep memo context tight — 4k chars is enough to identify sections; full content is fetched fresh on every edit_memo call.
    memoBase += `\n\n## Current memo (markdown, truncated)\n\n\`\`\`markdown\n${memoContext.markdown.slice(0, 4000)}\n\`\`\``;
    return memoBase + CHART_FENCE_INSTRUCTIONS + CHAT_CLARIFY_INSTRUCTIONS;
  }

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

  return base + CHAT_CLARIFY_INSTRUCTIONS + PAGE_EDIT_INSTRUCTIONS;
}

const PAGE_EDIT_INSTRUCTIONS = `

## PAGE CONTENT — READ + PROPOSE EDITS
You have agentic access to the prose content of every GP page in this app
(raises overview/interview/DDQ/dataroom/feedback/report-card/pipeline,
global pipeline, contacts, settings, raise list). The user's CURRENT page
and its editable blocks are injected at the bottom of this prompt under
"CURRENT PAGE BLOCKS".

Tools:
- \`list_page_blocks({ page_key? })\` — discover blocks on any page.
- \`read_page_block({ page_key, section_key, raise_id? })\` — full content of a block.
- \`search_page_content({ query, page_key? })\` — substring search across all pages.
- \`propose_page_edit({ page_key, section_key, raise_id?, proposed_text, rationale, label? })\`
  — propose a new value for a block. The user reviews + applies; you never
  write directly. Use the EXACT page_key and section_key from the manifest
  or from list_page_blocks — never invent them.

Rules:
- When the user asks to change / rewrite / tighten / shorten / expand any
  visible prose on the current page, call \`propose_page_edit\` immediately
  with the active page_key + raise_id. Reply with one short sentence
  saying you proposed the change.
- When the user asks "what does this page say about X" or "where did we
  mention Y", use \`search_page_content\` or read the manifest first.
- Never propose edits to blocks that aren't in the manifest or returned by
  list_page_blocks. If the user asks for something structural (new card,
  new tab, new table column), explain that you can only change the text of
  existing blocks.
- Default scope is the user's current page. Only operate on other pages
  when explicitly asked.`;

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
  {
    name: "edit_memo",
    description: "Edit the IC memo canvas directly. Use this for ANY user request to draft, write, add, append, prepend, insert, tighten, rewrite, restructure, expand, shorten, or otherwise modify the memo — including titles, paragraphs, bullets, tables, footnotes, and appendix items. Edits persist to the database and stream live to the user's canvas. Never refuse or defer canvas edits.",
    input_schema: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: ["replace_section", "append_to_section", "prepend_to_section", "insert_section_after", "replace_all"],
          description: "How to apply the edit.",
        },
        section_heading: {
          type: "string",
          description: "The H2 section heading to operate on (case-insensitive match). Required for all ops except replace_all.",
        },
        new_section_heading: {
          type: "string",
          description: "For insert_section_after: the heading text of the NEW section to insert.",
        },
        markdown: {
          type: "string",
          description: "The markdown body to write. For replace_section/append/prepend this is the section body (no leading H2). For insert_section_after this is the new section body. For replace_all this is the entire memo.",
        },
      },
      required: ["operation", "markdown"],
    },
  },
  {
    name: "edit_odd_section",
    description: "Edit a section of the ADIA Operational Due Diligence (ODD) report. Use this for ANY user request to draft, write, add, append, prepend, tighten, rewrite, restructure, expand, shorten, or otherwise modify the ODD report — including section bodies, paragraphs, tables, and footers. Edits persist immediately and stream live to the user's canvas via realtime. Never refuse or defer.",
    input_schema: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: ["replace_section", "append_to_section", "prepend_to_section"],
          description: "How to apply the edit within the target section body.",
        },
        section_key: {
          type: "string",
          enum: [
            "firm_stability",
            "staffing",
            "people_process_systems",
            "fund_terms",
            "discrepancy_register",
            "sources_appendix",
          ],
          description: "Which ODD report section to edit. Must match exactly.",
        },
        markdown: {
          type: "string",
          description: "The markdown content to write. Do NOT include the section's H2 heading — that is rendered separately. Just write the body.",
        },
      },
      required: ["operation", "section_key", "markdown"],
    },
  },
];

// Page content tools: read + propose edits to GP page prose blocks.
const PAGE_CONTENT_TOOLS = [
  {
    name: "list_page_blocks",
    description: "List all editable prose blocks across GP pages, optionally filtered by page_key. Returns each block's page_key, raise_id, section_key, label, and current text. Use this when the user asks about content on a page other than the current one, or to discover what's editable.",
    input_schema: {
      type: "object",
      properties: {
        page_key: { type: "string", description: "Optional page filter, e.g. 'gp.raise.overview'." },
        raise_id: { type: "string", description: "Optional raise filter for raise-scoped pages." },
      },
    },
  },
  {
    name: "read_page_block",
    description: "Read the full current text of a single editable page block.",
    input_schema: {
      type: "object",
      properties: {
        page_key: { type: "string" },
        section_key: { type: "string" },
        raise_id: { type: "string", description: "Required for raise-scoped pages." },
      },
      required: ["page_key", "section_key"],
    },
  },
  {
    name: "search_page_content",
    description: "Substring search across the text of every editable page block. Use to answer 'where did we say X' or 'find the page that mentions Y'.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string" },
        page_key: { type: "string", description: "Optional page filter." },
      },
      required: ["query"],
    },
  },
  {
    name: "propose_page_edit",
    description: "Propose a new value for an editable page block. The proposal is shown to the user in a floating banner with Apply/Reject. You never write directly. Use ONLY page_key + section_key values from the manifest or list_page_blocks.",
    input_schema: {
      type: "object",
      properties: {
        page_key: { type: "string" },
        section_key: { type: "string" },
        raise_id: { type: "string" },
        proposed_text: { type: "string", description: "The full replacement text for the block." },
        rationale: { type: "string", description: "One sentence explaining why this edit improves the page." },
        label: { type: "string", description: "Optional human label for the block (mirrors what the page registered)." },
      },
      required: ["page_key", "section_key", "proposed_text", "rationale"],
    },
  },
];

// Client-rendered clarification tools. These are deliberately exposed to ALL
// modes (chat, memo, odd). The server returns an immediate stub so the model
// stops, and the frontend renders the input as an interactive UI element.
const CLARIFY_TOOLS = [
  {
    name: "ask_quick_reply",
    description: "Ask the user a single clarifying question with 2–5 discrete answer chips. The chips are rendered as buttons in the chat; the user's tap becomes the next user message. Do not produce any other prose after calling this — wait for the user's answer.",
    input_schema: {
      type: "object",
      properties: {
        question: { type: "string", description: "The question to display above the chips." },
        options: {
          type: "array",
          items: { type: "string" },
          description: "2–5 short answer options.",
        },
      },
      required: ["question", "options"],
    },
  },
  {
    name: "ask_form",
    description: "Ask the user a structured multi-field clarification by rendering a form (text / number / select / radio inputs). Use only when multiple inputs are genuinely needed. The user's submission becomes the next user message. Do not produce any other prose after calling this.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Optional form title / preamble." },
        submitLabel: { type: "string", description: "Optional submit button label." },
        fields: {
          type: "array",
          description: "Form fields. Keep to 2–5 inputs.",
          items: {
            type: "object",
            properties: {
              key: { type: "string" },
              label: { type: "string" },
              type: { type: "string", enum: ["text", "number", "select", "radio"] },
              options: { type: "array", items: { type: "string" } },
              placeholder: { type: "string" },
              required: { type: "boolean" },
            },
            required: ["key", "label", "type"],
          },
        },
      },
      required: ["fields"],
    },
  },
];

function applyMemoEdit(
  currentMd: string,
  op: string,
  sectionHeading: string | undefined,
  newSectionHeading: string | undefined,
  newMd: string,
): { ok: boolean; markdown?: string; error?: string } {
  if (op === "replace_all") {
    return { ok: true, markdown: newMd };
  }
  if (!sectionHeading) {
    return { ok: false, error: "section_heading is required for this operation" };
  }

  // Split memo into sections by H2 (## ...). The first chunk before any H2 is the "intro" (title block).
  const lines = currentMd.split("\n");
  type Section = { heading: string; headingLine: string; body: string[]; startIdx: number };
  const sections: Section[] = [];
  let intro: string[] = [];
  let cur: Section | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) {
      if (cur) sections.push(cur);
      else intro = lines.slice(0, i);
      cur = { heading: m[1].trim(), headingLine: line, body: [], startIdx: i };
    } else if (cur) {
      cur.body.push(line);
    }
  }
  if (cur) sections.push(cur);
  if (sections.length === 0) intro = lines.slice();

  const target = sectionHeading.toLowerCase().trim();
  const idx = sections.findIndex((s) => s.heading.toLowerCase() === target);
  if (idx === -1 && op !== "insert_section_after") {
    return { ok: false, error: `Section "${sectionHeading}" not found. Existing sections: ${sections.map((s) => s.heading).join(" | ")}` };
  }

  if (op === "replace_section") {
    sections[idx] = { ...sections[idx], body: newMd.split("\n") };
  } else if (op === "append_to_section") {
    // Trim trailing blank lines, then add a single blank separator + new content
    const body = [...sections[idx].body];
    while (body.length && body[body.length - 1].trim() === "") body.pop();
    sections[idx] = { ...sections[idx], body: [...body, "", ...newMd.split("\n")] };
  } else if (op === "prepend_to_section") {
    sections[idx] = { ...sections[idx], body: [...newMd.split("\n"), "", ...sections[idx].body] };
  } else if (op === "insert_section_after") {
    const heading = (newSectionHeading || "New Section").trim();
    const newSec: Section = {
      heading,
      headingLine: `## ${heading}`,
      body: ["", ...newMd.split("\n")],
      startIdx: -1,
    };
    if (idx === -1) {
      sections.push(newSec);
    } else {
      sections.splice(idx + 1, 0, newSec);
    }
  } else {
    return { ok: false, error: `Unknown operation: ${op}` };
  }

  // Reassemble
  const out: string[] = [];
  if (intro.length) out.push(...intro);
  for (const s of sections) {
    if (out.length && out[out.length - 1].trim() !== "") out.push("");
    out.push(s.headingLine);
    out.push(...s.body);
  }
  return { ok: true, markdown: out.join("\n") };
}

async function executeTool(
  name: string,
  input: any,
  ctx: {
    memoId?: string | null;
    oddProjectId?: string | null;
    activePageKey?: string | null;
    activeRaiseId?: string | null;
    conversationId?: string | null;
  } = {},
): Promise<string> {
  try {
    switch (name) {
      case "list_page_blocks": {
        let q = supabase
          .from("page_content")
          .select("page_key, raise_id, section_key, label, content, schema_type")
          .limit(500);
        if (input.page_key) q = q.eq("page_key", input.page_key);
        if (input.raise_id) q = q.eq("raise_id", input.raise_id);
        const { data, error } = await q;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({
          blocks: (data || []).map((r: any) => ({
            page_key: r.page_key,
            raise_id: r.raise_id,
            section_key: r.section_key,
            label: r.label,
            text: r.content?.text ?? "",
          })),
          note: "Blocks not listed here may still exist in code with default text; ask the user or use the current manifest.",
        });
      }
      case "read_page_block": {
        let q = supabase
          .from("page_content")
          .select("page_key, raise_id, section_key, label, content")
          .eq("page_key", input.page_key)
          .eq("section_key", input.section_key);
        if (input.raise_id) q = q.eq("raise_id", input.raise_id);
        const { data, error } = await q.limit(1);
        if (error) return JSON.stringify({ error: error.message });
        const row = data?.[0];
        if (!row) return JSON.stringify({ found: false, note: "No DB override; in-code default is in use." });
        return JSON.stringify({ found: true, ...row, text: row.content?.text ?? "" });
      }
      case "search_page_content": {
        let q = supabase
          .from("page_content")
          .select("page_key, raise_id, section_key, label, content")
          .limit(500);
        if (input.page_key) q = q.eq("page_key", input.page_key);
        const { data, error } = await q;
        if (error) return JSON.stringify({ error: error.message });
        const needle = String(input.query || "").toLowerCase();
        const hits = (data || [])
          .map((r: any) => ({
            page_key: r.page_key,
            raise_id: r.raise_id,
            section_key: r.section_key,
            label: r.label,
            text: r.content?.text ?? "",
          }))
          .filter((b: any) => b.text.toLowerCase().includes(needle))
          .slice(0, 25);
        return JSON.stringify({ matches: hits.length, results: hits });
      }
      case "propose_page_edit": {
        const pageKey = input.page_key || ctx.activePageKey;
        const raiseId = input.raise_id ?? ctx.activeRaiseId ?? null;
        if (!pageKey || !input.section_key || !input.proposed_text) {
          return JSON.stringify({ error: "page_key, section_key, and proposed_text are required." });
        }
        // Snapshot current value from DB (if any).
        let currentText: string | null = null;
        {
          let q = supabase
            .from("page_content")
            .select("content")
            .eq("page_key", pageKey)
            .eq("section_key", input.section_key);
          if (raiseId) q = q.eq("raise_id", raiseId);
          const { data } = await q.limit(1);
          currentText = data?.[0]?.content?.text ?? null;
        }
        const { data: prop, error } = await supabase
          .from("page_edit_proposals")
          .insert({
            page_key: pageKey,
            raise_id: raiseId,
            section_key: input.section_key,
            label: input.label || null,
            current_content: currentText !== null ? { text: currentText } : null,
            proposed_content: { text: input.proposed_text },
            rationale: input.rationale || null,
            status: "pending",
            conversation_id: ctx.conversationId || null,
          })
          .select("id")
          .single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({
          success: true,
          proposal_id: prop?.id,
          page_key: pageKey,
          section_key: input.section_key,
          summary: "Proposal queued in the Iris suggestions banner — user will Apply or Reject.",
        });
      }
      case "ask_quick_reply":
      case "ask_form": {
        // Client-rendered tools. Return immediately so the model can stop
        // generating; the actual answer will arrive as the user's next turn.
        return JSON.stringify({
          success: true,
          awaiting_user: true,
          rendered: name,
          summary: "Awaiting user response",
        });
      }
      case "edit_odd_section": {
        if (!ctx.oddProjectId) {
          return JSON.stringify({ error: "No ODD report is currently open. edit_odd_section can only be used in the ODD workspace." });
        }
        const key = input.section_key;
        if (!ODD_SECTION_KEYS.includes(key)) {
          return JSON.stringify({ error: `Invalid section_key "${key}". Must be one of: ${ODD_SECTION_KEYS.join(", ")}` });
        }
        const { data: row, error: fetchErr } = await supabase
          .from("odd_section_results")
          .select("id, content_markdown")
          .eq("project_id", ctx.oddProjectId)
          .eq("section_key", key)
          .maybeSingle();
        if (fetchErr) {
          return JSON.stringify({ error: `Could not load section: ${fetchErr.message}` });
        }
        const current = row?.content_markdown || "";
        const incoming = input.markdown || "";
        let next: string;
        if (input.operation === "replace_section") {
          next = incoming;
        } else if (input.operation === "append_to_section") {
          next = current.trimEnd() + (current.trim() ? "\n\n" : "") + incoming;
        } else if (input.operation === "prepend_to_section") {
          next = incoming + (incoming.trim() ? "\n\n" : "") + current;
        } else {
          return JSON.stringify({ error: `Unknown operation: ${input.operation}` });
        }
        const { error: upErr } = await supabase
          .from("odd_section_results")
          .upsert(
            {
              project_id: ctx.oddProjectId,
              section_key: key,
              status: "complete" as const,
              content_markdown: next,
              verification_status: "verified" as const,
              flag_count: 0,
              error_message: null,
            },
            { onConflict: "project_id,section_key" },
          );
        if (upErr) {
          return JSON.stringify({ error: `Failed to save edit: ${upErr.message}` });
        }
        return JSON.stringify({
          success: true,
          operation: input.operation,
          section_key: key,
          section_title: ODD_SECTION_TITLES[key],
          summary: `${ODD_SECTION_TITLES[key]} updated (${input.operation})`,
        });
      }
      case "edit_memo": {
        if (!ctx.memoId) {
          return JSON.stringify({ error: "No memo is currently open. edit_memo can only be used in the IC Memo workspace." });
        }
        const { data: memoRow, error: fetchErr } = await supabase
          .from("ic_memos")
          .select("id, content_markdown, version")
          .eq("id", ctx.memoId)
          .maybeSingle();
        if (fetchErr || !memoRow) {
          return JSON.stringify({ error: `Could not load memo: ${fetchErr?.message || "not found"}` });
        }
        const currentMd = memoRow.content_markdown || "";
        const result = applyMemoEdit(
          currentMd,
          input.operation,
          input.section_heading,
          input.new_section_heading,
          input.markdown || "",
        );
        if (!result.ok) {
          return JSON.stringify({ error: result.error });
        }
        const nextVersion = (memoRow.version || 0) + 1;
        const { error: updateErr } = await supabase
          .from("ic_memos")
          .update({
            content_markdown: result.markdown,
            content_json: [], // clears so canvas re-seeds from markdown via realtime
            version: nextVersion,
          })
          .eq("id", memoRow.id);
        if (updateErr) {
          return JSON.stringify({ error: `Failed to save edit: ${updateErr.message}` });
        }
        return JSON.stringify({
          success: true,
          operation: input.operation,
          section: input.operation === "insert_section_after"
            ? input.new_section_heading
            : input.section_heading,
          version: nextVersion,
          summary: `Memo updated (${input.operation})`,
        });
      }
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

// ---------- Gemini helpers ----------

// Convert Anthropic-style tool schema (with input_schema) to Gemini functionDeclarations.
// Gemini does not accept `additionalProperties` and ignores other Anthropic-specific keys.
function toGeminiTools(toolList: any[]) {
  const sanitize = (schema: any): any => {
    if (!schema || typeof schema !== "object") return schema;
    const { additionalProperties, $schema, ...rest } = schema;
    if (rest.properties && typeof rest.properties === "object") {
      const cleanedProps: Record<string, any> = {};
      for (const [k, v] of Object.entries(rest.properties)) {
        cleanedProps[k] = sanitize(v);
      }
      rest.properties = cleanedProps;
    }
    if (rest.items) rest.items = sanitize(rest.items);
    return rest;
  };
  return [
    {
      functionDeclarations: toolList.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: sanitize(t.input_schema),
      })),
    },
  ];
}

// Convert chat history to Anthropic `messages` format.
// Anthropic uses { role: "user" | "assistant", content: string | ContentBlock[] }
function toAnthropicMessages(messages: any[]) {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));
}

function toAnthropicTools(toolList: any[]) {
  return toolList.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));
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

    const { messages, model, project_id, conversation_id, memo_id, odd_project_id, page_context } = await req.json();
    const activePageKey: string | null = page_context?.page_key || null;
    const activeRaiseId: string | null = page_context?.raise_id || null;
    const pageManifest = page_context?.manifest || null;

    // In edit modes, default to haiku for fast tool calls.
    const effectiveModel = model || (memo_id || odd_project_id ? "haiku-3.5" : "sonnet-4");

    // Get project context if scoped
    let projectContext = null;
    const effectiveProjectId = project_id || odd_project_id;
    if (effectiveProjectId) {
      const { data } = await supabase.from("projects").select("*").eq("id", effectiveProjectId).single();
      projectContext = data;
    }

    // Get memo context if in IC memo mode
    let memoContext: { id: string; markdown: string } | null = null;
    if (memo_id) {
      const { data } = await supabase
        .from("ic_memos")
        .select("id, content_markdown")
        .eq("id", memo_id)
        .maybeSingle();
      if (data) memoContext = { id: data.id, markdown: data.content_markdown || "" };
    }

    // Get ODD context if in ODD workspace
    let oddContext: { projectId: string; sections: { key: string; title: string; content: string }[] } | null = null;
    if (odd_project_id) {
      const { data } = await supabase
        .from("odd_section_results")
        .select("section_key, content_markdown")
        .eq("project_id", odd_project_id);
      const byKey = new Map((data || []).map((r: any) => [r.section_key, r.content_markdown || ""]));
      oddContext = {
        projectId: odd_project_id,
        sections: ODD_SECTION_KEYS.map((k) => ({
          key: k,
          title: ODD_SECTION_TITLES[k],
          content: byKey.get(k) || "",
        })),
      };
    }

    let systemPrompt = buildSystemPrompt(projectContext, memoContext, oddContext);
    if (!memoContext && !oddContext && pageManifest?.page_key) {
      systemPrompt += `\n\n## CURRENT PAGE BLOCKS\nActive page_key: \`${pageManifest.page_key}\`${pageManifest.raise_id ? ` (raise_id: \`${pageManifest.raise_id}\`)` : ""}.\n\n`;
      const blocks = Array.isArray(pageManifest.blocks) ? pageManifest.blocks : [];
      if (blocks.length === 0) {
        systemPrompt += `No editable prose blocks are registered on this page.`;
      } else {
        systemPrompt += blocks
          .map(
            (b: any) =>
              `- \`${b.section_key}\` — ${b.label} (${b.schema}): ${JSON.stringify(b.preview || "")}`,
          )
          .join("\n");
      }
    }
    const modelId = MODEL_MAP[effectiveModel] || "claude-sonnet-4-5-20250929";

    // In edit modes, expose the relevant edit tool + clarification tools.
    const editTools = oddContext
      ? tools.filter((t) => t.name === "edit_odd_section")
      : memo_id
        ? tools.filter((t) => t.name === "edit_memo")
        : tools;
    const pageTools = oddContext || memo_id ? [] : PAGE_CONTENT_TOOLS;
    const activeTools = [...editTools, ...pageTools, ...CLARIFY_TOOLS];
    const anthropicTools = toAnthropicTools(activeTools);

    const baseMessages = toAnthropicMessages(messages);
    const startTime = Date.now();

    const makeAnthropicCall = async (msgs: any[]) => {
      const body = {
        model: modelId,
        system: systemPrompt,
        messages: msgs,
        tools: anthropicTools,
        max_tokens: memo_id || odd_project_id ? 4096 : 8192,
        temperature: memo_id || odd_project_id ? 0.3 : 0.7,
        stream: true,
      };
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
          const allMessages = [...baseMessages];
          let fullContent = "";
          const allToolCalls: any[] = [];
          let tokensInput = 0;
          let tokensOutput = 0;
          let continueLoop = true;
          let safetyHops = 0;

          while (continueLoop && safetyHops < 5) {
            continueLoop = false;
            safetyHops++;

            const resp = await makeAnthropicCall(allMessages);
            const reader = resp.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            const pendingFunctionCalls: { id: string; name: string; args: any }[] = [];
            const assistantBlocks: any[] = [];
            // Per content_block index: accumulating state.
            const blockState: Record<number, { type: string; text?: string; toolUseId?: string; toolName?: string; jsonBuf?: string }> = {};

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });

              // Anthropic streams as SSE: `event: <name>\ndata: <json>\n\n`.
              let nlIdx: number;
              while ((nlIdx = buffer.indexOf("\n")) !== -1) {
                const rawLine = buffer.slice(0, nlIdx);
                buffer = buffer.slice(nlIdx + 1);
                const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
                if (!line.startsWith("data: ")) continue;
                const jsonStr = line.slice(6).trim();
                if (!jsonStr || jsonStr === "[DONE]") continue;

                let evt: any;
                try {
                  evt = JSON.parse(jsonStr);
                } catch {
                  buffer = line + "\n" + buffer;
                  break;
                }

                switch (evt.type) {
                  case "message_start":
                    tokensInput = evt.message?.usage?.input_tokens ?? tokensInput;
                    break;
                  case "content_block_start": {
                    const idx = evt.index as number;
                    const block = evt.content_block;
                    if (block.type === "text") {
                      blockState[idx] = { type: "text", text: "" };
                    } else if (block.type === "tool_use") {
                      blockState[idx] = {
                        type: "tool_use",
                        toolUseId: block.id,
                        toolName: block.name,
                        jsonBuf: "",
                      };
                      send("tool_start", { name: block.name, id: block.id });
                    }
                    break;
                  }
                  case "content_block_delta": {
                    const idx = evt.index as number;
                    const st = blockState[idx];
                    if (!st) break;
                    const d = evt.delta;
                    if (d.type === "text_delta") {
                      st.text = (st.text || "") + d.text;
                      fullContent += d.text;
                      send("content_delta", { text: d.text });
                    } else if (d.type === "input_json_delta") {
                      st.jsonBuf = (st.jsonBuf || "") + (d.partial_json || "");
                    }
                    break;
                  }
                  case "content_block_stop": {
                    const idx = evt.index as number;
                    const st = blockState[idx];
                    if (!st) break;
                    if (st.type === "text" && st.text) {
                      assistantBlocks.push({ type: "text", text: st.text });
                    } else if (st.type === "tool_use") {
                      let args: any = {};
                      if (st.jsonBuf && st.jsonBuf.trim().length > 0) {
                        try { args = JSON.parse(st.jsonBuf); } catch { args = {}; }
                      }
                      assistantBlocks.push({
                        type: "tool_use",
                        id: st.toolUseId,
                        name: st.toolName,
                        input: args,
                      });
                      pendingFunctionCalls.push({
                        id: st.toolUseId!,
                        name: st.toolName!,
                        args,
                      });
                    }
                    break;
                  }
                  case "message_delta":
                    tokensOutput = evt.usage?.output_tokens ?? tokensOutput;
                    break;
                }
              }
            }

            if (pendingFunctionCalls.length > 0) {
              // Execute all function calls in parallel
              const toolResultBlocks = await Promise.all(
                pendingFunctionCalls.map(async (fc) => {
                  send("tool_executing", { name: fc.name, id: fc.id });
                  const result = await executeTool(fc.name, fc.args, {
                    memoId: memo_id,
                    oddProjectId: odd_project_id,
                    activePageKey,
                    activeRaiseId,
                    conversationId: conversation_id,
                  });
                  let parsed: any;
                  try { parsed = JSON.parse(result); } catch { parsed = { raw: result }; }
                  allToolCalls.push({ name: fc.name, input: fc.args, output: parsed });
                  const summary = Array.isArray(parsed)
                    ? `${parsed.length} results`
                    : parsed?.total_matches
                      ? `${parsed.total_matches} matches`
                      : parsed?.success ? "done" : "done";
                  send("tool_complete", { name: fc.name, id: fc.id, resultSummary: summary });
                  // For client-rendered clarification tools, also forward the
                  // tool input so the UI can render the interactive control.
                  if (fc.name === "ask_quick_reply" || fc.name === "ask_form") {
                    send("interactive_request", {
                      id: fc.id,
                      name: fc.name,
                      input: fc.args,
                    });
                  }
                  return {
                    type: "tool_result",
                    tool_use_id: fc.id,
                    content: typeof parsed === "string" ? parsed : JSON.stringify(parsed),
                  };
                })
              );

              // Push assistant turn (with the function calls) and the tool results, then loop.
              allMessages.push({ role: "assistant", content: assistantBlocks });
              allMessages.push({ role: "user", content: toolResultBlocks });
              continueLoop = true;
            }
          }

          const durationMs = Date.now() - startTime;

          if (conversation_id) {
            await supabase.from("chat_messages").insert({
              conversation_id,
              role: "assistant",
              content: fullContent,
              thinking_content: null,
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
