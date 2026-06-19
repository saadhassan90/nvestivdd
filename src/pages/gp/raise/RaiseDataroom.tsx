import { useState } from "react";
import { useParams } from "react-router-dom";
import { Upload, FileText } from "lucide-react";
import { GpPagePlaceholder } from "@/components/gp/GpPagePlaceholder";
import { Button } from "@/components/ui/button";
import { getRaise, type DataroomFile } from "@/mocks/gp/raises";

const CATEGORIES = ["All", "Fund docs", "Track record", "Team", "Operations", "Legal"] as const;

function formatSize(kb: number) {
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function RaiseDataroom() {
  const { fundId } = useParams();
  const raise = getRaise(fundId);
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>("All");
  if (!raise) return null;
  const files: DataroomFile[] = filter === "All" ? raise.dataroom : raise.dataroom.filter((f) => f.category === filter);
  return (
    <GpPagePlaceholder title="Dataroom" description="Upload, organise, and version raise materials.">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={
                "text-xs px-2.5 py-1 rounded-md border " +
                (filter === c ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground")
              }
            >
              {c}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" className="gap-2">
          <Upload className="h-3.5 w-3.5" /> Upload
        </Button>
      </div>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_80px_100px_120px] text-[11px] uppercase tracking-wider text-muted-foreground px-4 py-2 border-b border-border bg-muted/30">
          <div>File</div><div>Category</div><div>Version</div><div>Size</div><div>Uploaded</div>
        </div>
        {files.map((f) => (
          <div key={f.id} className="grid grid-cols-[1fr_120px_80px_100px_120px] items-center px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate text-foreground">{f.name}</span>
            </div>
            <div className="text-xs text-muted-foreground">{f.category}</div>
            <div className="text-xs text-muted-foreground tabular-nums">v{f.version}</div>
            <div className="text-xs text-muted-foreground tabular-nums">{formatSize(f.sizeKb)}</div>
            <div className="text-xs text-muted-foreground">{formatDate(f.uploadedAt)}</div>
          </div>
        ))}
        {files.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">No files in this category.</div>
        )}
      </div>
    </GpPagePlaceholder>
  );
}