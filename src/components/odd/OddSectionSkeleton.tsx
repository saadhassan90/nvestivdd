export function OddSectionSkeleton() {
  return (
    <div className="relative pl-3 py-3 my-2 border-l-2 border-muted-foreground/30 animate-pulse">
      <div className="space-y-2">
        <div className="h-3 rounded bg-muted-foreground/15" style={{ width: "80%" }} />
        <div className="h-3 rounded bg-muted-foreground/15" style={{ width: "65%" }} />
        <div className="h-3 rounded bg-muted-foreground/15" style={{ width: "45%" }} />
      </div>
    </div>
  );
}