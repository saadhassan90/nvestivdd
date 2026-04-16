import { useState } from "react";
import { Copy, Check, Send, X, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  fundName: string;
  projectId: string;
}

export function ShareModal({ open, onClose, fundName, projectId }: ShareModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const shareUrl = `${window.location.origin}/project/${projectId}`;

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
            <h2 className="text-sm font-semibold text-foreground">Share Report</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{fundName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

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
      </div>
    </div>
  );
}
