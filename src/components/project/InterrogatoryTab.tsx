import { useState } from "react";
import { FileDown, AlertTriangle, FileText, CheckCircle2, Lock } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";
import { MagicCard } from "@/components/magicui/MagicCard";
import { MarkdownSectionCards } from "@/components/project/MarkdownSectionCards";
import type { Tables } from "@/integrations/supabase/types";

interface InterrogatoryTabProps {
  items: Tables<"interrogatory_items">[];
  fundName: string;
  reportMarkdown?: string | null;
}

const SOURCE_MODULE_LABELS: Record<string, string> = {
  red_flag: "Red Flag",
  verification_gap: "Verification Gap",
  structural: "Structural",
  governance: "Governance",
  financial: "Financial",
  operational: "Operational DD",
  risk: "Risk Analysis",
  team: "Team",
  strategy: "Strategy",
  terms: "Terms",
};

const TAG_STYLES: Record<string, string> = {
  red_flag: "bg-severity-critical/10 text-severity-critical border-severity-critical/30",
  verification_gap: "bg-severity-elevated/10 text-severity-elevated border-severity-elevated/30",
  structural: "bg-muted text-foreground border-border",
  governance: "bg-muted text-foreground border-border",
  financial: "bg-muted text-foreground border-border",
  operational: "bg-muted text-foreground border-border",
  risk: "bg-severity-critical/10 text-severity-critical border-severity-critical/30",
  team: "bg-muted text-foreground border-border",
  strategy: "bg-muted text-foreground border-border",
  terms: "bg-muted text-foreground border-border",
};

const PRIORITY_SCORE_COLOR = (score: number | null) => {
  if (!score) return "text-muted-foreground bg-muted";
  if (score >= 85) return "text-score-strong bg-score-strong/10";
  if (score >= 70) return "text-score-advance bg-score-advance/10";
  if (score >= 50) return "text-severity-elevated bg-severity-elevated/10";
  return "text-severity-critical bg-severity-critical/10";
};

export function InterrogatoryTab({ items, fundName, reportMarkdown }: InterrogatoryTabProps) {
  const hasMarkdown = !!reportMarkdown;
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Derive unique source categories for filter pills
  const categoryCounts: Record<string, number> = {};
  items.forEach((item) => {
    const cat = item.source_module || item.module || "other";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const filterOptions = [
    { key: "all", label: `All (${items.length})` },
    ...Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({
        key,
        label: `${SOURCE_MODULE_LABELS[key] || key} (${count})`,
      })),
  ];

  if (hasMarkdown) {
    filterOptions.unshift({ key: "report", label: "Report" });
  }

  const filtered =
    activeFilter === "all" || activeFilter === "report"
      ? items
      : items.filter(
          (i) => (i.source_module || i.module) === activeFilter
        );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Header ── */}
      <BlurFade>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Interrogatory Matrix
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              GP meeting questions
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {items.length} questions generated from red flags and verification gaps
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors shrink-0 self-start">
            <FileDown className="h-3.5 w-3.5" />
            Export as PDF
          </button>
        </div>
      </BlurFade>

      {/* ── Filters ── */}
      <BlurFade delay={0.05}>
        <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
          {filterOptions.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap border ${
                activeFilter === f.key
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </BlurFade>

      {/* ── Report markdown view ── */}
      {activeFilter === "report" && (
        <MarkdownSectionCards content={reportMarkdown ?? null} baseDelay={0.05} />
      )}

      {/* ── Desktop table view ── */}
      {activeFilter !== "report" && (
        <>
          <div className="hidden sm:block">
            <BlurFade delay={0.1}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-3 pr-6 w-[40%]">
                        Question
                      </th>
                      <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-3 px-4 w-[30%]">
                        Rationale
                      </th>
                      <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-3 pl-4 w-[30%]">
                        Satisfactory Answer
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item, i) => {
                      const sourceKey = item.source_module || item.module || "structural";
                      const tagLabel = SOURCE_MODULE_LABELS[sourceKey] || sourceKey;
                      const tagStyle = TAG_STYLES[sourceKey] || TAG_STYLES.structural;

                      return (
                        <tr
                          key={item.id}
                          className="border-b border-border/50 last:border-0 align-top"
                        >
                          <td className="py-5 pr-6">
                            <span
                              className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border mb-2 ${tagStyle}`}
                            >
                              {tagLabel}
                            </span>
                            <p className="text-sm font-medium text-foreground leading-relaxed">
                              {item.question}
                            </p>
                          </td>
                          <td className="py-5 px-4">
                            <p className="text-xs text-muted-foreground italic leading-relaxed">
                              {item.rationale || "—"}
                            </p>
                          </td>
                          <td className="py-5 pl-4">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {item.gp_response_notes || "—"}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </BlurFade>
          </div>

          {/* ── Mobile card view ── */}
          <div className="sm:hidden space-y-4">
            {filtered.map((item, i) => {
              const sourceKey = item.source_module || item.module || "structural";
              const tagLabel = SOURCE_MODULE_LABELS[sourceKey] || sourceKey;
              const tagStyle = TAG_STYLES[sourceKey] || TAG_STYLES.structural;
              const score = item.gp_response_score;

              return (
                <BlurFade key={item.id} delay={i * 0.03}>
                  <MagicCard>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          sourceKey === "red_flag" || sourceKey === "risk"
                            ? "text-severity-critical"
                            : sourceKey === "verification_gap"
                            ? "text-severity-elevated"
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.source_module_label || tagLabel}
                      </span>
                      {score !== null && score !== undefined && (
                        <span
                          className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${PRIORITY_SCORE_COLOR(score)}`}
                        >
                          {score}/100
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-foreground leading-snug mb-3">
                      {item.question}
                    </p>

                    {/* GP Response */}
                    {item.gp_response_notes && (
                      <div className="rounded-lg bg-muted/50 p-3 mb-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            GP Response
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {item.gp_response_notes}
                        </p>
                      </div>
                    )}

                    {/* Rationale warning */}
                    {item.rationale && (
                      <div className="flex items-start gap-2 mb-3">
                        <AlertTriangle className="h-3.5 w-3.5 text-severity-elevated shrink-0 mt-0.5" />
                        <p className="text-[11px] text-severity-elevated">
                          {item.rationale}
                        </p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          item.status === "resolved"
                            ? "text-score-strong"
                            : item.status === "blocker"
                            ? "text-severity-critical"
                            : "text-muted-foreground"
                        }`}
                      >
                        Status:{" "}
                        <span className="font-bold">
                          {item.status === "resolved"
                            ? "Resolved"
                            : item.status === "blocker"
                            ? "Blocker"
                            : "Open"}
                        </span>
                      </span>
                      {item.status === "blocker" && (
                        <button className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline">
                          Request Override <Lock className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </MagicCard>
                </BlurFade>
              );
            })}
          </div>

          {/* ── Count ── */}
          <div className="text-xs text-muted-foreground text-center sm:text-left pt-2">
            Showing {filtered.length} of {items.length} questions
          </div>
        </>
      )}

      {/* ── Empty state ── */}
      {items.length === 0 && !hasMarkdown && (
        <BlurFade>
          <MagicCard>
            <div className="text-center py-12">
              <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No interrogatory questions generated yet.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Questions will appear once the analysis identifies red flags and verification gaps.
              </p>
            </div>
          </MagicCard>
        </BlurFade>
      )}
    </div>
  );
}
