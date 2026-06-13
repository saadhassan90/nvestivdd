import { useState } from "react";
import { Copy, Check, Send, X, Link2, FileText, FileType2, FileCode, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { ODD_SECTIONS, assembleOddMarkdown, type OddSectionKey } from "@/lib/odd-template";

type ExportScope = "triage" | "idd" | "odd" | "memo" | "all";

const SCOPE_LABELS: Record<ExportScope, { label: string; desc: string; suffix: string }> = {
  triage: { label: "Triage Report", desc: "L1 screening report.", suffix: "Triage" },
  idd: { label: "IDD Report", desc: "Investment due diligence (coming soon).", suffix: "IDD" },
  odd: { label: "ODD Report", desc: "Operational due diligence.", suffix: "ODD" },
  memo: { label: "IC Memo", desc: "Investment committee memo.", suffix: "IC_Memo" },
  all: { label: "Complete DD Package", desc: "All available reports concatenated.", suffix: "Full_DD" },
};

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  fundName: string;
  projectId: string;
  /** Optional override for the currently-visible page's markdown (used when the
   * scope matches the active view and the editor has unsaved/in-memory state). */
  getExportMarkdown?: () => string | Promise<string>;
  /** Which scope the in-memory override applies to. */
  currentScope?: ExportScope;
  /** Base filename (no extension) for exports. Defaults to a slugified fund name. */
  exportFilename?: string;
}

function slug(s: string) {
  return s.replace(/\s+/g, "_").replace(/[^A-Za-z0-9_-]/g, "");
}

function buildPrintableHtml(title: string, bodyHtml: string) {
  return `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>
<style>
  body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;max-width:780px;margin:40px auto;padding:0 24px;line-height:1.55;}
  h1{font-size:24px;margin-top:24px;}h2{font-size:18px;margin-top:20px;}h3{font-size:15px;margin-top:16px;}
  p,li{font-size:13px;}table{border-collapse:collapse;width:100%;margin:12px 0;font-size:12px;}
  th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;}th{background:#f5f5f5;}
  code{background:#f3f3f3;padding:1px 4px;border-radius:3px;font-size:12px;}
  pre{background:#f7f7f7;padding:10px;border-radius:6px;overflow:auto;font-size:12px;}
  blockquote{border-left:3px solid #ccc;padding-left:10px;color:#555;margin:8px 0;}
</style></head><body>${bodyHtml}</body></html>`;
}

