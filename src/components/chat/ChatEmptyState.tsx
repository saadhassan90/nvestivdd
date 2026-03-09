import irisHero from "@/assets/iris-hero.png";

const GLOBAL_PROMPTS = [
  "What deals should I focus on?",
  "What deals should I avoid?",
  "Create an IC memo for a deal",
  "Summarize unresolved red flags",
];

const SCOPED_PROMPTS = [
  "Summarize the key risks for this fund",
  "Draft an IC memo for this deal",
  "What are the unresolved red flags?",
  "Break down the fee structure",
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
      <img
        src={irisHero}
        alt="Iris"
        className="h-16 w-16 rounded-2xl object-cover mb-4 shadow-md"
      />
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
