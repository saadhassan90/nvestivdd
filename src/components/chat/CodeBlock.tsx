import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

function flatten(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(flatten).join("");
  if (children && typeof children === "object" && "props" in (children as any)) {
    return flatten((children as any).props?.children);
  }
  return "";
}

export function CodeBlock({
  language,
  children,
  className,
}: {
  language?: string;
  children: ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const code = flatten(children).replace(/\n$/, "");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <div className={cn("not-prose my-2 overflow-hidden rounded-lg border border-border bg-muted/40", className)}>
      <div className="flex items-center justify-between border-b border-border bg-muted/60 px-3 py-1.5">
        <span className="text-[10px] font-mono text-muted-foreground">
          {language || "code"}
        </span>
        <button
          onClick={copy}
          className="inline-flex h-6 items-center gap-1 rounded px-1.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {copied ? <Check className="h-3 w-3 text-score-strong" /> : <Copy className="h-3 w-3" />}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 py-2 text-[12px] leading-relaxed font-mono text-foreground bg-transparent">
        <code>{code}</code>
      </pre>
    </div>
  );
}