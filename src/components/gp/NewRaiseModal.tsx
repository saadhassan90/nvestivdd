import { useCallback, useState } from "react";
import { X, Upload, FileText, FileSpreadsheet, File as FileIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { createRaise } from "@/mocks/gp/raises";

interface Props {
  open: boolean;
  onClose: () => void;
}

const RECOMMENDED_DOCS = [
  "Pitch Deck / Teaser",
  "PPM / Offering Memorandum",
  "Track record (prior funds)",
  "Team bios",
  "LPA / Side letter precedent",
];

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <FileText className="h-4 w-4 text-muted-foreground" />;
  if (ext === "xlsx" || ext === "xls") return <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />;
  return <FileIcon className="h-4 w-4 text-muted-foreground" />;
}

function inferCategory(name: string): "Fund docs" | "Track record" | "Team" | "Operations" | "Legal" {
  const n = name.toLowerCase();
  if (n.includes("lpa") || n.includes("legal") || n.includes("side")) return "Legal";
  if (n.includes("team") || n.includes("bio")) return "Team";
  if (n.includes("track") || n.includes("perf") || n.includes("model")) return "Track record";
  if (n.includes("ops") || n.includes("operat")) return "Operations";
  return "Fund docs";
}

export function NewRaiseModal({ open, onClose }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState("");
  const [strategy, setStrategy] = useState("");
  const [targetSize, setTargetSize] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterCompany, setSubmitterCompany] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const canSubmit =
    name.trim() && files.length > 0 && submitterName.trim() && submitterCompany.trim() && submitterEmail.trim();

  const reset = () => {
    setFiles([]); setName(""); setStrategy(""); setTargetSize("");
    setSubmitterName(""); setSubmitterCompany(""); setSubmitterEmail("");
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    // Mock: simulate async create, then push into mock store.
    await new Promise((r) => setTimeout(r, 500));
    const raise = createRaise({
      name: name.trim(),
      strategy: strategy.trim() || undefined,
      targetSize: targetSize.trim() || undefined,
      files: files.map((f) => ({
        name: f.name,
        sizeKb: Math.max(1, Math.round(f.size / 1024)),
        category: inferCategory(f.name),
      })),
      submitter: {
        name: submitterName.trim(),
        company: submitterCompany.trim(),
        email: submitterEmail.trim(),
      },
    });
    toast({ title: "Raise created", description: `${raise.name} is set up. IRIS will start drafting the report card.` });
    setLoading(false);
    reset();
    onClose();
    navigate(`/raises/${raise.id}`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl">
        <button onClick={onClose} className="absolute right-4 top-4 p-1 rounded-md hover:bg-muted transition-colors">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        <h2 className="text-lg sm:text-xl font-bold text-foreground pr-8">New Raise</h2>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Upload your deck and any dataroom files. IRIS will set up the report card and DDQ shell automatically.
        </p>

        {/* Step 1: Raise basics */}
        <div className="mt-5 sm:mt-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
            <span className="text-xs font-medium text-muted-foreground">Raise basics</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Fund name <span className="text-destructive">*</span></label>
              <input
                type="text"
                placeholder="e.g. Meridian Credit Opportunities IV"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Strategy</label>
                <input
                  type="text"
                  placeholder="e.g. Opportunistic credit"
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Target size</label>
                <input
                  type="text"
                  placeholder="e.g. $1.2B"
                  value={targetSize}
                  onChange={(e) => setTargetSize(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Upload */}
        <div className="mt-5 sm:mt-6 pt-3 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
            <span className="text-xs font-medium text-muted-foreground">Deck & Dataroom</span>
          </div>
          <div
            className="rounded-xl border-2 border-dashed border-border p-5 sm:p-6 text-center transition-colors hover:border-muted-foreground/40 cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById("raise-file-input")?.click()}
          >
            <Upload className="mx-auto h-7 w-7 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium text-foreground">Click to upload or drag and drop</p>
            <p className="mt-1 text-xs text-muted-foreground">PDF, XLSX, DOCX</p>
            <input
              id="raise-file-input"
              type="file"
              multiple
              accept=".pdf,.xlsx,.xls,.docx,.doc,.pptx,.ppt"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>
          <div className="mt-3 space-y-1.5">
            <p className="text-[11px] text-muted-foreground">Recommended</p>
            {RECOMMENDED_DOCS.map((doc) => (
              <div key={doc} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                <span className="text-xs text-muted-foreground">{doc}</span>
              </div>
            ))}
          </div>
          {files.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {files.map((file, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs">
                  {getFileIcon(file.name)}
                  <span className="max-w-[140px] truncate">{file.name}</span>
                  <button onClick={() => removeFile(i)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Step 3: Submitted by */}
        <div className="mt-5 sm:mt-6 pt-3 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
            <span className="text-xs font-medium text-muted-foreground">Submitted by</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Your name <span className="text-destructive">*</span></label>
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

        <div className="mt-6 sm:mt-8 flex items-center justify-between">
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-foreground/90 transition-colors"
          >
            {loading ? "Creating…" : "Create Raise"}
          </button>
        </div>
      </div>
    </div>
  );
}