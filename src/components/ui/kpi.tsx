import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

/**
 * Efferd-style KPI row: a single bordered rectangle with vertical dividers
 * between cells. Use as `<KpiRow><KpiCell .. /><KpiCell .. /></KpiRow>`.
 */
export const KpiRow = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "grid grid-cols-1 divide-y divide-border rounded-lg border border-border bg-card sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3",
        className,
      )}
      {...props}
    />
  ),
);
KpiRow.displayName = "KpiRow";

export interface KpiCellProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  delta?: number | null;
  deltaSuffix?: string;
  hint?: React.ReactNode;
}

export const KpiCell = React.forwardRef<HTMLDivElement, KpiCellProps>(
  ({ className, label, value, delta, deltaSuffix = "%", hint, ...props }, ref) => {
    const isUp = typeof delta === "number" && delta >= 0;
    return (
      <div ref={ref} className={cn("flex flex-col gap-2 p-5", className)} {...props}>
        <div className="flex items-start justify-between gap-3">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          {typeof delta === "number" && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium leading-none",
                isUp
                  ? "bg-trend-positive/10 text-[hsl(var(--trend-positive))]"
                  : "bg-trend-negative/10 text-[hsl(var(--trend-negative))]",
              )}
            >
              {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(delta)}
              {deltaSuffix}
            </span>
          )}
        </div>
        <div className="text-2xl font-semibold tracking-tight text-foreground">{value}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
    );
  },
);
KpiCell.displayName = "KpiCell";