import { useState } from "react";
import { Check, Copy, Download, RotateCcw, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface MemoToolbarProps {
  fundName: string;
  savingState: "idle" | "saving" | "saved";
  lastSavedAt: Date | null;
  contentMarkdown: string;
  onResetToTemplate: () => void;
}

function formatRelative(d: Date | null) {
  if (!d) return "";
  const sec = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  return `${hr}h ago`;
}

export function MemoToolbar({
  fundName,
  savingState,
  lastSavedAt,
  contentMarkdown,
  onResetToTemplate,
}: MemoToolbarProps) {
  const { toast } = useToast();
  const [, setTick] = useState(0);

  // Re-render every 15s to update relative time
  useState(() => {
    const t = setInterval(() => setTick((x) => x + 1), 15000);
    return () => clearInterval(t);
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(contentMarkdown);
    toast({ title: "Copied", description: "Memo markdown copied to clipboard." });
  };

  const handleDownload = () => {
    const blob = new Blob([contentMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fundName.replace(/\s+/g, "_")}_IC_Memo.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/50 bg-background px-4 sm:px-6 py-2">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">IC Memo Draft</span>
        <span className="text-muted-foreground/40">·</span>
        <span className="font-medium text-foreground truncate max-w-[280px]">{fundName}</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {savingState === "saving" ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Check className="h-3 w-3 text-emerald-600" />
              Saved {formatRelative(lastSavedAt)}
            </>
          )}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition-colors">
            <Download className="h-3 w-3" />
            Export
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={handleDownload} className="text-xs">
              <Download className="h-3.5 w-3.5 mr-2" />
              Download .md
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopy} className="text-xs">
              <Copy className="h-3.5 w-3.5 mr-2" />
              Copy markdown
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog>
          <AlertDialogTrigger className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <RotateCcw className="h-3 w-3" />
            Reset
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset memo to template?</AlertDialogTitle>
              <AlertDialogDescription>
                This will replace your current draft with a fresh skeleton seeded from the L1 report.
                This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onResetToTemplate}>Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}