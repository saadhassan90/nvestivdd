import { cn } from "@/lib/utils";

export function InteractiveQuickReply({
  question,
  options,
  answered,
  onPick,
}: {
  question?: string;
  options: string[];
  answered?: boolean;
  onPick: (value: string) => void;
}) {
  return (
    <div className="not-prose my-2 rounded-xl border border-border bg-muted/40 p-3">
      {question && (
        <div className="text-[12px] text-foreground mb-2 leading-snug">{question}</div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            disabled={answered}
            onClick={() => onPick(opt)}
            className={cn(
              "rounded-full border border-border bg-card px-2.5 py-1 text-[11px] transition-colors",
              answered
                ? "text-muted-foreground opacity-60 cursor-not-allowed"
                : "text-foreground hover:bg-foreground hover:text-background",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
      {answered && (
        <div className="text-[10px] text-muted-foreground mt-2">
          answered
        </div>
      )}
    </div>
  );
}