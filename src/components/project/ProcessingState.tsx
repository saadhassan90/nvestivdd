import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { MagicCard } from "@/components/magicui/MagicCard";
import { BorderBeam } from "@/components/magicui/BorderBeam";

interface ProcessingStateProps {
  startedAt?: string; // ISO timestamp of when processing began
}

export function ProcessingState({ startedAt }: ProcessingStateProps) {
  const [elapsed, setElapsed] = useState(() => {
    if (startedAt) {
      return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    }
    return 0;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      if (startedAt) {
        setElapsed(Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)));
      } else {
        setElapsed(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="flex items-center justify-center py-20">
      <div className="relative">
        <MagicCard className="w-96 text-center">
          <BorderBeam />
          <Loader2 className="mx-auto h-10 w-10 text-muted-foreground animate-spin mb-4" />
          <h3 className="text-lg font-bold text-foreground">Analysis in Progress</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Your documents are being analyzed by our AI engine. This typically takes 15–30 minutes depending on document complexity.
          </p>
          <p className="text-xs text-muted-foreground mt-3 font-mono">
            Elapsed: {minutes}:{seconds.toString().padStart(2, '0')}
          </p>
          <p className="text-[11px] text-muted-foreground/60 mt-2">
            You can safely navigate away — we'll notify you when it's ready.
          </p>
        </MagicCard>
      </div>
    </div>
  );
}
