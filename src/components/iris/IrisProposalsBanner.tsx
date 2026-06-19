import { useEffect, useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { applyProposal, getActivePage, rejectProposal, subscribePageContent } from "@/lib/pageContent";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type Proposal = {
  id: string;
  page_key: string;
  raise_id: string | null;
  section_key: string;
  label: string | null;
  current_content: { text?: string } | null;
  proposed_content: { text?: string };
  rationale: string | null;
  status: string;
  created_at: string;
};

export function IrisProposalsBanner() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [active, setActive] = useState(getActivePage());
  const [open, setOpen] = useState(true);

  useEffect(() => subscribePageContent(() => setActive(getActivePage())), []);

  // Initial load + realtime
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase
        .from("page_edit_proposals")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50);
      if (mounted && data) setProposals(data as Proposal[]);
    };
    load();
    const channel = supabase
      .channel("page_edit_proposals_stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "page_edit_proposals" },
        () => load(),
      )
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Only show proposals for the current page (or any global page).
  const visible = proposals.filter(
    (p) =>
      p.page_key === active.pageKey &&
      (p.raise_id || null) === (active.raiseId || null),
  );

  if (visible.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)]">
      <div className="rounded-lg border border-border bg-card shadow-lg overflow-hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/40 hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-foreground" />
            <span className="text-xs font-semibold text-foreground">
              Iris suggestions
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums">
              {visible.length} pending
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">{open ? "Hide" : "Show"}</span>
        </button>
        {open && (
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-border">
            {visible.map((p) => (
              <ProposalCard key={p.id} proposal={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  const [busy, setBusy] = useState<null | "apply" | "reject">(null);
  const currentText = proposal.current_content?.text || "";
  const proposedText = proposal.proposed_content?.text || "";

  const handleApply = async () => {
    setBusy("apply");
    try {
      await applyProposal(proposal.id);
      toast({ title: "Applied", description: proposal.label || proposal.section_key });
    } catch (e) {
      toast({ title: "Failed to apply", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };
  const handleReject = async () => {
    setBusy("reject");
    try {
      await rejectProposal(proposal.id);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {proposal.label || proposal.section_key}
      </p>
      {proposal.rationale && (
        <p className="text-[11px] text-muted-foreground mt-1 italic">{proposal.rationale}</p>
      )}
      <div className="mt-2 grid grid-cols-1 gap-1.5">
        <div className="rounded border border-destructive/30 bg-destructive/5 px-2 py-1.5">
          <p className="text-[9px] uppercase tracking-wider text-destructive/70 mb-0.5">Current</p>
          <p className="text-[11px] text-foreground/80 line-clamp-3">{currentText || "— (empty)"}</p>
        </div>
        <div className="rounded border border-foreground/30 bg-muted/40 px-2 py-1.5">
          <p className="text-[9px] uppercase tracking-wider text-foreground/70 mb-0.5">Proposed</p>
          <p className="text-[11px] text-foreground line-clamp-5 whitespace-pre-wrap">{proposedText}</p>
        </div>
      </div>
      <div className="mt-2 flex justify-end gap-1.5">
        <button
          onClick={handleReject}
          disabled={busy !== null}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
            busy && "opacity-50",
          )}
        >
          <X className="h-3 w-3" /> Reject
        </button>
        <button
          onClick={handleApply}
          disabled={busy !== null}
          className={cn(
            "inline-flex items-center gap-1 rounded-md bg-foreground px-2 py-1 text-[11px] text-background hover:bg-foreground/90 transition-colors",
            busy && "opacity-50",
          )}
        >
          <Check className="h-3 w-3" /> Apply
        </button>
      </div>
    </div>
  );
}