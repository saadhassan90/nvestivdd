import { FileSearch } from "lucide-react";

interface OddEmptyStateProps {
  onImportClick: () => void;
}

export function OddEmptyState({ onImportClick }: OddEmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-5">
          <FileSearch className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">No ODD report yet</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Import your Daseti data to generate the operational due diligence report.
        </p>
        <button
          onClick={onImportClick}
          className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-all hover:opacity-90 active:scale-95"
        >
          Import Daseti Data
        </button>
      </div>
    </div>
  );
}