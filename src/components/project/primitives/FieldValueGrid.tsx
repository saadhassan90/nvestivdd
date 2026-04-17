import { EmptyChip } from "./EmptyChip";
import { cn } from "@/lib/utils";

export interface FieldValueRow {
  label: string;
  value: string | number | null | undefined;
  /** Optional emphasis of the value cell. */
  emphasis?: boolean;
}

interface FieldValueGridProps {
  rows: FieldValueRow[];
  columns?: 1 | 2;
  className?: string;
}

/** 2-column field/value table that always renders every row, swapping
 *  missing values for an EmptyChip. Used by Overview Snapshot, Strategy
 *  Term Structure / Economics, etc. */
export function FieldValueGrid({ rows, columns = 2, className }: FieldValueGridProps) {
  return (
    <div
      className={cn(
        "grid gap-x-6 gap-y-2",
        columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
        className,
      )}
    >
      {rows.map((row, i) => (
        <div
          key={`${row.label}-${i}`}
          className="flex items-baseline justify-between gap-3 border-b border-border/40 py-1.5 last:border-0"
        >
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground shrink-0">
            {row.label}
          </span>
          <span className="text-right min-w-0 truncate">
            {row.value === null || row.value === undefined || row.value === "" ? (
              <EmptyChip />
            ) : (
              <span
                className={cn(
                  "text-xs",
                  row.emphasis ? "font-semibold text-foreground" : "text-foreground/85",
                )}
              >
                {row.value}
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
