import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { query, limit = 20 } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    const q = query.trim().toLowerCase();

    // 1. Keyword search across projects
    const { data: projectResults } = await supabase
      .from("projects")
      .select(
        "id, fund_name, gp_entity_name, asset_class, strategy, composite_score, status, recommendation, executive_summary_narrative"
      )
      .or(
        `fund_name.ilike.%${q}%,gp_entity_name.ilike.%${q}%,asset_class.ilike.%${q}%,strategy.ilike.%${q}%,executive_summary_narrative.ilike.%${q}%`
      )
      .limit(limit);

    // 2. Search red flags
    const { data: flagResults } = await supabase
      .from("red_flags")
      .select("id, project_id, title, description, severity, module")
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      .limit(10);

    // 3. Search team members
    const { data: teamResults } = await supabase
      .from("team_members")
      .select("id, project_id, name, title, role_category, adverse_findings")
      .or(`name.ilike.%${q}%,title.ilike.%${q}%,adverse_findings.ilike.%${q}%`)
      .limit(10);

    // 4. Search interrogatory items
    const { data: interrogatoryResults } = await supabase
      .from("interrogatory_items")
      .select("id, project_id, question, rationale, priority")
      .or(`question.ilike.%${q}%,rationale.ilike.%${q}%`)
      .limit(10);

    // 5. Search report sections
    const { data: sectionResults } = await supabase
      .from("report_sections")
      .select("id, project_id, section_key, section_title, content")
      .or(`section_title.ilike.%${q}%,content.ilike.%${q}%`)
      .limit(10);

    // 6. Semantic search via knowledge graph (if embedding model available)
    let semanticResults: any[] = [];
    if (lovableKey) {
      try {
        // Get embedding for the query
        const embResponse = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                {
                  role: "system",
                  content: `You are a search query expander. Given a search query, return 3-5 related concepts, synonyms, and domain-specific terms that would help find relevant results in an institutional investment due diligence context. Return ONLY a JSON array of strings, no other text.`,
                },
                {
                  role: "user",
                  content: `Expand this search query: "${query}"`,
                },
              ],
            }),
          }
        );

        if (embResponse.ok) {
          const embData = await embResponse.json();
          const expandedText =
            embData.choices?.[0]?.message?.content || "";
          
          // Parse expanded terms and do additional keyword searches
          try {
            const terms = JSON.parse(expandedText);
            if (Array.isArray(terms)) {
              for (const term of terms.slice(0, 3)) {
                const t = term.toLowerCase();
                const { data: expanded } = await supabase
                  .from("projects")
                  .select(
                    "id, fund_name, gp_entity_name, asset_class, strategy, composite_score, status, recommendation, executive_summary_narrative"
                  )
                  .or(
                    `fund_name.ilike.%${t}%,gp_entity_name.ilike.%${t}%,asset_class.ilike.%${t}%,strategy.ilike.%${t}%,executive_summary_narrative.ilike.%${t}%`
                  )
                  .limit(5);
                if (expanded) {
                  semanticResults.push(
                    ...expanded.map((p: any) => ({
                      ...p,
                      matched_term: term,
                    }))
                  );
                }
              }
              // Deduplicate
              const seen = new Set(
                (projectResults || []).map((p: any) => p.id)
              );
              semanticResults = semanticResults.filter((p: any) => {
                if (seen.has(p.id)) return false;
                seen.add(p.id);
                return true;
              });
            }
          } catch {
            // ignore parse errors
          }
        }
      } catch (e) {
        console.error("Semantic expansion error:", e);
      }
    }

    // Collect project IDs for enrichment
    const allProjectIds = new Set<string>();
    (projectResults || []).forEach((p: any) => allProjectIds.add(p.id));
    (flagResults || []).forEach((f: any) => allProjectIds.add(f.project_id));
    (teamResults || []).forEach((t: any) => allProjectIds.add(t.project_id));
    (interrogatoryResults || []).forEach((i: any) =>
      allProjectIds.add(i.project_id)
    );
    (sectionResults || []).forEach((s: any) =>
      allProjectIds.add(s.project_id)
    );
    semanticResults.forEach((p: any) => allProjectIds.add(p.id));

    // Get fund names for related results
    const projectNameMap: Record<string, string> = {};
    (projectResults || []).forEach(
      (p: any) => (projectNameMap[p.id] = p.fund_name)
    );
    semanticResults.forEach(
      (p: any) => (projectNameMap[p.id] = p.fund_name)
    );

    const missingIds = [...allProjectIds].filter((id) => !projectNameMap[id]);
    if (missingIds.length > 0) {
      const { data: names } = await supabase
        .from("projects")
        .select("id, fund_name")
        .in("id", missingIds);
      (names || []).forEach(
        (p: any) => (projectNameMap[p.id] = p.fund_name)
      );
    }

    // Build categorized results
    const results = {
      projects: (projectResults || []).map((p: any) => ({
        type: "project" as const,
        id: p.id,
        title: p.fund_name,
        subtitle: [p.gp_entity_name, p.asset_class].filter(Boolean).join(" · "),
        score: p.composite_score,
        status: p.status,
        highlight: highlightMatch(
          p.executive_summary_narrative || p.strategy || "",
          q
        ),
        url: `/project/${p.id}`,
      })),
      flags: (flagResults || []).map((f: any) => ({
        type: "flag" as const,
        id: f.id,
        projectId: f.project_id,
        title: f.title,
        subtitle: `${projectNameMap[f.project_id] || "Unknown"} · ${f.severity}`,
        severity: f.severity,
        highlight: highlightMatch(f.description || "", q),
        url: `/project/${f.project_id}?tab=red-flags`,
      })),
      team: (teamResults || []).map((t: any) => ({
        type: "team" as const,
        id: t.id,
        projectId: t.project_id,
        title: t.name,
        subtitle: `${projectNameMap[t.project_id] || "Unknown"} · ${t.title || t.role_category || ""}`,
        highlight: highlightMatch(t.adverse_findings || "", q),
        url: `/project/${t.project_id}?tab=team`,
      })),
      questions: (interrogatoryResults || []).map((i: any) => ({
        type: "question" as const,
        id: i.id,
        projectId: i.project_id,
        title: i.question.length > 80 ? i.question.slice(0, 80) + "…" : i.question,
        subtitle: `${projectNameMap[i.project_id] || "Unknown"} · ${i.priority}`,
        highlight: highlightMatch(i.rationale || "", q),
        url: `/project/${i.project_id}?tab=interrogatory`,
      })),
      sections: (sectionResults || []).map((s: any) => ({
        type: "section" as const,
        id: s.id,
        projectId: s.project_id,
        title: s.section_title || s.section_key,
        subtitle: projectNameMap[s.project_id] || "Unknown",
        highlight: highlightMatch(s.content || "", q),
        url: `/project/${s.project_id}?tab=overview`,
      })),
      semantic: semanticResults.map((p: any) => ({
        type: "semantic" as const,
        id: p.id,
        title: p.fund_name,
        subtitle: [p.gp_entity_name, p.asset_class, `via "${p.matched_term}"`]
          .filter(Boolean)
          .join(" · "),
        score: p.composite_score,
        highlight: highlightMatch(
          p.executive_summary_narrative || p.strategy || "",
          q
        ),
        url: `/project/${p.id}`,
      })),
    };

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Search error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function highlightMatch(text: string, query: string): string {
  if (!text || !query) return "";
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, 150);
  const start = Math.max(0, idx - 60);
  const end = Math.min(text.length, idx + query.length + 60);
  let snippet = text.slice(start, end);
  if (start > 0) snippet = "…" + snippet;
  if (end < text.length) snippet += "…";
  return snippet;
}
