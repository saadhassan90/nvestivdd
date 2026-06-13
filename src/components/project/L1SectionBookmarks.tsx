import { cn } from "@/lib/utils";
import { L1_PAGES, type L1PageKey } from "@/components/project/l1/L1OnePager";

interface Props {
  page: L1PageKey;
  onPageChange: (p: L1PageKey) => void;
}

export function L1SectionBookmarks({ page, onPageChange }: Props) {
  return (
    <ul className="flex flex-col gap-0.5">
      {L1_PAGES.map((p) => {
        const isActive = p.key === page;
        return (
          <li key={p.key}>
          <button
            type="button"
            onClick={() => onPageChange(p.key)}
            className={cn(
              "w-full rounded-md px-2 py-1 text-xs text-left transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
              {p.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}