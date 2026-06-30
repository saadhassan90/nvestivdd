import { useState } from "react";
import { X, Send, Copy, Check, Link2, Mail, Calendar, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  raiseName: string;
  raiseId: string;
}

const SHAREABLE: ReadonlyArray<{ key: string; label: string; desc: string; required?: boolean }> = [
  { key: "overview", label: "Overview", desc: "Fund summary, strategy, target size.", required: true },
  { key: "dataroom", label: "Data Room", desc: "Documents, financials, legal materials." },
  { key: "ddq", label: "DDQ", desc: "Due diligence questionnaire responses." },
];

const PERMISSIONS = [
  { key: "view", label: "View only" },
  { key: "download", label: "View & download" },
] as const;

const EXPIRY = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "never", label: "No expiry" },
] as const;

export function ShareRaiseModal({ open, onClose, raiseName, raiseId }: Props) {
  const { toast } = useToast();
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [sections, setSections] = useState<Record<string, boolean>>({
    overview: true,
    dataroom: true,
    ddq: true,
  });
  const [permission, setPermission] = useState<(typeof PERMISSIONS)[number]["key"]>("view");
  const [expiry, setExpiry] = useState<(typeof EXPIRY)[number]["key"]>("30");
  const [requireNda, setRequireNda] = useState(true);
  const [notifyOnView, setNotifyOnView] = useState(true);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const link = `${window.location.origin}/raises/${raiseId}/shared`;

  const addEmail = () => {
    const e = emailInput.trim().replace(/,$/, "");
    if (e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && !emails.includes(e)) {
      setEmails([...emails, e]);
    }
    setEmailInput("");
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === "," || e.key === " ") && emailInput.trim()) {
      e.preventDefault();
      addEmail();
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast({ title: "Link copied", description: "Share link copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const send = async () => {
    if (emails.length === 0) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 700));
    toast({
      title: "Invitations sent",
      description: `${raiseName} shared with ${emails.length} recipient${emails.length > 1 ? "s" : ""}.`,
    });
    setEmails([]);
    setMessage("");
    setSending(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-4 rounded-xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">Share raise</h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{raiseName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Recipients */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3 w-3" /> Recipients
            </label>
            <div className="mt-1.5 rounded-lg border border-border bg-muted/50 p-2 min-h-[44px]">
              <div className="flex flex-wrap gap-1.5 mb-1">
                {emails.map((e) => (
                  <span
                    key={e}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-medium text-foreground"
                  >
                    {e}
                    <button
                      onClick={() => setEmails(emails.filter((x) => x !== e))}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={onKey}
                onBlur={addEmail}
                placeholder={emails.length === 0 ? "investor@example.com" : "Add another..."}
                className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none py-1"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Press Enter or comma to add multiple recipients.
            </p>
          </div>

          {/* What to share */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">
              What to share
            </label>
            <div className="mt-1.5 space-y-1.5">
              {SHAREABLE.map((s) => {
                const checked = !!sections[s.key];
                return (
                  <label
                    key={s.key}
                    className={cn(
                      "flex items-start gap-2.5 rounded-md border px-2.5 py-2 cursor-pointer transition-colors",
                      checked ? "border-foreground bg-muted/60" : "border-border hover:bg-muted/40",
                      s.required && "opacity-90",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="accent-foreground h-3.5 w-3.5 mt-0.5"
                      checked={checked}
                      disabled={s.required}
                      onChange={(e) =>
                        setSections({ ...sections, [s.key]: e.target.checked })
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                        {s.label}
                        {s.required && (
                        <span className="text-[10px] text-muted-foreground">
                            required
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{s.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Permissions + expiry */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">
                Access
              </label>
              <div className="mt-1.5 grid grid-cols-1 gap-1">
                {PERMISSIONS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPermission(p.key)}
                    className={cn(
                      "text-left text-xs rounded-md border px-2.5 py-1.5 transition-colors",
                      permission === p.key
                        ? "border-foreground bg-muted/60 text-foreground font-medium"
                        : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/40",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3 w-3" /> Link expires
              </label>
              <div className="mt-1.5 grid grid-cols-1 gap-1">
                {EXPIRY.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setExpiry(p.key)}
                    className={cn(
                      "text-left text-xs rounded-md border px-2.5 py-1.5 transition-colors",
                      expiry === p.key
                        ? "border-foreground bg-muted/60 text-foreground font-medium"
                        : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/40",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-1.5">
            <ToggleRow
              label="Require NDA acceptance"
              desc="Recipients must accept NDA before viewing."
              checked={requireNda}
              onChange={setRequireNda}
            />
            <ToggleRow
              label="Notify me on view"
              desc="Get an email when a recipient opens the link."
              checked={notifyOnView}
              onChange={setNotifyOnView}
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="h-3 w-3" /> Personal note (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Hi — sharing our latest raise materials for your review…"
              className="mt-1.5 w-full rounded-lg border border-border bg-muted/50 px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground resize-none"
            />
          </div>

          {/* Link row */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5">
            <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="flex-1 min-w-0 text-[11px] text-foreground truncate">{link}</span>
            <button
              onClick={copyLink}
              className="flex items-center gap-1 text-[11px] font-medium text-foreground hover:text-foreground/80"
            >
              {copied ? <Check className="h-3 w-3 text-score-strong" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-border">
          <button
            onClick={send}
            disabled={emails.length === 0 || sending}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-3.5 w-3.5" />
            {sending
              ? "Sending..."
              : emails.length === 0
                ? "Add a recipient"
                : `Send to ${emails.length} recipient${emails.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-start justify-between gap-3 rounded-md border border-border px-2.5 py-2 hover:bg-muted/40 transition-colors text-left"
    >
      <div className="min-w-0">
        <div className="text-xs font-medium text-foreground">{label}</div>
        <div className="text-[11px] text-muted-foreground">{desc}</div>
      </div>
      <span
        className={cn(
          "mt-0.5 inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-foreground" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "inline-block h-3 w-3 rounded-full bg-background transition-transform",
            checked ? "translate-x-3.5" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}