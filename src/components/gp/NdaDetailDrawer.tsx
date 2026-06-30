import { X, Download, RotateCw, Ban, CheckCircle2 } from "lucide-react";
import { NdaStatusPill } from "./NdaStatusPill";
import { countersignNda, revokeNda, sendNda, type NdaRecord } from "@/mocks/gp/ndas";
import { downloadNdaPdf } from "@/lib/nda-pdf";
import { useToast } from "@/hooks/use-toast";

interface Props {
  nda: NdaRecord | null;
  onClose: () => void;
}

function fmt(ts?: string) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

export function NdaDetailDrawer({ nda, onClose }: Props) {
  const { toast } = useToast();
  if (!nda) return null;

  const canSend = ["not_sent", "expired", "declined", "revoked"].includes(nda.status);
  const canResend = ["sent", "viewed"].includes(nda.status);
  const canCountersign = nda.status === "signed";
  const canRevoke = !["revoked", "countersigned"].includes(nda.status);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md h-full bg-card border-l border-border shadow-2xl overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground truncate">{nda.lpName}</h2>
              <NdaStatusPill status={nda.status} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{nda.raiseName} · {nda.lpEmail}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4 text-xs">
          <Grid label="Created" value={fmt(nda.createdAt)} />
          <Grid label="Sent" value={fmt(nda.sentAt)} />
          <Grid label="Viewed" value={fmt(nda.viewedAt)} />
          <Grid label="Signed" value={fmt(nda.signedAt)} />
          <Grid label="Countersigned" value={fmt(nda.countersignedAt)} />
          <Grid label="Expires" value={fmt(nda.expiresAt)} />

          {nda.signerName && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="text-[11px] text-muted-foreground mb-1">Signer</div>
              <div className="text-xs text-foreground font-medium">{nda.signerName}</div>
              {nda.signerTitle && <div className="text-[11px] text-muted-foreground">{nda.signerTitle}</div>}
              {nda.signatureDataUrl && (
                <img src={nda.signatureDataUrl} alt="Signature" className="mt-2 max-h-16 bg-white rounded" />
              )}
            </div>
          )}

          <div>
            <div className="text-[11px] text-muted-foreground mb-1.5">Audit trail</div>
            <div className="space-y-1">
              {nda.auditTrail.map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px]">
                  <span className="text-muted-foreground tabular-nums shrink-0 w-32">{fmt(e.ts)}</span>
                  <span className="text-muted-foreground shrink-0 w-10">{e.actor}</span>
                  <span className="text-foreground">{e.event}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-muted-foreground mb-1.5">Sign link</div>
            <div className="rounded border border-border bg-muted/40 px-2 py-1.5 text-[11px] font-mono truncate">
              {window.location.origin}/nda/{nda.id}
            </div>
          </div>
        </div>

        <div className="mt-auto border-t border-border p-3 flex flex-wrap gap-2">
          <button
            onClick={() => downloadNdaPdf(nda)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" /> Download PDF
          </button>
          {(canSend || canResend) && (
            <button
              onClick={() => { sendNda(nda.id); toast({ title: canResend ? "NDA resent" : "NDA sent" }); }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
            >
              <RotateCw className="h-3.5 w-3.5" /> {canResend ? "Resend" : "Send"}
            </button>
          )}
          {canCountersign && (
            <button
              onClick={() => { countersignNda(nda.id); toast({ title: "Countersigned" }); }}
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground text-background px-2.5 py-1.5 text-xs hover:opacity-90"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Countersign
            </button>
          )}
          {canRevoke && (
            <button
              onClick={() => { revokeNda(nda.id); toast({ title: "NDA revoked", variant: "destructive" }); onClose(); }}
              className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 text-destructive px-2.5 py-1.5 text-xs hover:bg-destructive/10 ml-auto"
            >
              <Ban className="h-3.5 w-3.5" /> Revoke
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Grid({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 border-b border-border last:border-0">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-xs text-foreground tabular-nums">{value}</span>
    </div>
  );
}