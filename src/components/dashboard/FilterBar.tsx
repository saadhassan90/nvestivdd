import { Search, X, ChevronDown } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface FilterState {
  assetClass: string | null;
  scoreTier: string | null;
  recommendation: string | null;
  status: string | null;
  stage: string | null;
  search: string;
  sortBy: string;
  sortDir: "asc" | "desc";
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  assetClasses: string[];
}

const SCORE_TIERS = [
  { value: "85+", label: "85+" },
  { value: "70-84", label: "70–84" },
  { value: "50-69", label: "50–69" },
  { value: "<50", label: "Below 50" },
];

const VERDICTS = [
  { value: "proceed", label: "Proceed to meeting" },
  { value: "conditional", label: "Proceed with caution" },
  { value: "hard_floor", label: "Hard floor triggered" },
];

const STATUSES = [
  { value: "complete", label: "Complete" },
  { value: "processing", label: "Processing" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
];

const STAGES = [
  { value: "L1", label: "L1" },
  { value: "L2", label: "L2" },
  { value: "L3", label: "L3" },
];

function FilterDropdown({ label, value, options, onSelect, onClear }: {
  label: string;
  value: string | null;
  options: { value: string; label: string }[];
  onSelect: (val: string) => void;
  onClear: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] sm:text-xs font-medium transition-colors whitespace-nowrap ${
          value
            ? 'bg-primary text-primary-foreground'
            : 'border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
        }`}>
          {value ? options.find(o => o.value === value)?.label || label : label}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {value && (
          <DropdownMenuItem onClick={onClear} className="text-muted-foreground">
            Clear filter
          </DropdownMenuItem>
        )}
        {options.map(opt => (
          <DropdownMenuItem key={opt.value} onClick={() => onSelect(opt.value)}>
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FilterBar({ filters, onChange, assetClasses }: FilterBarProps) {
  const activeChips = [
    filters.assetClass && { key: "assetClass", label: filters.assetClass },
    filters.scoreTier && { key: "scoreTier", label: `Score ${SCORE_TIERS.find(t => t.value === filters.scoreTier)?.label || filters.scoreTier}` },
    filters.recommendation && { key: "recommendation", label: VERDICTS.find(v => v.value === filters.recommendation)?.label || filters.recommendation },
    filters.status && { key: "status", label: STATUSES.find(s => s.value === filters.status)?.label || filters.status },
    filters.stage && { key: "stage", label: `Stage ${filters.stage}` },
  ].filter(Boolean) as { key: string; label: string }[];

  const clearFilter = (key: string) => {
    onChange({ ...filters, [key]: null });
  };

  return (
    <BlurFade delay={0.2}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filters row */}
        <div className="flex items-center gap-2 flex-wrap">
          <FilterDropdown
            label="Asset Class"
            value={filters.assetClass}
            options={assetClasses.map(ac => ({ value: ac, label: ac }))}
            onSelect={(val) => onChange({ ...filters, assetClass: val })}
            onClear={() => onChange({ ...filters, assetClass: null })}
          />
          <FilterDropdown
            label="Score"
            value={filters.scoreTier}
            options={SCORE_TIERS}
            onSelect={(val) => onChange({ ...filters, scoreTier: val })}
            onClear={() => onChange({ ...filters, scoreTier: null })}
          />
          <FilterDropdown
            label="Verdict"
            value={filters.recommendation}
            options={VERDICTS}
            onSelect={(val) => onChange({ ...filters, recommendation: val })}
            onClear={() => onChange({ ...filters, recommendation: null })}
          />
          <FilterDropdown
            label="Status"
            value={filters.status}
            options={STATUSES}
            onSelect={(val) => onChange({ ...filters, status: val })}
            onClear={() => onChange({ ...filters, status: null })}
          />
          <FilterDropdown
            label="Stage"
            value={filters.stage}
            options={STAGES}
            onSelect={(val) => onChange({ ...filters, stage: val })}
            onClear={() => onChange({ ...filters, stage: null })}
          />

          {activeChips.map(chip => (
            <span key={chip.key} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground">
              {chip.label}
              <button onClick={() => clearFilter(chip.key)} className="hover:text-severity-critical transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 sm:flex-none">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter by name..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full sm:w-44 rounded-lg border border-border bg-card py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
    </BlurFade>
  );
}
