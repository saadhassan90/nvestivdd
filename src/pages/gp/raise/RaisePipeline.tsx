import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Send, MoreHorizontal } from "lucide-react";
import { GpPagePlaceholder } from "@/components/gp/GpPagePlaceholder";
import { getRaise } from "@/mocks/gp/raises";
import { RAISES } from "@/mocks/gp/raises";
import {
  getNdaByLp,
  seedNdasFromRaises,
  subscribeNdas,
  type NdaRecord,
  type NdaStatus,
} from "@/mocks/gp/ndas";
import { NdaStatusPill } from "@/components/gp/NdaStatusPill";
import { SendNdaModal } from "@/components/gp/SendNdaModal";
import { NdaDetailDrawer } from "@/components/gp/NdaDetailDrawer";

seedNdasFromRaises(RAISES);

export default function RaisePipeline() {
  const { fundId } = useParams();
  const raise = getRaise(fundId);
  const [, force] = useState(0);
  useEffect(() => subscribeNdas(() => force((v) => v + 1)), []);

  const [sendFor, setSendFor] = useState<{ id: string; name: string } | null>(null);
  const [openNda, setOpenNda] = useState<NdaRecord | null>(null);

  if (!raise) return null;
  if (raise.lps.length === 0) {
    return (
      <GpPagePlaceholder>
        <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-16 text-center text-sm text-muted-foreground">
          No L2 LPs yet on this raise.
        </div>
      </GpPagePlaceholder>
    );
  }

  return (
    <GpPagePlaceholder>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1.5fr_110px_140px_70px_110px_90px] text-[11px] uppercase tracking-wider text-muted-foreground px-4 py-2 border-b border-border bg-muted/30">
          <div>LP</div><div>Type</div><div>NDA</div><div>Qs</div><div>Last activity</div><div className="text-right">Actions</div>
        </div>
        {raise.lps.map((lp) => {
          const nda = getNdaByLp(raise.id, lp.id);
          const status: NdaStatus = nda?.status ?? "not_sent";
          const canSend = !nda || ["not_sent", "expired", "declined", "revoked"].includes(status);
          return (
            <div key={lp.id} className="grid grid-cols-[1.5fr_110px_140px_70px_110px_90px] items-center px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 text-sm">
              <div className="text-foreground font-medium truncate">{lp.name}</div>
              <div className="text-xs text-muted-foreground">{lp.type}</div>
              <div>
                <NdaStatusPill status={status} onClick={nda ? () => setOpenNda(nda) : undefined} />
              </div>
              <div className="text-xs text-muted-foreground tabular-nums">{lp.questions}</div>
              <div className="text-xs text-muted-foreground">{lp.lastActivity}</div>
              <div className="flex justify-end gap-1">
                {canSend ? (
                  <button
                    onClick={() => setSendFor({ id: lp.id, name: lp.name })}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] hover:bg-muted"
                  >
                    <Send className="h-3 w-3" /> Send
                  </button>
                ) : (
                  <button
                    onClick={() => nda && setOpenNda(nda)}
                    className="inline-flex items-center justify-center h-6 w-6 rounded-md border border-border hover:bg-muted text-muted-foreground"
                    title="View NDA"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {sendFor && (
        <SendNdaModal
          open
          onClose={() => setSendFor(null)}
          raiseId={raise.id}
          raiseName={raise.name}
          lpId={sendFor.id}
          lpName={sendFor.name}
        />
      )}
      <NdaDetailDrawer nda={openNda} onClose={() => setOpenNda(null)} />
    </GpPagePlaceholder>
  );
}