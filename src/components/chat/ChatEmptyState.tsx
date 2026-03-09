import { Sparkles } from "lucide-react";

const GLOBAL_PROMPTS = [
  "Summarize the key risks across my portfolio",
  "Compare fee structures across my deals",
  "What are the unresolved red flags?",
  "Which deal has the strongest score?",
];

const SCOPED_PROMPTS = [
  "Summarize the key risks for this fund",
  "What are the main fee terms?",
  "What are the unresolved red flags?",
  "Draft a memo on the investment thesis",
];

export function ChatEmptyState({
  onPrompt,
  isScoped,
}: {
  onPrompt: (prompt: string) => void;
  isScoped: boolean;
}) {
  const prompts = isScoped ? SCOPED_PROMPTS : GLOBAL_PROMPTS;

  return (
    <div className="flex flex-col items-center justify-center h-full py-12">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
        <Sparkles className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">How can I help with your diligence?</h3>
      <p className="text-xs text-muted-foreground mb-6">Ask me anything about your deals</p>
      <div className="grid grid-cols-2 gap-2 max-w-xs">
        {prompts.map((p) => (
          <button
            key={p}
            onClick={() => onPrompt(p)}
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-[11px] text-left text-muted-foreground hover:bg-muted hover:text-foreground transition-colors leading-snug"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
