import { useCallback, useState } from "react";
import { Upload, RefreshCw, Folder, AlertTriangle, FileText, ChevronDown, ArrowUpRight, MessageSquare } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { BlurFade } from "@/components/magicui/BlurFade";
import { ShimmerButton } from "@/components/magicui/ShimmerButton";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import { KpiTile } from "@/components/project/primitives/KpiTile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

interface DataRoomTabProps {
  items: Tables<"data_room_items">[];
  documents: Tables<"documents">[];
  projectId: string;
  projectStatus: string;
  lastAnalysisAt: string | null;
  onRefresh: () => void;
  onRerunAnalysis: () => void;
  reportMarkdown?: string | null;
  submissionQuality?: Tables<"submission_quality">[];
  interrogatoryItems?: Tables<"interrogatory_items">[];
}

// PRD v2.0 §3.10 — diligence-tier framing
const PRIORITIES = [
  { key: "critical", label: "P1 — Deal-Breaker", tier: "Triage Gate", description: "Required for go/no-go decision; absence triggers No-Meet" },
  { key: "high", label: "P2 — Essential", tier: "Deep-Dive", description: "Significant diligence value; required to advance to L2" },
  { key: "medium", label: "P3 — Supporting", tier: "IC Memo", description: "Required for final investment decision" },
  { key: "standard", label: "P4 — Nice-to-Have", tier: "Confirmatory", description: "Enhances confidence; not blocking" },
];

