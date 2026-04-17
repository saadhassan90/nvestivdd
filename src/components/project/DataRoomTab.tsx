import { useCallback, useState } from "react";
import { Upload, RefreshCw, Folder, AlertTriangle, FileText, ChevronDown } from "lucide-react";
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
}

const PRIORITIES = [
  { key: "critical", label: "P1 — Deal-Breaker", description: "Required for go/no-go decision" },
  { key: "high", label: "P2 — Essential", description: "Significant diligence value" },
  { key: "medium", label: "P3 — Supporting", description: "Required for final investment decision" },
  { key: "standard", label: "P4 — Nice-to-Have", description: "Enhances confidence" },
];

export function DataRoomTab({
  items,
  documents,
  projectId,
  lastAnalysisAt,
  onRefresh,
  onRerunAnalysis,
  submissionQuality = [],
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

  return (
    <div className="space-y-5">
      {/* Submission Quality Strip */}
      <BlurFade>
        <SectionCard title="Submission Quality" subtitle="Material type · completeness · estimated response days" icon={<FileText className="h-4 w-4" />}>
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
        <SectionCard title="Critical Missing Documents" subtitle="P1 items not yet received" icon={<AlertTriangle className="h-4 w-4" />} empty={criticalMissing.length === 0} emptyMessage="No P1 items missing — submission complete.">
          {criticalMissing.length > 0 && (
            <ul className="space-y-1.5">
              {criticalMissing.map((d) => (
                <li key={d.id} className="text-xs flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-severity-critical mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{d.document_name}</p>
                    {d.purpose && <p className="text-[11px] text-muted-foreground">{d.purpose}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </BlurFade>

      {/* Priority Checklist Accordions */}
      <BlurFade delay={0.06}>
        <SectionCard title="Priority Checklist" subtitle="P1 · P2 · P3 · P4 accordion groups" icon={<Folder className="h-4 w-4" />}>
          <div className="space-y-2">
            {PRIORITIES.map((p) => {
              const groupItems = items.filter((i) => i.priority === p.key);
              return (
                <Collapsible key={p.key} defaultOpen={p.key === "critical"}>
                  <CollapsibleTrigger className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="text-left">
                      <p className="text-xs font-bold uppercase tracking-wider text-foreground">{p.label}</p>
                      <p className="text-[10px] text-muted-foreground">{p.description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{groupItems.length} items</span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-3 py-2 space-y-1.5">
                      {groupItems.length === 0 ? (
                        <p className="text-xs italic text-muted-foreground">No items in this priority bucket at L1.</p>
                      ) : (
                        groupItems.map((it) => (
                          <div key={it.id} className="flex items-start gap-2 py-1 border-b border-border/40 last:border-0 text-xs">
                            <input type="checkbox" defaultChecked={it.is_received} className="mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className={`font-medium ${it.is_received ? "line-through text-muted-foreground" : "text-foreground"}`}>{it.document_name}</p>
                              {it.purpose && <p className="text-[10px] text-muted-foreground">{it.purpose}</p>}
                            </div>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
                              {it.is_received ? "Received" : "Requested"}
                            </span>
                          </div>
                        ))
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
