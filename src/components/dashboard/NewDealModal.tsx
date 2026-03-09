import { useState, useCallback } from "react";
import { X, Upload, FileText, FileSpreadsheet, File, Zap } from "lucide-react";
import { ShimmerButton } from "@/components/magicui/ShimmerButton";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewDealModalProps {
  open: boolean;
  onClose: () => void;
}

const ASSET_CLASSES = [
  "Private Equity", "Venture Capital", "Real Estate", "Hedge Fund",
  "Credit", "Growth Equity", "Biotech", "Infrastructure", "Other"
];

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <FileText className="h-4 w-4 text-severity-critical" />;
  if (ext === 'xlsx' || ext === 'xls') return <FileSpreadsheet className="h-4 w-4 text-score-strong" />;
  return <File className="h-4 w-4 text-severity-monitor" />;
}

export function NewDealModal({ open, onClose }: NewDealModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [fundName, setFundName] = useState("");
  const [assetClass, setAssetClass] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterCompany, setSubmitterCompany] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const newFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!fundName.trim() || files.length === 0 || !submitterName.trim() || !submitterCompany.trim() || !submitterEmail.trim()) return;
    setLoading(true);

    try {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          fund_name: fundName.trim(),
          asset_class: assetClass || null,
          status: 'uploading',
          submitter_name: submitterName.trim(),
          submitter_company: submitterCompany.trim(),
          submitter_email: submitterEmail.trim(),
        } as any)
        .select()
        .single();

      if (projectError || !project) throw projectError;

      for (const file of files) {
        const filePath = `${project.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const ext = file.name.split('.').pop()?.toLowerCase();
        let fileType = 'other';
        if (ext === 'pdf') fileType = 'cim';
        else if (ext === 'xlsx' || ext === 'xls') fileType = 'financial_model';

        await supabase.from('documents').insert({
          project_id: project.id,
          file_name: file.name,
          file_path: filePath,
          file_type: fileType,
          file_size: file.size,
        });
      }

      await supabase.from('task_queue').insert({
        project_id: project.id,
        task_type: 'l1_analysis',
        status: 'pending',
      });

      await supabase.from('projects').update({ status: 'processing' }).eq('id', project.id);

      toast({ title: "Analysis queued", description: `${fundName} has been submitted for analysis.` });
      onClose();
      navigate(`/project/${project.id}`);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to create deal. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl">
        <button onClick={onClose} className="absolute right-4 top-4 p-1 rounded-md hover:bg-muted transition-colors">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        <h2 className="text-lg sm:text-xl font-bold text-foreground pr-8">New Deal Analysis</h2>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Upload documents and configure deal parameters to start AI extraction.</p>

        {/* Step 1: Upload */}
        <div className="mt-5 sm:mt-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upload Documents</span>
          </div>
          <div
            className="rounded-xl border-2 border-dashed border-border p-6 sm:p-8 text-center transition-colors hover:border-muted-foreground/40 cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium text-foreground">Click to upload or drag and drop</p>
            <p className="mt-1 text-xs text-muted-foreground">LPA, CIM, or Financial Models (PDF, XLSX, DOCX)</p>
            <input
              id="file-input"
              type="file"
              multiple
              accept=".pdf,.xlsx,.xls,.docx,.doc"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>
        </div>

        {/* Step 2: Settings */}
        {files.length > 0 && (
          <div className="mt-5 sm:mt-6 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deal Details</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {files.map((file, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs">
                  {getFileIcon(file.name)}
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <button onClick={() => removeFile(i)} className="ml-1 hover:text-severity-critical">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Fund Name</label>
                <input
                  type="text"
                  placeholder="e.g. Blackstone Capital VIII"
                  value={fundName}
                  onChange={(e) => setFundName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Asset Class</label>
                <Select value={assetClass} onValueChange={setAssetClass}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_CLASSES.map(ac => (
                      <SelectItem key={ac} value={ac}>{ac}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submitted By */}
            <div className="pt-3 border-t border-border">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Submitted By</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Your Name <span className="text-destructive">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Jane Smith"
                    value={submitterName}
                    onChange={(e) => setSubmitterName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Company <span className="text-destructive">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Meridian Capital"
                    value={submitterCompany}
                    onChange={(e) => setSubmitterCompany(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Email <span className="text-destructive">*</span></label>
                <input
                  type="email"
                  placeholder="e.g. jane@meridian.com"
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 sm:mt-8 flex items-center justify-between">
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <ShimmerButton
            onClick={handleSubmit}
            disabled={!fundName.trim() || files.length === 0 || loading}
          >
            {loading ? "Submitting..." : "Begin Analysis"}
            <Zap className="h-4 w-4" />
          </ShimmerButton>
        </div>
      </div>
    </div>
  );
}
