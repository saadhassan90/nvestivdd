import { BarChart3, Plus } from "lucide-react";
import { DotPattern } from "@/components/magicui/DotPattern";
import { ShimmerButton } from "@/components/magicui/ShimmerButton";
import { BlurFade } from "@/components/magicui/BlurFade";

interface EmptyStateProps {
  onNewDeal: () => void;
}

export function EmptyState({ onNewDeal }: EmptyStateProps) {
  return (
    <BlurFade>
      <div className="relative flex flex-col items-center justify-center rounded-lg border border-border bg-card py-20 px-8">
        <DotPattern className="opacity-30" />
        <div className="relative z-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Welcome to Nvestiv</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Upload a fund document to begin your first analysis
          </p>
          <div className="mt-6">
            <ShimmerButton onClick={onNewDeal}>
              <Plus className="h-4 w-4" />
              New Deal
            </ShimmerButton>
          </div>
        </div>
      </div>
    </BlurFade>
  );
}