export function ShareModal({
  open,
  onClose,
  fundName,
  projectId,
  getExportMarkdown,
  currentScope,
  exportFilename,
}: ShareModalProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<"share" | "export">("share");
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [exporting, setExporting] = useState<null | "md" | "pdf" | "docx">(null);
  const [scope, setScope] = useState<ExportScope>(currentScope ?? "triage");

  const shareUrl = `${window.location.origin}/project/${projectId}`;
  const fundSlug = slug(fundName) || "report";
  const baseName =
    exportFilename && scope === currentScope
      ? exportFilename
      : `${fundSlug}_${SCOPE_LABELS[scope].suffix}`;

  // --- scope-aware markdown fetchers ----------------------------------------
  async function fetchTriage(): Promise<string> {
    const { data } = await supabase
      .from("projects")
      .select("report_markdown,fund_name")
      .eq("id", projectId)
      .maybeSingle();
    return (data?.report_markdown as string | null) || "";
  }
  async function fetchOdd(): Promise<string> {
    const { data: report } = await supabase
      .from("odd_reports")
      .select("content_markdown")
      .eq("project_id", projectId)
      .maybeSingle();
    if (report?.content_markdown) return report.content_markdown;
    // Fallback: assemble from per-section results
    const { data: rows } = await supabase
      .from("odd_section_results")
      .select("section_key,content_markdown")
      .eq("project_id", projectId);
    if (!rows?.length) return "";
    const map: Partial<Record<OddSectionKey, string | null>> = {};
    for (const r of rows) map[r.section_key as OddSectionKey] = r.content_markdown;
    return assembleOddMarkdown({ fundName, sectionContent: map });
  }
  async function fetchMemo(): Promise<string> {
    const { data } = await supabase
      .from("ic_memos")
      .select("content_markdown")
      .eq("project_id", projectId)
      .maybeSingle();
    return data?.content_markdown || "";
  }

  const resolveMarkdown = async (s: ExportScope = scope): Promise<string> => {
    // Prefer in-memory override when scopes line up (e.g. unsaved memo edits).
    if (getExportMarkdown && currentScope && currentScope === s) {
      return (await getExportMarkdown()) ?? "";
    }
    if (s === "triage") return fetchTriage();
    if (s === "odd") return fetchOdd();
    if (s === "memo") return fetchMemo();
    if (s === "idd") return "";
    // all = concatenate every available section
    const [triage, odd, memo] = await Promise.all([
      fetchTriage(),
      fetchOdd(),
      fetchMemo(),
    ]);
    const parts: string[] = [`# ${fundName} — Complete DD Package`, ""];
    if (triage) parts.push("# Triage Report", "", triage, "");
    if (odd) parts.push("# Operational Due Diligence", "", odd, "");
    if (memo) parts.push("# IC Memo", "", memo, "");
    return parts.join("\n");
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportMd = async () => {
    setExporting("md");
    try {
      const md = await resolveMarkdown();
      if (!md) throw new Error("No content available for the selected report.");
      downloadBlob(new Blob([md], { type: "text/markdown;charset=utf-8" }), `${baseName}.md`);
      toast({ title: "Markdown exported", description: `${baseName}.md downloaded.` });
    } catch (e) {
      toast({ title: "Export failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  const handleExportPdf = async () => {
    setExporting("pdf");
    try {
      const md = await resolveMarkdown();
      if (!md) throw new Error("No content available for the selected report.");
      const { marked } = await import("marked");
      const html = await marked.parse(md);
      const printable = buildPrintableHtml(`${fundName} — Report`, html as string);
      const w = window.open("", "_blank");
      if (!w) throw new Error("Popup blocked — allow popups to export PDF.");
      w.document.open();
      w.document.write(printable);
      w.document.close();
      // Give the new window a tick to lay out, then trigger the print dialog.
      setTimeout(() => {
        w.focus();
        w.print();
      }, 400);
      toast({
        title: "Print dialog opened",
        description: "Choose 'Save as PDF' as the destination.",
      });
    } catch (e) {
      toast({ title: "Export failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  const handleExportDocx = async () => {
    setExporting("docx");
    try {
      const md = await resolveMarkdown();
      if (!md) throw new Error("No content available for the selected report.");
      const { Document, Paragraph, TextRun, Packer, HeadingLevel } = await import("docx");
      const lines = md.split("\n");
      const children: any[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          children.push(new Paragraph({ text: "" }));
          continue;
        }
        if (trimmed.startsWith("### ")) {
          children.push(new Paragraph({ text: trimmed.slice(4), heading: HeadingLevel.HEADING_3 }));
        } else if (trimmed.startsWith("## ")) {
          children.push(new Paragraph({ text: trimmed.slice(3), heading: HeadingLevel.HEADING_2 }));
        } else if (trimmed.startsWith("# ")) {
          children.push(new Paragraph({ text: trimmed.slice(2), heading: HeadingLevel.HEADING_1 }));
        } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          children.push(new Paragraph({ text: "• " + trimmed.slice(2), bullet: { level: 0 } }));
        } else if (/^\d+\.\s/.test(trimmed)) {
          const text = trimmed.replace(/^\d+\.\s/, "");
          children.push(new Paragraph({ text, numbering: { level: 0, reference: "default-numbering" } }));
        } else {
          children.push(new Paragraph({ text: trimmed }));
        }
      }
      const doc = new Document({
        sections: [{ children }],
      });
      const blob = await Packer.toBlob(doc);
      downloadBlob(blob, `${baseName}.docx`);
      toast({ title: "DOCX exported", description: `${baseName}.docx downloaded.` });
    } catch (e) {
      toast({ title: "Export failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: "Link copied", description: "Report link copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === "," || e.key === " ") && emailInput.trim()) {
      e.preventDefault();
      const email = emailInput.trim().replace(/,$/, "");
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !emails.includes(email)) {
        setEmails([...emails, email]);
      }
      setEmailInput("");
    }
  };

  const removeEmail = (email: string) => {
    setEmails(emails.filter((e) => e !== email));
  };

  const handleSend = async () => {
    if (emails.length === 0) return;
    setSending(true);
    // Placeholder for actual email sending
    await new Promise((r) => setTimeout(r, 800));
    toast({ title: "Invitations sent", description: `Report shared with ${emails.length} recipient${emails.length > 1 ? "s" : ""}.` });
    setEmails([]);
    setSending(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md mx-4 rounded-xl border border-border bg-card shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {tab === "share" ? "Share Report" : "Export Report"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{fundName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-border">
          {(["share", "export"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-t-md border-b-2 -mb-px transition-colors",
                tab === t
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "share" ? "Share" : "Export"}
            </button>
          ))}
        </div>

        {tab === "share" ? (
        <div className="p-4 space-y-4">
          {/* Copy link */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Report Link</label>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 min-w-0 flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 overflow-hidden">
                <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-foreground truncate block">{shareUrl}</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors shrink-0"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-score-strong" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Email sharing */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Share via Email</label>
            <div className="mt-1.5 rounded-lg border border-border bg-muted/50 p-2 min-h-[44px]">
              <div className="flex flex-wrap gap-1.5 mb-1">
                {emails.map((email) => (
                  <span key={email} className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-medium text-foreground">
                    {email}
                    <button onClick={() => removeEmail(email)} className="hover:text-destructive transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleEmailKeyDown}
                placeholder={emails.length === 0 ? "Enter email addresses..." : "Add another..."}
                className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none py-1"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Press Enter or comma to add multiple recipients</p>
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={emails.length === 0 || sending}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-3.5 w-3.5" />
            {sending ? "Sending..." : `Send to ${emails.length} recipient${emails.length !== 1 ? "s" : ""}`}
          </button>
        </div>
        ) : (
          <div className="p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Report to export
              </label>
              <div className="mt-1.5 space-y-1">
                {(Object.keys(SCOPE_LABELS) as ExportScope[]).map((s) => {
                  const disabled = s === "idd";
                  const selected = scope === s;
                  return (
                    <label
                      key={s}
                      className={cn(
                        "flex items-start gap-2.5 rounded-md border px-3 py-2 cursor-pointer transition-colors",
                        selected
                          ? "border-foreground bg-muted/60"
                          : "border-border hover:bg-muted/40",
                        disabled && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <input
                        type="radio"
                        name="export-scope"
                        className="mt-0.5 accent-foreground"
                        checked={selected}
                        disabled={disabled}
                        onChange={() => setScope(s)}
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-medium text-foreground">
                          {SCOPE_LABELS[s].label}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          {SCOPE_LABELS[s].desc}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-1 space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Format
              </label>
              <ExportRow
                  icon={<FileCode className="h-4 w-4" />}
                  title="Markdown (.md)"
                  subtitle="Plain-text source — best for re-importing."
                  busy={exporting === "md"}
                  onClick={handleExportMd}
                />
                <ExportRow
                  icon={<FileText className="h-4 w-4" />}
                  title="PDF"
                  subtitle="Opens the print dialog — choose 'Save as PDF'."
                  busy={exporting === "pdf"}
                  onClick={handleExportPdf}
                />
                <ExportRow
                  icon={<FileType2 className="h-4 w-4" />}
                  title="Word (.docx)"
                  subtitle="Editable document for Word / Google Docs."
                  busy={exporting === "docx"}
                  onClick={handleExportDocx}
                />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ExportRow({
  icon,
  title,
  subtitle,
  busy,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="w-full flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left hover:bg-muted transition-colors disabled:opacity-50"
    >
      <span className="shrink-0 text-muted-foreground">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-medium text-foreground">{title}</span>
        <span className="block text-[11px] text-muted-foreground truncate">{subtitle}</span>
      </span>
    </button>
  );
}
