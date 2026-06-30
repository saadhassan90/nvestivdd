import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PIPELINE_STAGES,
  PIPELINE_STAGE_LABEL,
  type PipelineStage,
} from "@/mocks/gp/raises";
import { cn } from "@/lib/utils";

const TONE: Record<PipelineStage, string> = {
  sent: "border-border text-muted-foreground bg-muted/30",
  requested_dataroom: "border-border text-foreground bg-muted/40",
  nda_sent: "border-foreground/25 text-foreground bg-muted/40",
  nda_signed: "border-foreground/40 text-foreground bg-muted/60",
  dataroom_sent: "border-foreground/40 text-foreground bg-muted/60",
  opened: "border-foreground/40 text-foreground bg-muted/70",
  ic_ready: "border-foreground/60 text-foreground bg-foreground/10",
  declined: "border-destructive/40 text-destructive bg-destructive/5",
  ready_to_invest: "border-foreground text-foreground bg-foreground/15",
  current_investor: "border-foreground text-background bg-foreground",
};

interface Props {
  stage: PipelineStage;
  onChange?: (next: PipelineStage) => void;
  readOnly?: boolean;
}

export function PipelineStagePill({ stage, onChange, readOnly }: Props) {
  const label = PIPELINE_STAGE_LABEL[stage];
  const className = cn(
    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap",
    TONE[stage],
  );

  if (readOnly || !onChange) {
    return <span className={className}>{label}</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(className, "hover:opacity-80 transition-opacity")}
        onClick={(e) => e.stopPropagation()}
      >
        {label}
        <ChevronDown className="h-3 w-3 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {PIPELINE_STAGES.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onClick={() => onChange(s.id)}
            className="text-xs"
          >
            <span className="flex-1">{s.label}</span>
            {s.id === stage && <Check className="h-3.5 w-3.5 text-foreground" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}