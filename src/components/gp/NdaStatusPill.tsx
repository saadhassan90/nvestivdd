import { cn } from "@/lib/utils";
import { NDA_STATUS_META, type NdaStatus } from "@/mocks/gp/ndas";

const TONE_CLS: Record<string, string> = {
  muted: "border-border text-muted-foreground bg-muted/30",
  info: "border-foreground/30 text-foreground bg-muted/40",
  warn: "border-border text-foreground bg-muted",
  good: "border-foreground/30 text-foreground bg-muted",
  bad: "border-destructive/40 text-destructive bg-destructive/10",
};

export function NdaStatusPill({
  status,
  className,
  onClick,
}: {
  status: NdaStatus;
  className?: string;
  onClick?: () => void;
}) {
  const meta = NDA_STATUS_META[status];
  const Wrap = onClick ? "button" : "span";
  return (
    <Wrap
      onClick={onClick}
      className={cn(
        "text-[10px] border rounded px-1.5 py-0.5 whitespace-nowrap",
        TONE_CLS[meta.tone],
        onClick && "cursor-pointer hover:opacity-80",
        className,
      )}
    >
      {meta.label}
    </Wrap>
  );
}