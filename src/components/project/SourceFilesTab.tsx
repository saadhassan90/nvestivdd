import { useState, useCallback } from "react";
import { Plus, FileText, FileSpreadsheet, File, MoreVertical, Upload } from "lucide-react";
import { MagicCard } from "@/components/magicui/MagicCard";
import { BlurFade } from "@/components/magicui/BlurFade";
import { ShimmerButton } from "@/components/magicui/ShimmerButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { formatRelativeTime } from "@/lib/score-utils";

interface SourceFilesTabProps {
  documents: Tables<"documents">[];
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

export function SourceFilesTab({ documents, projectId, onRefresh }: SourceFilesTabProps) {
  const [uploading, setUploading] = useState(false);
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
    <div className="space-y-6">
      <BlurFade>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Source Files</h2>
          <label>
            <ShimmerButton className="text-sm cursor-pointer" disabled={uploading}>
              <Plus className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload File"}
            </ShimmerButton>
            <input type="file" multiple className="hidden" onChange={handleUpload} accept=".pdf,.xlsx,.xls,.docx,.doc" />
          </label>
        </div>
      </BlurFade>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc, i) => {
          const info = getFileTypeInfo(doc.file_name);
          const Icon = info.icon;
          return (
            <BlurFade key={doc.id} delay={i * 0.05}>
              <MagicCard>
                <div className="flex flex-col">
                  <div className="flex h-24 items-center justify-center rounded-lg bg-muted mb-3">
                    <Icon className="h-10 w-10 text-muted-foreground" />
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

        {/* Add new file card */}
        <BlurFade delay={documents.length * 0.05}>
          <label className="flex h-full min-h-[180px] cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border hover:border-muted-foreground/40 transition-colors">
            <div className="text-center">
              <Plus className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-xs text-muted-foreground">Add new file</p>
            </div>
            <input type="file" multiple className="hidden" onChange={handleUpload} accept=".pdf,.xlsx,.xls,.docx,.doc" />
          </label>
        </BlurFade>
      </div>
    </div>
  );
}
