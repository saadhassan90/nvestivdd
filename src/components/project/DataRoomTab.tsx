import { useState, useCallback } from "react";
import { Mail, Check, FolderOpen, Plus, FileText, FileSpreadsheet, File, Upload, RefreshCw } from "lucide-react";
import { MagicCard } from "@/components/magicui/MagicCard";
import { BlurFade } from "@/components/magicui/BlurFade";
import { ShimmerButton } from "@/components/magicui/ShimmerButton";
import { MarkdownSectionCards } from "@/components/project/MarkdownSectionCards";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { formatRelativeTime } from "@/lib/score-utils";

interface DataRoomTabProps {
  items: Tables<"data_room_items">[];
  documents: Tables<"documents">[];
  projectId: string;
  projectStatus: string;
  lastAnalysisAt: string | null;
  onRefresh: () => void;
  onRerunAnalysis: () => void;
  reportMarkdown?: string | null;
}

const TIER_META: Record<string, { label: string; desc: string; dot: string }> = {
  critical: { label: "Tier 1: Essential", desc: "Deal-breaking if missing — required for go/no-go decision", dot: "bg-severity-critical" },
  high: { label: "Tier 2: Important", desc: "Significant diligence value for advanced review", dot: "bg-severity-elevated" },
  medium: { label: "Tier 3: Standard", desc: "Required for final investment decision", dot: "bg-score-advance" },
  standard: { label: "Tier 4: Nice-to-Have", desc: "Enhances confidence; can supplement via interrogatory", dot: "bg-severity-monitor" },
};

const MODULE_LABELS: Record<string, string> = {
  module_a: "Financial & Performance",
  module_b: "Team & Management",
  module_c: "Strategy & Market",
  module_d: "Terms & Structure",
  module_e: "Operational",
};

