import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Download, ShieldCheck } from "lucide-react";
import { getNda, getTemplate, markViewed, signNda, subscribeNdas, renderNdaBody } from "@/mocks/gp/ndas";
import { SignaturePad } from "@/components/gp/SignaturePad";
import { downloadNdaPdf } from "@/lib/nda-pdf";
import { MarkdownContent } from "@/components/project/MarkdownContent";

export default function NdaSignPage() {
  const { ndaId } = useParams();
  const [, force] = useState(0);
  useEffect(() => subscribeNdas(() => force((v) => v + 1)), []);

  const nda = ndaId ? getNda(ndaId) : undefined;
  const tpl = nda ? getTemplate(nda.templateId) : undefined;

  useEffect(() => { if (nda) markViewed(nda.id); }, [nda?.id]);

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [agree, setAgree] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);

  const body = useMemo(
    () => (tpl && nda ? renderNdaBody(tpl.bodyMd, { ...nda, signerName: nda.signerName || name, signerTitle: nda.signerTitle || title }) : ""),
    [tpl, nda, name, title],
  );

  if (!nda || !tpl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">NDA not found or link expired.</p>
        </div>
      </div>
    );
  }

  const isSigned = nda.status === "signed" || nda.status === "countersigned";

  if (isSigned) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-card border border-border rounded-xl p-6 text-center">
          <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500" />
          <h1 className="mt-3 text-base font-semibold text-foreground">NDA executed</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Signed by {nda.signerName} on {new Date(nda.signedAt!).toLocaleString()}.
          </p>
          <button
            onClick={() => downloadNdaPdf(nda)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-foreground text-background px-3 py-2 text-xs"
          >
            <Download className="h-3.5 w-3.5" /> Download signed copy
          </button>
        </div>
      </div>
    );
  }

  const canSubmit = name.trim() && title.trim() && agree && signature;

  const submit = () => {
    if (!canSubmit) return;
    signNda(nda.id, { signerName: name.trim(), signerTitle: title.trim(), signatureDataUrl: signature! });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-foreground" />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-foreground truncate">{tpl.name}</h1>
            <p className="text-[11px] text-muted-foreground truncate">{nda.raiseName} · for {nda.lpName}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6 space-y-4">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-8 py-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Mutual NDA</p>
              <h2 className="text-base font-semibold text-foreground mt-0.5">{tpl.name}</h2>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">v{tpl.version}</span>
          </div>
          <div className="px-8 py-6 max-h-[60vh] overflow-y-auto">
            <MarkdownContent content={body} />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Sign to accept</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Full legal name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:border-foreground" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:border-foreground" />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Signature</label>
            <div className="mt-1">
              <SignaturePad onChange={setSignature} />
            </div>
          </div>

          <label className="flex items-start gap-2 text-xs text-foreground">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-foreground" />
            <span>I have read and agree to the terms of this Non-Disclosure Agreement, and consent to use an electronic signature.</span>
          </label>

          <button
            onClick={submit}
            disabled={!canSubmit}
            className="w-full rounded-md bg-foreground text-background py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-40"
          >
            Sign & accept
          </button>
        </div>
      </main>
    </div>
  );
}