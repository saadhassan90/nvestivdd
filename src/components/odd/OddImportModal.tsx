import { useRef, useState } from "react";
import { Upload, X, FileText, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface OddImportModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (files: { daseti: File; supporting: File[] }) => Promise<void>;
  onTestRun?: () => Promise<void>;
  hasExistingReport?: boolean;
}

const ACCEPTED = [".pdf", ".docx"];
const isAccepted = (f: File) => {
  const name = f.name.toLowerCase();
  return ACCEPTED.some((ext) => name.endsWith(ext));
};

export function OddImportModal({ open, onClose, onSubmit, onTestRun, hasExistingReport }: OddImportModalProps) {
  const [daseti, setDaseti] = useState<File | null>(null);
  const [supporting, setSupporting] = useState<File[]>([]);
  const [dasetiError, setDasetiError] = useState<string | null>(null);
  const [supportingError, setSupportingError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [testRunning, setTestRunning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const dasetiInputRef = useRef<HTMLInputElement>(null);
  const supportingInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleDasetiSelect = (file: File | null) => {
    setDasetiError(null);
    if (!file) return;
    if (!isAccepted(file)) {
      setDasetiError("Only PDF and DOCX files are accepted");
      return;
    }
    setDaseti(file);
  };

  const handleSupportingSelect = (files: FileList | null) => {
    setSupportingError(null);
    if (!files) return;
    const arr = Array.from(files);
    const bad = arr.find((f) => !isAccepted(f));
    if (bad) {
      setSupportingError("Only PDF and DOCX files are accepted");
      return;
    }
    setSupporting((prev) => [...prev, ...arr]);
  };

  const reset = () => {
    setDaseti(null);
    setSupporting([]);
    setDasetiError(null);
    setSupportingError(null);
    setSubmitting(false);
    setShowConfirm(false);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const runSubmit = async () => {
    if (!daseti) return;
    setSubmitting(true);
    try {
      await onSubmit({ daseti, supporting });
      reset();
      onClose();
    } catch (e) {
      setSubmitting(false);
      setDasetiError("Upload failed. Please try again.");
    }
  };

  const handlePrimary = () => {
    if (!daseti) return;
    if (hasExistingReport && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    runSubmit();
  };

  const handleTestRun = async () => {
    if (!onTestRun) return;
    setTestRunning(true);
    try {
      await onTestRun();
      reset();
      onClose();
    } catch (e) {
      setTestRunning(false);
      setDasetiError("Test run failed. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Import Daseti Data</h2>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Daseti export */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Daseti Export <span className="text-severity-critical">*</span>
            </label>
            <button
              type="button"
              onClick={() => dasetiInputRef.current?.click()}
              className={cn(
                "w-full rounded-lg border-2 border-dashed border-border p-4 text-left transition-colors hover:border-foreground/40 hover:bg-muted/40",
                daseti && "border-foreground/40 bg-muted/30",
              )}
            >
              {daseti ? (
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{daseti.name}</div>
                    <div className="text-xs text-muted-foreground">{(daseti.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Upload className="h-5 w-5" />
                  <div className="text-sm">Click to upload (PDF or DOCX)</div>
                </div>
              )}
            </button>
            <input
              ref={dasetiInputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => handleDasetiSelect(e.target.files?.[0] ?? null)}
            />
            {dasetiError && <p className="text-xs text-severity-critical mt-2">{dasetiError}</p>}
          </div>

          {/* Supporting docs */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Supporting Documents (optional)
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              LPA, PPM, ILPA DDQ, financials, compliance
            </p>
            <button
              type="button"
              onClick={() => supportingInputRef.current?.click()}
              className="w-full rounded-lg border-2 border-dashed border-border p-3 text-left transition-colors hover:border-foreground/40 hover:bg-muted/40"
            >
              <div className="flex items-center gap-3 text-muted-foreground">
                <Upload className="h-4 w-4" />
                <div className="text-sm">Click to add files</div>
              </div>
            </button>
            <input
              ref={supportingInputRef}
              type="file"
              accept=".pdf,.docx"
              multiple
              className="hidden"
              onChange={(e) => handleSupportingSelect(e.target.files)}
            />
            {supporting.length > 0 && (
              <ul className="mt-2 space-y-1">
                {supporting.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs"
                  >
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 truncate text-foreground">{f.name}</span>
                    <button
                      onClick={() => setSupporting((prev) => prev.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-severity-critical"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {supportingError && <p className="text-xs text-severity-critical mt-2">{supportingError}</p>}
          </div>

          {showConfirm && (
            <div className="rounded-md border border-severity-warning/40 bg-severity-warning/5 p-3 text-xs text-foreground">
              This will replace the existing ODD report. Continue?
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          {onTestRun && (
            <button
              onClick={handleTestRun}
              disabled={submitting || testRunning}
              className="mr-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-border text-foreground hover:bg-muted disabled:opacity-40"
              title="Generate a mock ODD report from existing fund data"
            >
              {testRunning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Test Run
            </button>
          )}
          <button
            onClick={handleClose}
            disabled={submitting || testRunning}
            className="px-3 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handlePrimary}
            disabled={!daseti || submitting || testRunning}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all",
              daseti && !submitting && !testRunning
                ? "bg-foreground text-background hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {showConfirm ? "Yes, replace report" : "Run ODD Analysis"}
          </button>
        </div>
      </div>
    </div>
  );
}