function getFileTypeInfo(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return { label: "PDF", icon: FileText, color: "bg-severity-critical/10 text-severity-critical" };
  if (ext === 'xlsx' || ext === 'xls') return { label: "EXCEL", icon: FileSpreadsheet, color: "bg-score-strong/10 text-score-strong" };
  if (ext === 'docx' || ext === 'doc') return { label: "WORD", icon: File, color: "bg-severity-monitor/10 text-severity-monitor" };
  return { label: "FILE", icon: File, color: "bg-muted text-muted-foreground" };
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function DataRoomTab({ items, documents, projectId, projectStatus, lastAnalysisAt, onRefresh, onRerunAnalysis, reportMarkdown }: DataRoomTabProps) {
  const hasMarkdown = !!reportMarkdown;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [activeSection, setActiveSection] = useState<"report" | "files" | "checklist">(hasMarkdown ? "report" : "files");
  const { toast } = useToast();

  const toggleItem = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const hasNewFiles = lastAnalysisAt && documents.some(d => new Date(d.uploaded_at) > new Date(lastAnalysisAt));
  const isProcessing = projectStatus === 'processing';

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(e.target.files)) {
        const filePath = `${projectId}/${Date.now()}-${file.name}`;
        await supabase.storage.from('documents').upload(filePath, file);
        await supabase.from('documents').insert({
          project_id: projectId,
          file_name: file.name,
          file_path: filePath,
          file_type: 'other',
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
  }, [projectId, onRefresh, toast]);

  const priorities = ['critical', 'high', 'medium', 'standard'];

  const groupByModule = (groupItems: Tables<"data_room_items">[]) => {
    const modules: Record<string, Tables<"data_room_items">[]> = {};
    groupItems.forEach(item => {
      const mod = MODULE_LABELS[item.module || ''] || item.module || 'General';
      if (!modules[mod]) modules[mod] = [];
      modules[mod].push(item);
    });
    return modules;
  };

  const receivedCount = items.filter(i => i.is_received).length;
  const selectedCount = selected.size;

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4 sm:space-y-6">
      <BlurFade>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Data Room</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Source files and document request checklist for this deal.
            </p>
          </div>
          <label>
            <ShimmerButton className="text-sm cursor-pointer" disabled={uploading}>
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload Files"}
            </ShimmerButton>
            <input type="file" multiple className="hidden" onChange={handleUpload} accept=".pdf,.xlsx,.xls,.docx,.doc,.csv,.pptx,.ppt" />
          </label>
        </div>
      </BlurFade>

      {(hasNewFiles && !isProcessing) && (
        <BlurFade>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-severity-elevated/30 bg-severity-elevated/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-severity-elevated shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">New files have been added</p>
                <p className="text-[11px] text-muted-foreground">Re-run the analysis to incorporate the latest documents into the report.</p>
              </div>
            </div>
            <ShimmerButton onClick={onRerunAnalysis} className="text-xs shrink-0">
              <RefreshCw className="h-3.5 w-3.5" /> Re-run Analysis
            </ShimmerButton>
          </div>
        </BlurFade>
      )}

      {isProcessing && (
        <BlurFade>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Analysis in progress</p>
              <p className="text-[11px] text-muted-foreground">The report is being updated with the latest data. This may take a few minutes.</p>
            </div>
          </div>
        </BlurFade>
      )}

      <div className="flex items-center gap-2">
        {hasMarkdown && (
          <button
            onClick={() => setActiveSection("report")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activeSection === "report" ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Report
          </button>
        )}
        <button
          onClick={() => setActiveSection("files")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            activeSection === "files" ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Source Files ({documents.length})
        </button>
        <button
          onClick={() => setActiveSection("checklist")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            activeSection === "checklist" ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Request Checklist ({items.length})
        </button>
      </div>

      {activeSection === "report" && (
        <MarkdownSectionCards content={reportMarkdown ?? null} baseDelay={0.05} />
      )}

      {activeSection === "files" && (
        <div className="space-y-3">
          {documents.length === 0 ? (
            <MagicCard>
              <label className="flex flex-col items-center justify-center py-8 sm:py-12 cursor-pointer text-center">
                <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-semibold text-foreground">No source files yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Upload pitch decks, financial reports, and other documents to feed into the analysis.
                </p>
                <input type="file" multiple className="hidden" onChange={handleUpload} accept=".pdf,.xlsx,.xls,.docx,.doc,.csv,.pptx,.ppt" />
              </label>
            </MagicCard>
          ) : (
            <>
              {documents.map((doc, i) => {
                const info = getFileTypeInfo(doc.file_name);
                const Icon = info.icon;
                const isNew = lastAnalysisAt && new Date(doc.uploaded_at) > new Date(lastAnalysisAt);
                return (
                  <BlurFade key={doc.id} delay={i * 0.03}>
                    <div className={`flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-all ${isNew ? 'ring-1 ring-severity-elevated/40' : ''}`}>
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${info.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                          {isNew && (
                            <span className="inline-flex items-center rounded-full bg-severity-elevated/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-severity-elevated">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {formatRelativeTime(doc.uploaded_at)} • {formatFileSize(doc.file_size)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${info.color}`}>
                        {info.label}
                      </span>
                    </div>
                  </BlurFade>
                );
              })}
              <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-muted-foreground/40 p-4 cursor-pointer transition-colors">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Add more files</span>
                <input type="file" multiple className="hidden" onChange={handleUpload} accept=".pdf,.xlsx,.xls,.docx,.doc,.csv,.pptx,.ppt" />
              </label>
            </>
          )}
        </div>
      )}

      {activeSection === "checklist" && (
        <div className="space-y-6">
          {selectedCount > 0 && (
            <div className="flex items-center justify-end">
              <button className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                <Mail className="h-4 w-4" />
                Request {selectedCount} Items
              </button>
            </div>
          )}
          <div className="space-y-8">
            {priorities.map(priority => {
              const groupItems = items.filter(i => i.priority === priority);
              if (groupItems.length === 0) return null;
              const meta = TIER_META[priority] || TIER_META.standard;
              const moduleGroups = groupByModule(groupItems);
              return (
                <div key={priority}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-foreground">{meta.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-4 ml-[18px]">{meta.desc}</p>
                  <div className="space-y-5 ml-[18px]">
                    {Object.entries(moduleGroups).map(([module, modItems]) => (
                      <div key={module}>
                        <div className="flex items-center gap-2 mb-2">
                          <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{module}</span>
                        </div>
                        <div className="space-y-1.5">
                          {modItems.map((item) => {
                            const isChecked = item.is_received || selected.has(item.id);
                            return (
                              <div
                                key={item.id}
                                className={`flex items-start gap-3 rounded-lg border border-border p-3 transition-all cursor-pointer hover:bg-muted/30 ${
                                  item.is_received ? 'opacity-50' : ''
                                } ${selected.has(item.id) ? 'ring-1 ring-ring bg-muted/20' : ''}`}
                                onClick={() => !item.is_received && toggleItem(item.id)}
                              >
                                <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                                  isChecked ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                                }`}>
                                  {isChecked && <Check className="h-3 w-3" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${item.is_received ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                    {item.document_name}
                                  </p>
                                  {item.purpose && (
                                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.purpose}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {items.length === 0 && (
              <MagicCard>
                <p className="text-sm text-muted-foreground text-center py-8">No data room checklist items yet.</p>
              </MagicCard>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-2.5 text-xs text-muted-foreground">
        <span>{documents.length} source files • {receivedCount}/{items.length} checklist items received</span>
      </div>
    </div>
  );
}
