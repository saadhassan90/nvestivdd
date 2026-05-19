import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUiVariant, type UiVariant } from "@/contexts/UiVariantContext";

const OPTIONS: { value: UiVariant; label: string }[] = [
  { value: "adia", label: "Adia" },
  { value: "general", label: "General" },
];

export function VariantSwitcher() {
  const { variant, setVariant } = useUiVariant();
  const current = OPTIONS.find((o) => o.value === variant) ?? OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          aria-label="Switch UI variant"
        >
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">UI</span>
          <span>{current.label}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36">
        {OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => setVariant(opt.value)}
            className="flex items-center justify-between"
          >
            <span>{opt.label}</span>
            {variant === opt.value && <Check className="h-3.5 w-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}