export function DataRoomTab({
  items,
  documents,
  projectId,
  lastAnalysisAt,
  onRefresh,
  onRerunAnalysis,
  submissionQuality = [],
  interrogatoryItems = [],
}: DataRoomTabProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) return;
      setUploading(true);
      try {
        for (const file of Array.from(e.target.files)) {
          const filePath = `${projectId}/${Date.now()}-${file.name}`;
          await supabase.storage.from("documents").upload(filePath, file);
          await supabase.from("documents").insert({
            project_id: projectId,
            file_name: file.name,
            file_path: filePath,
            file_type: "other",
            file_size: file.size,
          });
        }
        toast({ title: "Files uploaded successfully" });
        onRefresh();
      } catch {
        toast({ title: "Upload failed", variant: "destructive" });
      } finally {
        setUploading(false);
      }
    },
    [projectId, onRefresh, toast],
  );

  const hasNewFiles = lastAnalysisAt && documents.some((d) => new Date(d.uploaded_at) > new Date(lastAnalysisAt));

  // Submission quality KPIs
  const materialType = submissionQuality.find((sq) => sq.category?.includes("material_type"))?.confidence ?? null;
  const completenessTier = submissionQuality.find((sq) => sq.category?.includes("completeness_tier"))?.confidence ?? null;
  const completenessPctRaw = submissionQuality.find((sq) => sq.category?.includes("completeness_pct"))?.confidence ?? null;
  const responseDays = submissionQuality.find((sq) => sq.category?.includes("response_days"))?.confidence ?? null;

  // Critical missing docs (heuristic)
  const criticalMissing = items.filter((i) => i.priority === "critical" && !i.is_received);

  // Cross-link helper: find a related interrogatory question by simple keyword match on doc name
  const findRelatedQuestion = (docName: string) => {
    if (!docName || !interrogatoryItems.length) return null;
    const tokens = docName.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 4);
    if (!tokens.length) return null;
    return interrogatoryItems.find((q) =>
      tokens.some(
        (t) =>
          q.question?.toLowerCase().includes(t) ||
          q.source_module?.toLowerCase().includes(t) ||
          q.source_module_label?.toLowerCase().includes(t)
      )
    ) ?? null;
  };

  return (
    <div className="space-y-5">
      {/* Submission Quality Strip */}
      <BlurFade>
        <SectionCard title="Submission Quality" subtitle="Inherited from Overview · material type · completeness · est. response days" icon={<FileText className="h-4 w-4" />}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiTile label="Material Type" value={materialType} />
            <KpiTile label="Completeness Tier" value={completenessTier} />
            <KpiTile label="Completeness %" value={completenessPctRaw} />
            <KpiTile label="Est. Response Days" value={responseDays} />
          </div>
        </SectionCard>
      </BlurFade>

      {/* Critical Missing */}
      <BlurFade delay={0.04}>
        <SectionCard title="Critical Missing Documents" subtitle="P1 deal-breaker items not yet received · cross-linked to diligence questions" icon={<AlertTriangle className="h-4 w-4" />} empty={criticalMissing.length === 0} emptyMessage="No P1 items missing — submission complete.">
          {criticalMissing.length > 0 && (
            <ul className="space-y-1.5">
              {criticalMissing.map((d) => {
                const related = findRelatedQuestion(d.document_name);
                return (
                  <li key={d.id} className="text-xs flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-severity-critical mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{d.document_name}</p>
                      {d.purpose && <p className="text-[11px] text-muted-foreground">{d.purpose}</p>}
                      {related && (
                        <RouterLink
                          to={`/project/${projectId}?tab=interrogatory`}
                          className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                        >
                          <MessageSquare className="h-2.5 w-2.5" />
                          Related question
                          <ArrowUpRight className="h-2.5 w-2.5" />
                        </RouterLink>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </BlurFade>

      {/* Priority Checklist Accordions */}
      <BlurFade delay={0.06}>
        <SectionCard title="Diligence Tier Checklist" subtitle="P1 Triage · P2 Deep-Dive · P3 IC Memo · P4 Confirmatory" icon={<Folder className="h-4 w-4" />}>
          <div className="space-y-2">
            {PRIORITIES.map((p) => {
              const groupItems = items.filter((i) => i.priority === p.key);
              const receivedCount = groupItems.filter((i) => i.is_received).length;
              return (
                <Collapsible key={p.key} defaultOpen={p.key === "critical"}>
                  <CollapsibleTrigger className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-foreground">{p.label}</p>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1 py-[1px]">
                          {p.tier}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{p.description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="tabular-nums">{receivedCount}/{groupItems.length} received</span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-3 py-2 space-y-1.5">
                      {groupItems.length === 0 ? (
                        <p className="text-xs italic text-muted-foreground">No items in this priority bucket at L1.</p>
                      ) : (
                        groupItems.map((it) => {
                          const related = !it.is_received ? findRelatedQuestion(it.document_name) : null;
                          return (
                            <div key={it.id} className="flex items-start gap-2 py-1 border-b border-border/40 last:border-0 text-xs">
                              <input type="checkbox" defaultChecked={it.is_received} className="mt-0.5 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className={`font-medium ${it.is_received ? "line-through text-muted-foreground" : "text-foreground"}`}>{it.document_name}</p>
                                {it.purpose && <p className="text-[10px] text-muted-foreground">{it.purpose}</p>}
                                {related && (
                                  <RouterLink
                                    to={`/project/${projectId}?tab=interrogatory`}
                                    className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                                  >
                                    Diligence Q <ArrowUpRight className="h-2.5 w-2.5" />
                                  </RouterLink>
                                )}
                              </div>
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
                                {it.is_received ? "Received" : "Requested"}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </SectionCard>
      </BlurFade>

      {/* Completeness Verification */}
      <BlurFade delay={0.08}>
        <SectionCard title="Completeness Verification" subtitle="Items received / total · autonomous research findings" icon={<FileText className="h-4 w-4" />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <KpiTile label="Received in Deck" value={`${items.filter((i) => i.is_received).length}/${items.length}`} />
            <KpiTile label="Documents Attached" value={documents.length} />
            <KpiTile label="Last Analysis" value={lastAnalysisAt ? new Date(lastAnalysisAt).toLocaleDateString() : null} />
          </div>
        </SectionCard>
      </BlurFade>

      {/* Upload / Action Bar */}
      <BlurFade delay={0.1}>
        <SectionCard title="Actions" subtitle="Request docs · upload to dataroom" icon={<Upload className="h-4 w-4" />}>
          <div className="flex flex-wrap items-center gap-2">
            <label>
              <ShimmerButton className="text-xs cursor-pointer" disabled={uploading}>
                <Upload className="h-3.5 w-3.5" />
                {uploading ? "Uploading..." : "Upload Files"}
              </ShimmerButton>
              <input type="file" multiple className="hidden" onChange={handleUpload} accept=".pdf,.xlsx,.xls,.docx,.doc,.csv,.pptx,.ppt" />
            </label>
            {hasNewFiles && (
              <button
                onClick={onRerunAnalysis}
                className="inline-flex items-center gap-1.5 rounded-md border border-severity-elevated/40 bg-severity-elevated/10 px-3 py-1.5 text-xs font-medium text-severity-elevated hover:bg-severity-elevated/20 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Re-run Analysis
              </button>
            )}
          </div>
        </SectionCard>
      </BlurFade>
    </div>
  );
}
