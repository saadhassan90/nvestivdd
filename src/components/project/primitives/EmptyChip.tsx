import { cn } from "@/lib/utils";

interface EmptyChipProps {
  label?: string;
  className?: string;
}

/** Muted chip used wherever a JSON keypath resolves to null at L1. */
export function EmptyChip({ label = "NOT DISCLOSED AT L1", className }: EmptyChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-dashed border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground",
        className,
      )}
    >
      [{label}]
    </span>
  );
}

/** Render a value or fall through to an EmptyChip. */
export function ValueOrEmpty({ value, label }: { value: string | number | null | undefined; label?: string }) {
  if (value === null || value === undefined || value === "") {
    return <EmptyChip label={label} />;
  }
  return <span className="text-sm text-foreground">{value}</span>;
}
