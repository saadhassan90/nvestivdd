import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { GpPagePlaceholder } from "@/components/gp/GpPagePlaceholder";
import { getRaise } from "@/mocks/gp/raises";
import { CheckCircle2, Clock, MessageSquare, Sparkles, RotateCcw } from "lucide-react";
import { useChatContext } from "@/contexts/ChatContext";
import { cn } from "@/lib/utils";

type InterviewStatus = "not_started" | "in_progress" | "complete";

const STORAGE_PREFIX = "iris-interview:";

function readStatus(id: string): InterviewStatus {
  if (typeof window === "undefined") return "not_started";
  const v = window.localStorage.getItem(STORAGE_PREFIX + id);
  return v === "in_progress" || v === "complete" ? v : "not_started";
}

function writeStatus(id: string, s: InterviewStatus) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_PREFIX + id, s);
}

function pulseChatSidebar() {
  const el = document.querySelector<HTMLElement>("[data-chat-drawer]");
  if (!el) return;
  el.classList.add("iris-attention-pulse");
  window.setTimeout(() => el.classList.remove("iris-attention-pulse"), 2800);
}

export default function RaiseInterview() {
  const { fundId } = useParams();
  const raise = getRaise(fundId);
  const { sendMessage, startNewConversation, setProjectScope } = useChatContext();
  const [status, setStatus] = useState<InterviewStatus>(() => readStatus(fundId ?? ""));

  useEffect(() => {
    setStatus(readStatus(fundId ?? ""));
  }, [fundId]);

  const updateStatus = useCallback(
    (s: InterviewStatus) => {
      if (!fundId) return;
      writeStatus(fundId, s);
      setStatus(s);
    },
    [fundId],
  );

  if (!raise) return null;

  const gaps = raise.ddq
    .filter((d) => d.state === "unanswered" || d.state === "suggested")
    .slice(0, 6);

  const startInterview = (mode: "begin" | "another") => {
    setProjectScope({ id: raise.id, name: raise.name });
    if (mode === "another") startNewConversation();
    pulseChatSidebar();

    const gapList = gaps.length
      ? gaps.map((g, i) => `${i + 1}. ${g.question} (${g.section})`).join("\n")
      : "No specific open DDQ items — focus on general fit, edge, and operational readiness.";

    const prompt =
      mode === "another"
        ? `Let's run another IRIS interview round for "${raise.name}" (${raise.strategy}, target ${raise.targetSize}). Briefly re-introduce yourself as IRIS, note this is a follow-up pass, then ask the next most important open question. After each answer, ask the next one. Outstanding items:\n${gapList}`
        : `Begin the IRIS interview for "${raise.name}" (${raise.strategy}, target ${raise.targetSize}). Introduce yourself as IRIS in 1–2 friendly sentences, explain you'll ask a few questions to close gaps in the dataroom/DDQ, then ask the first open question. After each answer, ask the next one. Outstanding items:\n${gapList}\n\nWhen the GP says they're done — or when you've covered the list — confirm completion and tell them they can mark the interview complete on this page.`;

    updateStatus("in_progress");
    // Defer so the pulse + provider state apply before the stream starts.
    setTimeout(() => sendMessage(prompt), 50);
  };

  const statusMeta: Record<InterviewStatus, { label: string; tone: string; icon: typeof Clock }> = {
    not_started: { label: "Not started", tone: "bg-muted text-muted-foreground", icon: Clock },
    in_progress: {
      label: "We still need to talk",
      tone: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
      icon: MessageSquare,
    },
    complete: {
      label: "Interview complete",
      tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
      icon: CheckCircle2,
    },
  };
  const StatusIcon = statusMeta[status].icon;

  return (
    <GpPagePlaceholder>
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-[hsl(var(--nvestiv-teal,var(--primary)))]" />
              <h2 className="text-base font-semibold text-foreground">IRIS Interview</h2>
              <span
                className={cn(
                  "ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  statusMeta[status].tone,
                )}
              >
                <StatusIcon className="h-3 w-3" />
                {statusMeta[status].label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl">
              IRIS interviews you to close open gaps in the dataroom and DDQ. Click below to start —
              the chat panel on the left will pulse and IRIS will introduce herself and begin asking
              questions. You can talk to IRIS anytime to update your answers.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {status === "not_started" && (
            <button
              type="button"
              onClick={() => startInterview("begin")}
              className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 transition"
            >
              <MessageSquare className="h-4 w-4" />
              Chat with IRIS
            </button>
          )}
          {status === "in_progress" && (
            <>
              <button
                type="button"
                onClick={() => startInterview("begin")}
                className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 transition"
              >
                <MessageSquare className="h-4 w-4" />
                Continue chatting with IRIS
              </button>
              <button
                type="button"
                onClick={() => updateStatus("complete")}
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark interview complete
              </button>
            </>
          )}
          {status === "complete" && (
            <>
              <button
                type="button"
                onClick={() => startInterview("another")}
                className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 transition"
              >
                <RotateCcw className="h-4 w-4" />
                Have another interview
              </button>
              <button
                type="button"
                onClick={() => updateStatus("in_progress")}
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition"
              >
                Reopen interview
              </button>
            </>
          )}
        </div>

        <div className="mt-6 rounded-md border border-dashed border-border bg-background/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tip
          </p>
          <p className="text-sm text-foreground mt-1">
            You can chat with IRIS anytime from the side panel to update an answer — there's no
            need to wait for a formal interview window.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-5">
        <p className="text-sm font-medium text-foreground">Open gaps IRIS will ask about</p>
        <p className="text-xs text-muted-foreground mt-1">
          {gaps.length} prompts queued · pulled from unanswered DDQ + IRIS-suggested items
        </p>
        <ul className="mt-4 space-y-2">
          {gaps.map((g) => (
            <li
              key={g.id}
              className="flex items-start gap-3 rounded-md border border-border bg-background/50 px-3 py-2.5"
            >
              <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm text-foreground">{g.question}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {g.section} · {g.provenance}
                </p>
              </div>
            </li>
          ))}
          {gaps.length === 0 && (
            <li className="text-sm text-muted-foreground italic">All known gaps are addressed.</li>
          )}
        </ul>
      </div>
    </GpPagePlaceholder>
  );
}