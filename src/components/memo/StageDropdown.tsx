import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, FileBadge, Lock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Stage = "L1" | "L2" | "L3";

const STAGES: { key: Stage; label: string; sub: string; available: boolean }[] = [
  { key: "L1", label: "L1 — Triage Report", sub: "Initial scoring & flags", available: true },
  { key: "L2", label: "L2 — Deep Dive", sub: "Coming soon", available: false },
  { key: "L3", label: "L3 — IC Memo", sub: "Drafting workspace", available: true },
];

interface StageDropdownProps {
  projectId: string;
  current: Stage;
}

export function StageDropdown({ projectId, current }: StageDropdownProps) {
  const navigate = useNavigate();

  const handleSelect = (stage: Stage) => {
    if (stage === "L1") navigate(`/project/${projectId}?tab=summary`);
    else if (stage === "L3") navigate(`/project/${projectId}/memo`);
  };

  const currentStage = STAGES.find((s) => s.key === current)!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-all hover:opacity-90 active:scale-95">
        <FileBadge className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{currentStage.label}</span>
        <span className="sm:hidden">{currentStage.key}</span>
        <ChevronDown className="h-3 w-3 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {STAGES.map((s) => {
          const isCurrent = s.key === current;
          return (
            <DropdownMenuItem
              key={s.key}
              disabled={!s.available}
              onClick={() => s.available && !isCurrent && handleSelect(s.key)}
              className="flex items-start gap-2 py-2 cursor-pointer"
            >
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold bg-muted text-foreground">
                {s.key}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  {s.label}
                  {!s.available && <Lock className="h-3 w-3 text-muted-foreground" />}
                </div>
                <div className="text-[10px] text-muted-foreground">{s.sub}</div>
              </div>
              {isCurrent && <Check className="h-3.5 w-3.5 text-foreground" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}