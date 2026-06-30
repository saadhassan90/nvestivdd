import { useState } from "react";
import { X, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { NDA_TEMPLATES, createNda, sendNda, getNdaByLp } from "@/mocks/gp/ndas";

interface Props {
  open: boolean;
  onClose: () => void;
  raiseId: string;
  raiseName: string;
  lpId: string;
  lpName: string;
  defaultEmail?: string;
}

const EXPIRY = [
  { key: 7, label: "7 days" },
  { key: 14, label: "14 days" },
  { key: 30, label: "30 days" },
];

export function SendNdaModal({ open, onClose, raiseId, raiseName, lpId, lpName, defaultEmail }: Props) {
  const { toast } = useToast();
  const [templateId, setTemplateId] = useState(NDA_TEMPLATES[0].id);
  const [expiryDays, setExpiryDays] = useState(30);
  const [email, setEmail] = useState(defaultEmail ?? `${lpName.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const submit = async () => {
    setSending(true);
    const existing = getNdaByLp(raiseId, lpId);
    const rec = existing ?? createNda({
      raiseId, raiseName, lpId, lpName,
      lpEmail: email,
      templateId,
      expiryDays,
    });
    sendNda(rec.id, expiryDays);
    await new Promise((r) => setTimeout(r, 400));
    toast({ title: "NDA sent", description: `Sent to ${email}.` });
    setSending(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md mx-4 rounded-xl border border-border bg-card shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Send NDA</h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{lpName} · {raiseName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Recipient email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-muted/50 px-2.5 py-2 text-xs text-foreground focus:outline-none focus:border-foreground"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Template</label>
            <div className="mt-1.5 space-y-1">
              {NDA_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateId(t.id)}
                  className={cn(
                    "w-full text-left rounded-md border px-2.5 py-1.5 text-xs",
                    templateId === t.id
                      ? "border-foreground bg-muted/60 text-foreground font-medium"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/40",
                  )}
                >
                  {t.name} <span className="text-muted-foreground">v{t.version}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Link expires in</label>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {EXPIRY.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setExpiryDays(p.key)}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-xs",
                    expiryDays === p.key
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
            <label className="text-[11px] font-medium text-muted-foreground">Personal note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="mt-1.5 w-full rounded-lg border border-border bg-muted/50 px-2.5 py-2 text-xs text-foreground focus:outline-none focus:border-foreground resize-none"
              placeholder="Please review and sign to access the data room…"
            />
          </div>
        </div>
        <div className="p-4 border-t border-border">
          <button
            onClick={submit}
            disabled={sending || !email}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
            {sending ? "Sending…" : "Send NDA"}
          </button>
        </div>
      </div>
    </div>
  );
}