import { useState, useCallback } from "react";
import { Plus, FileText, FileSpreadsheet, File, ExternalLink, Globe } from "lucide-react";
import { MagicCard } from "@/components/magicui/MagicCard";
import { BlurFade } from "@/components/magicui/BlurFade";
import { ShimmerButton } from "@/components/magicui/ShimmerButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { formatRelativeTime } from "@/lib/score-utils";

interface SourceFilesTabProps {
  documents: Tables<"documents">[];
  researchSources: Tables<"research_sources">[];
  projectId: string;
  onRefresh: () => void;
}

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

function getDomainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export function SourceFilesTab({ documents, researchSources, projectId, onRefresh }: SourceFilesTabProps) {
  const [uploading, setUploading] = useState(false);
  const [activeSection, setActiveSection] = useState<"sources" | "files">("sources");
  const { toast } = useToast();

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

  return (
    <div className="space-y-4 sm:space-y-6">
      <BlurFade>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Research Sources</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              External research, links, and uploaded documents used to enrich this report.
            </p>
          </div>
          <label>
            <ShimmerButton className="text-sm cursor-pointer" disabled={uploading}>
              <Plus className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload File"}
            </ShimmerButton>
            <input type="file" multiple className="hidden" onChange={handleUpload} accept=".pdf,.xlsx,.xls,.docx,.doc" />
          </label>
        </div>
      </BlurFade>

      {/* Section toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveSection("sources")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            activeSection === "sources"
              ? 'bg-primary text-primary-foreground'
              : 'border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            External Sources ({researchSources.length})
          </span>
        </button>
        <button
          onClick={() => setActiveSection("files")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            activeSection === "files"
              ? 'bg-primary text-primary-foreground'
              : 'border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Uploaded Files ({documents.length})
          </span>
        </button>
      </div>

      {/* External Sources */}
      {activeSection === "sources" && (
        <div className="space-y-3">
          {researchSources.length === 0 ? (
            <BlurFade>
              <MagicCard>
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                  <Globe className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-semibold text-foreground">No external sources yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Research sources and external links will appear here once the analysis enrichment is complete.
                  </p>
                </div>
              </MagicCard>
            </BlurFade>
          ) : (
            researchSources.map((source, i) => (
              <BlurFade key={source.id} delay={i * 0.05}>
                <MagicCard className="group">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      {source.favicon_url ? (
                        <img src={source.favicon_url} alt="" className="h-5 w-5 rounded" />
                      ) : (
                        <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{source.title}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{getDomainFromUrl(source.url)}</p>
                        </div>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors opacity-60 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </a>
                      </div>
                      {source.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{source.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
                          {source.source_type || 'web'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatRelativeTime(source.added_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </MagicCard>
              </BlurFade>
            ))
          )}
        </div>
      )}

      {/* Uploaded Files */}
      {activeSection === "files" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {documents.map((doc, i) => {
            const info = getFileTypeInfo(doc.file_name);
            const Icon = info.icon;
            return (
              <BlurFade key={doc.id} delay={i * 0.05}>
                <MagicCard>
                  <div className="flex flex-col">
                    <div className="flex h-20 sm:h-24 items-center justify-center rounded-lg bg-muted mb-3">
                      <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                    </div>
                    <span className={`self-start inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${info.color} mb-2`}>
                      {info.label}
                    </span>
                    <p className="text-sm font-semibold text-foreground truncate">{doc.file_name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatRelativeTime(doc.uploaded_at)} • {formatFileSize(doc.file_size)}
                    </p>
                  </div>
                </MagicCard>
              </BlurFade>
            );
          })}

          <BlurFade delay={documents.length * 0.05}>
            <label className="flex h-full min-h-[140px] sm:min-h-[180px] cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border hover:border-muted-foreground/40 transition-colors">
              <div className="text-center">
                <Plus className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-xs text-muted-foreground">Add new file</p>
              </div>
              <input type="file" multiple className="hidden" onChange={handleUpload} accept=".pdf,.xlsx,.xls,.docx,.doc" />
            </label>
          </BlurFade>
        </div>
      )}
    </div>
  );
}
