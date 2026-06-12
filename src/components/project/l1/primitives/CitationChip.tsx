import { useRefs } from "./RefsContext";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  className?: string;
}

export function CitationChip({ id, className }: Props) {
  const { sources, scrollTo, highlight } = useRefs();
  const src = sources.get(id);
  if (!src) {
    if (typeof window !== "undefined") console.warn(`Unresolved citation_id: ${id}`);
    return (
      <span
        title={`Unresolved citation: ${id}`}
        className={cn(
          "inline-flex items-center rounded border border-dashed border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground",
          className,
        )}
      >
        ?
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        scrollTo(`src-${id}`);
        highlight(`src-${id}`);
      }}
      title={`${src.title} — ${src.tier}`}
      className={cn(
        "inline-flex items-center rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-mono text-foreground/80 hover:bg-muted hover:text-foreground transition-colors",
        className,
      )}
    >
      {id}
    </button>
  );
}

export function CitationChipRow({ ids, className }: { ids: string[]; className?: string }) {
  if (!ids?.length) return null;
  return (
    <span className={cn("inline-flex flex-wrap gap-1", className)}>
      {ids.map((id) => (
        <CitationChip key={id} id={id} />
      ))}
    </span>
  );
}