import { useMemo, useState } from "react";
import { CheckCircle2, PenLine, ShieldCheck, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MarkdownContent } from "@/components/project/MarkdownContent";
import { SignaturePad } from "@/components/gp/SignaturePad";
import { getDefaultTemplate, renderNdaBody } from "@/mocks/gp/ndas";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  raiseName: string;
  signed: boolean;
  onSigned: () => void;
}

type JourneyStep = { id: string; label: string; help: string };

const JOURNEY: JourneyStep[] = [
  { id: "invite", label: "Invite received", help: "LP receives a secure NDA link by email." },
  { id: "review", label: "Review terms", help: "LP reads the mutual NDA in the browser." },
  { id: "identify", label: "Identify signatory", help: "Full legal name and title captured." },
  { id: "sign", label: "Draw signature", help: "Signature captured on canvas, hashed and timestamped." },
  { id: "countersign", label: "GP countersignature", help: "GP receives and counter-signs to finalise." },
];

export function NdaPreviewDrawer({ open, onClose, raiseName, signed, onSigned }: Props) {
  const tpl = getDefaultTemplate();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [agree, setAgree] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [padOpen, setPadOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);

  const body = useMemo(
    () =>
      renderNdaBody(tpl.bodyMd, {
        raiseName,
        lpName: "Acme Capital Partners LP",
        signerName: name,
        signerTitle: title,
        createdAt: new Date().toISOString(),
        signedAt: signed ? new Date().toISOString() : undefined,
      }),
    [tpl.bodyMd, raiseName, name, title, signed],
  );

  const canSubmit = name.trim() && title.trim() && agree && signature;

  const submit = () => {
    if (!canSubmit) return;
    onSigned();
  };

  // Determine journey progress
  const stepDone = (id: string) => {
    if (signed) return true;
    if (id === "invite" || id === "review") return open;
    if (id === "identify") return Boolean(name.trim() && title.trim());
    if (id === "sign") return Boolean(signature);
    return false;
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-3xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-foreground" />
            <SheetTitle className="text-base">NDA — LP signing journey</SheetTitle>
          </div>
          <SheetDescription className="text-xs">
            Preview of the mutual NDA as the LP will experience it for <span className="text-foreground font-medium">{raiseName}</span>.
          </SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto flex-1">
          {/* Journey strip */}
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-3">Journey</p>
            <ol className="grid grid-cols-5 gap-2">
              {JOURNEY.map((s, i) => {
                const done = stepDone(s.id);
                return (
                  <li key={s.id} className="flex flex-col items-start gap-1.5">
                    <div className="flex items-center gap-1.5 w-full">
                      <span className={cn(
                        "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                        done ? "bg-foreground text-background" : "bg-muted text-muted-foreground border border-border",
                      )}>
                        {done ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                      </span>
                      <div className={cn(
                        "flex-1 h-px",
                        i === JOURNEY.length - 1 ? "invisible" : done ? "bg-foreground" : "bg-border",
                      )} />
                    </div>
                    <p className="text-[11px] font-medium text-foreground leading-tight">{s.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-snug">{s.help}</p>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Document */}
          <div className="px-6 py-5">
            <div className="rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Mutual NDA</p>
                  <h3 className="text-sm font-semibold text-foreground mt-0.5">{tpl.name}</h3>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">v{tpl.version}</span>
              </div>
              <div className="px-6 py-5 max-h-[42vh] overflow-y-auto">
                <MarkdownContent content={body} />
              </div>
            </div>
          </div>

          {/* Signing block */}
          <div className="px-6 pb-6">
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-semibold text-foreground">Sign as LP</h3>
                {signed && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" /> Signed
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Full legal name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={signed}
                    placeholder="Jane Doe"
                    className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:border-foreground disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Title / capacity</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={signed}
                    placeholder="Authorized Signatory"
                    className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:border-foreground disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Signature</label>
                <button
                  type="button"
                  onClick={() => { setDraft(signature); setPadOpen(true); }}
                  disabled={signed}
                  className={cn(
                    "mt-1 w-full h-28 rounded-md border border-dashed flex items-center justify-center relative overflow-hidden transition-colors",
                    signature ? "border-foreground/40 bg-background" : "border-border bg-muted/30 hover:border-foreground/40",
                    signed && "opacity-80 cursor-default",
                  )}
                >
                  {signature ? (
                    <img src={signature} alt="Signature" className="max-h-24 max-w-full object-contain" />
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <PenLine className="h-3.5 w-3.5" /> Click to draw your signature
                    </span>
                  )}
                </button>
              </div>

              <label className="flex items-start gap-2 text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  disabled={signed}
                  className="mt-0.5 accent-foreground"
                />
                <span>
                  I have read and agree to the terms of this Mutual Non-Disclosure Agreement, and consent to executing it electronically.
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground hover:bg-muted"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={!canSubmit || signed}
                  className="rounded-md bg-foreground text-background px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                >
                  {signed ? "Signed" : "Sign & accept"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>

      <Dialog open={padOpen} onOpenChange={setPadOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">Draw your signature</DialogTitle>
          </DialogHeader>
          <div className="rounded-md border border-border bg-background">
            <SignaturePad onChange={setDraft} />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Use your mouse or finger to sign. Your signature is hashed and timestamped on submission.
          </p>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setPadOpen(false)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground hover:bg-muted inline-flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Cancel
            </button>
            <button
              type="button"
              onClick={() => { setSignature(draft); setPadOpen(false); }}
              disabled={!draft}
              className="rounded-md bg-foreground text-background px-3 py-1.5 text-xs font-medium disabled:opacity-40"
            >
              Apply signature
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}