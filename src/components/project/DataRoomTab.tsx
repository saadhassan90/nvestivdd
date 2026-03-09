import { useState, useCallback } from "react";
import { Card, CardBody, Button, Chip, Checkbox } from "@heroui/react";
import { Mail, FolderOpen, Plus, FileText, FileSpreadsheet, File, Upload, RefreshCw } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";
import { supabase } from "@/integrations/supabase/client";
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
}

const MODULE_LABELS: Record<string, string> = {
  module_a: "Financial & Performance",
  module_b: "Team & Management",
  module_c: "Strategy & Market",
  module_d: "Terms & Structure",
  module_e: "Operational",
};

const TIER_META: Record<string, { label: string; desc: string; color: "danger" | "warning" | "primary" | "default" }> = {
  critical: { label: "Tier 1: Essential", desc: "Deal-breaking if missing", color: "danger" },
  high: { label: "Tier 2: Important", desc: "Significant diligence value", color: "warning" },
  standard: { label: "Tier 3: Nice-to-Have", desc: "Enhances confidence", color: "default" },
};

function getFileTypeInfo(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return { label: "PDF", icon: FileText, color: "text-danger bg-danger/10" };
  if (ext === 'xlsx' || ext === 'xls') return { label: "EXCEL", icon: FileSpreadsheet, color: "text-success bg-success/10" };
  return { label: "FILE", icon: File, color: "text-default-400 bg-default-100" };
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function DataRoomTab({ items, documents, projectId, projectStatus, lastAnalysisAt, onRefresh, onRerunAnalysis }: DataRoomTabProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [activeSection, setActiveSection] = useState<"checklist" | "files">("files");

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
      onRefresh();
    } catch {
      // handle error
    } finally {
      setUploading(false);
    }
  }, [projectId, onRefresh]);

  const toggleItem = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const priorities = ['critical', 'high', 'standard'];
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <BlurFade>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Data Room</h2>
            <p className="text-xs sm:text-sm text-default-400 mt-1">Source files and document request checklist.</p>
          </div>
          <label>
            <Button color="primary" size="sm" startContent={<Upload className="h-4 w-4" />} isLoading={uploading} as="span" className="cursor-pointer">
              Upload Files
            </Button>
            <input type="file" multiple className="hidden" onChange={handleUpload} accept=".pdf,.xlsx,.xls,.docx,.doc,.csv,.pptx,.ppt" />
          </label>
        </div>
      </BlurFade>

      {hasNewFiles && !isProcessing && (
        <Card shadow="sm" className="border-l-4 border-l-warning">
          <CardBody className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-warning shrink-0" />
              <div>
                <p className="text-sm font-medium">New files have been added</p>
                <p className="text-xs text-default-400">Re-run the analysis to incorporate the latest documents.</p>
              </div>
            </div>
            <Button size="sm" color="warning" variant="flat" startContent={<RefreshCw className="h-3.5 w-3.5" />} onPress={onRerunAnalysis}>
              Re-run Analysis
            </Button>
          </CardBody>
        </Card>
      )}

      {isProcessing && (
        <Card shadow="sm" className="border-l-4 border-l-primary">
          <CardBody className="flex flex-row items-center gap-3 py-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-default-200 border-t-primary shrink-0" />
            <div>
              <p className="text-sm font-medium">Analysis in progress</p>
              <p className="text-xs text-default-400">The report is being updated.</p>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <Button size="sm" variant={activeSection === "files" ? "solid" : "bordered"} color={activeSection === "files" ? "primary" : "default"} onPress={() => setActiveSection("files")} className="text-xs">
          Source Files ({documents.length})
        </Button>
        <Button size="sm" variant={activeSection === "checklist" ? "solid" : "bordered"} color={activeSection === "checklist" ? "primary" : "default"} onPress={() => setActiveSection("checklist")} className="text-xs">
          Request Checklist ({items.length})
        </Button>
      </div>

      {activeSection === "files" && (
        <div className="space-y-3">
          {documents.length === 0 ? (
            <Card shadow="sm">
              <CardBody>
                <label className="flex flex-col items-center justify-center py-8 sm:py-12 cursor-pointer text-center">
                  <Upload className="h-10 w-10 text-default-300 mb-3" />
                  <p className="text-sm font-semibold text-foreground">No source files yet</p>
                  <p className="text-xs text-default-400 mt-1 max-w-xs">Upload pitch decks, financial reports, and other documents.</p>
                  <input type="file" multiple className="hidden" onChange={handleUpload} accept=".pdf,.xlsx,.xls,.docx,.doc,.csv,.pptx,.ppt" />
                </label>
              </CardBody>
            </Card>
          ) : (
            <>
              {documents.map((doc, i) => {
                const info = getFileTypeInfo(doc.file_name);
                const Icon = info.icon;
                const isNew = lastAnalysisAt && new Date(doc.uploaded_at) > new Date(lastAnalysisAt);
                return (
                  <BlurFade key={doc.id} delay={i * 0.03}>
                    <Card shadow="sm" className={isNew ? 'ring-1 ring-warning/40' : ''}>
                      <CardBody className="flex flex-row items-center gap-3 py-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${info.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                            {isNew && <Chip size="sm" color="warning" variant="flat">New</Chip>}
                          </div>
                          <p className="text-[10px] text-default-400">{formatRelativeTime(doc.uploaded_at)} • {formatFileSize(doc.file_size)}</p>
                        </div>
                        <Chip size="sm" variant="flat" className={info.color}>{info.label}</Chip>
                      </CardBody>
                    </Card>
                  </BlurFade>
                );
              })}
              <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-default-200 hover:border-primary p-4 cursor-pointer transition-colors">
                <Plus className="h-4 w-4 text-default-400" />
                <span className="text-xs text-default-400">Add more files</span>
                <input type="file" multiple className="hidden" onChange={handleUpload} accept=".pdf,.xlsx,.xls,.docx,.doc,.csv,.pptx,.ppt" />
              </label>
            </>
          )}
        </div>
      )}

      {activeSection === "checklist" && (
        <div className="space-y-6">
          {selected.size > 0 && (
            <div className="flex items-center justify-end">
              <Button variant="bordered" size="sm" startContent={<Mail className="h-4 w-4" />}>
                Request {selected.size} Items
              </Button>
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
                    <Chip size="sm" color={meta.color} variant="dot">{meta.label}</Chip>
                  </div>
                  <p className="text-[10px] text-default-400 mb-4 ml-1">{meta.desc}</p>

                  <div className="space-y-5 ml-1">
                    {Object.entries(moduleGroups).map(([module, modItems]) => (
                      <div key={module}>
                        <div className="flex items-center gap-2 mb-2">
                          <FolderOpen className="h-3.5 w-3.5 text-default-400" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-default-400">{module}</span>
                        </div>
                        <div className="space-y-1.5">
                          {modItems.map((item) => (
                            <Card
                              key={item.id}
                              shadow="sm"
                              isPressable={!item.is_received}
                              onPress={() => !item.is_received && toggleItem(item.id)}
                              className={`${item.is_received ? 'opacity-50' : ''} ${selected.has(item.id) ? 'ring-1 ring-primary' : ''}`}
                            >
                              <CardBody className="flex flex-row items-start gap-3 py-3">
                                <Checkbox
                                  isSelected={item.is_received || selected.has(item.id)}
                                  isDisabled={item.is_received}
                                  onValueChange={() => !item.is_received && toggleItem(item.id)}
                                  size="sm"
                                  className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${item.is_received ? 'line-through text-default-400' : 'text-foreground'}`}>
                                    {item.document_name}
                                  </p>
                                  {item.purpose && (
                                    <p className="text-[11px] text-default-400 mt-0.5">{item.purpose}</p>
                                  )}
                                </div>
                              </CardBody>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {items.length === 0 && (
              <Card shadow="sm">
                <CardBody><p className="text-sm text-default-400 text-center py-8">No data room checklist items yet.</p></CardBody>
              </Card>
            )}
          </div>
        </div>
      )}

      <Card shadow="sm">
        <CardBody className="py-2.5">
          <span className="text-xs text-default-400">{documents.length} source files • {receivedCount}/{items.length} checklist items received</span>
        </CardBody>
      </Card>
    </div>
  );
}
