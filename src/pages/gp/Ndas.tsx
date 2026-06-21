import { useEffect, useMemo, useState } from "react";
import { Download, Search, FileSignature } from "lucide-react";
import { GpPagePlaceholder } from "@/components/gp/GpPagePlaceholder";
import { NdaStatusPill } from "@/components/gp/NdaStatusPill";
import { NdaDetailDrawer } from "@/components/gp/NdaDetailDrawer";
import { NDAS, subscribeNdas, type NdaRecord, type NdaStatus, seedNdasFromRaises } from "@/mocks/gp/ndas";
import { RAISES } from "@/mocks/gp/raises";
import { downloadNdaPdf } from "@/lib/nda-pdf";
import { cn } from "@/lib/utils";

seedNdasFromRaises(RAISES);

const STATUS_FILTERS: { key: NdaStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "sent", label: "Sent" },
  { key: "viewed", label: "Viewed" },
  { key: "signed", label: "Signed" },
  { key: "countersigned", label: "Executed" },
  { key: "expired", label: "Expired" },
  { key: "revoked", label: "Revoked" },
];

function fmtDate(ts?: string) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString();
}

export default function Ndas() {
  const [, force] = useState(0);
  useEffect(() => subscribeNdas(() => force((v) => v + 1)), []);

  const [status, setStatus] = useState<NdaStatus | "all">("all");
  const [raiseId, setRaiseId] = useState<string>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<NdaRecord | null>(null);

  const rows = useMemo(() => {
    return NDAS.filter((n) => {
      if (status !== "all" && n.status !== status) return false;
      if (raiseId !== "all" && n.raiseId !== raiseId) return false;
      if (q) {
        const s = q.toLowerCase();
        if (!n.lpName.toLowerCase().includes(s) && !n.lpEmail.toLowerCase().includes(s)) return false;
      }
      return true;
    }).sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  }, [status, raiseId, q, NDAS.length]);

  const stats = useMemo(() => {
    const t = NDAS.length;
    const signed = NDAS.filter((n) => n.status === "signed" || n.status === "countersigned").length;
    const pending = NDAS.filter((n) => ["sent", "viewed", "requested"].includes(n.status)).length;
    const expired = NDAS.filter((n) => n.status === "expired").length;
    return { t, signed, pending, expired };
  }, [NDAS.length]);

  const exportCsv = () => {
    const header = ["LP", "Email", "Raise", "Status", "Sent", "Signed", "Countersigned", "Expires", "Signer"];
    const lines = [header.join(",")].concat(
      rows.map((r) => [r.lpName, r.lpEmail, r.raiseName, r.status, fmtDate(r.sentAt), fmtDate(r.signedAt), fmtDate(r.countersignedAt), fmtDate(r.expiresAt), r.signerName ?? ""]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ndas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <GpPagePlaceholder>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FileSignature className="h-4 w-4" /> NDAs
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Track every NDA sent, signed, and executed across your raises.</p>
        </div>
        <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <Tile label="Total" value={stats.t} />
        <Tile label="Signed / executed" value={stats.signed} tone="good" />
        <Tile label="Pending" value={stats.pending} tone="info" />
        <Tile label="Expired" value={stats.expired} tone="warn" />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search LP or email…"
            className="pl-7 pr-2 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:border-foreground w-56"
          />
        </div>
        <select
          value={raiseId}
          onChange={(e) => setRaiseId(e.target.value)}
          className="text-xs rounded-md border border-border bg-background px-2 py-1.5 focus:outline-none focus:border-foreground"
        >
          <option value="all">All raises</option>
          {RAISES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatus(f.key)}
              className={cn(
                "text-[11px] rounded-full border px-2 py-0.5 transition-colors",
                status === f.key
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-16 text-center text-sm text-muted-foreground">
          No NDAs match your filters.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-[1.5fr_1.5fr_110px_110px_110px_110px_60px] text-[11px] uppercase tracking-wider text-muted-foreground px-4 py-2 border-b border-border bg-muted/30">
            <div>LP</div><div>Raise</div><div>Status</div><div>Sent</div><div>Signed</div><div>Expires</div><div></div>
          </div>
          {rows.map((n) => (
            <div
              key={n.id}
              onClick={() => setOpen(n)}
              className="grid grid-cols-[1.5fr_1.5fr_110px_110px_110px_110px_60px] items-center px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 text-sm cursor-pointer"
            >
              <div className="min-w-0">
                <div className="text-foreground font-medium truncate">{n.lpName}</div>
                <div className="text-[11px] text-muted-foreground truncate">{n.lpEmail}</div>
              </div>
              <div className="text-xs text-muted-foreground truncate">{n.raiseName}</div>
              <div><NdaStatusPill status={n.status} /></div>
              <div className="text-xs text-muted-foreground tabular-nums">{fmtDate(n.sentAt)}</div>
              <div className="text-xs text-muted-foreground tabular-nums">{fmtDate(n.signedAt)}</div>
              <div className="text-xs text-muted-foreground tabular-nums">{fmtDate(n.expiresAt)}</div>
              <div className="flex justify-end">
                <button
                  onClick={(e) => { e.stopPropagation(); downloadNdaPdf(n); }}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="Download PDF"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <NdaDetailDrawer nda={open} onClose={() => setOpen(null)} />
    </GpPagePlaceholder>
  );
}

function Tile({ label, value, tone }: { label: string; value: number; tone?: "good" | "info" | "warn" }) {
  const cls = tone === "good" ? "text-emerald-600" : tone === "warn" ? "text-amber-600" : tone === "info" ? "text-foreground" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("text-xl font-semibold tabular-nums mt-0.5", cls)}>{value}</div>
    </div>
  );
}