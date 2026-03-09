import { CheckCircle2, AlertCircle, Flag } from "lucide-react";

interface FlagIndicatorProps {
  criticalCount: number;
  elevatedCount: number;
}

export function FlagIndicator({ criticalCount, elevatedCount }: FlagIndicatorProps) {
  if (criticalCount === 0 && elevatedCount === 0) {
    return (
      <span className="flex items-center gap-1 text-score-strong">
        <CheckCircle2 className="h-4 w-4" />
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {criticalCount > 0 && (
        <span className="flex items-center gap-1 text-severity-critical text-xs font-medium">
          <AlertCircle className="h-4 w-4" />
          {criticalCount}
        </span>
      )}
      {elevatedCount > 0 && (
        <span className="flex items-center gap-1 text-severity-elevated text-xs font-medium">
          <Flag className="h-4 w-4" />
          {elevatedCount}
        </span>
      )}
    </div>
  );
}
