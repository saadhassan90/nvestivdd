import { useEffect, useMemo, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { ArrowLeft, MessagesSquare, Sparkles, Check, X, Filter } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { BlurFade } from "@/components/magicui/BlurFade";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { sectionLabel as fmtSection, cardLabelFromId, cardDomId } from "@/lib/card-labels";
import type { Tables } from "@/integrations/supabase/types";

const SECTION_LABELS: Record<string, string> = {
  overview: "Overview",
  investment_thesis: "Investment Thesis",
  market_reality: "Macro Context",
  team: "Team & Manager",
  track_record: "Track Record",
  economics: "Economics",
  regulatory_ops: "Regulatory & Ops",
  red_flags: "Risk Flags",
  interrogatory: "Diligence Questions",
  documents: "Sources",
  data_room: "Dataroom",
};

export default function CommentsPage() {
  const { id } = useParams<{ id: string }>();
  const [comments, setComments] = useState<Tables<"comments">[]>([]);
  const [project, setProject] = useState<Tables<"projects"> | null>(null);
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [authorFilter, setAuthorFilter] = useState<string>("all");
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [{ data: proj }, { data: cs }] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).single(),
        supabase.from("comments").select("*").eq("project_id", id).order("created_at", { ascending: false }),
      ]);
      if (proj) setProject(proj);
      if (cs) setComments(cs);
    };
    load();
    const ch = supabase
      .channel(`comments-page-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `project_id=eq.${id}` },
        load
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [id]);

  const sectionsPresent = useMemo(
    () => Array.from(new Set(comments.map((c) => c.section_id))),
    [comments]
  );

  const filtered = useMemo(() => {
    return comments.filter((c) => {
      if (sectionFilter !== "all" && c.section_id !== sectionFilter) return false;
      if (authorFilter === "human" && c.author_type !== "human") return false;
      if (authorFilter === "ai" && c.author_type !== "ai") return false;
      if (!showResolved && c.resolved_at) return false;
      return true;
    });
  }, [comments, sectionFilter, authorFilter, showResolved]);

  const toggleResolve = async (c: Tables<"comments">) => {
    await supabase
      .from("comments")
      .update({ resolved_at: c.resolved_at ? null : new Date().toISOString() })
      .eq("id", c.id);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <RouterLink
            to={`/project/${id}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to deal
          </RouterLink>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2 lowercase">
            <MessagesSquare className="h-4 w-4" /> comments
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{project?.fund_name || "Deal"} · {filtered.length} of {comments.length}</p>
        </div>

        <BlurFade>
          <SectionCard title="Filters" subtitle="Section · author · resolution status" icon={<Filter className="h-4 w-4" />}>
            <div className="flex flex-wrap gap-2 text-xs">
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs"
              >
                <option value="all">All sections</option>
                {sectionsPresent.map((s) => (
                  <option key={s} value={s}>{SECTION_LABELS[s] ?? s}</option>
                ))}
              </select>
              <select
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs"
              >
                <option value="all">All authors</option>
                <option value="human">Team</option>
                <option value="ai">Nvestiv AI</option>
              </select>
              <button
                onClick={() => setShowResolved((v) => !v)}
                className={cn(
                  "rounded-md border px-2 py-1 text-xs font-medium",
                  showResolved ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {showResolved ? "Hide resolved" : "Show resolved"}
              </button>
            </div>
          </SectionCard>
        </BlurFade>

        <BlurFade delay={0.04}>
          <SectionCard title="Comments" subtitle="Chronological · click section to deep-link" icon={<MessagesSquare className="h-4 w-4" />} empty={filtered.length === 0} emptyMessage="No comments match the current filters.">
            {filtered.length > 0 && (
              <ul className="space-y-2">
                {filtered.map((c) => (
                  <li
                    key={c.id}
                    className={cn(
                      "rounded-md border bg-card p-3",
                      c.resolved_at ? "opacity-60 border-border/40" : "border-border"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {c.author_type === "ai" ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-foreground border border-border rounded px-1.5 py-[1px]">
                              <Sparkles className="h-2.5 w-2.5" /> Nvestiv AI
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-foreground">{c.author_name}</span>
                          )}
                          <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
                          <RouterLink
                            to={`/project/${id}?tab=${c.section_id}${c.sub_card_id ? `#${cardDomId(c.section_id, c.sub_card_id)}` : ""}`}
                            className="text-[10px] text-muted-foreground hover:text-foreground hover:underline"
                          >
                            in {fmtSection(c.section_id)}
                            {c.sub_card_id && (
                              <>
                                {" "}
                                <span className="text-muted-foreground/60">›</span>{" "}
                                {cardLabelFromId(c.sub_card_id)}
                              </>
                            )}{" "}
                            →
                          </RouterLink>
                        </div>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{c.body_md}</p>
                      </div>
                      <button
                        onClick={() => toggleResolve(c)}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                        title={c.resolved_at ? "Reopen" : "Resolve"}
                      >
                        {c.resolved_at ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </BlurFade>
      </div>
    </AppLayout>
  );
}
