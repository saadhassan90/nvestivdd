import { Input, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Chip } from "@heroui/react";
import { Search, ArrowUpDown, X, ChevronDown } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";

export interface FilterState {
  assetClass: string | null;
  scoreTier: string | null;
  recommendation: string | null;
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
  { value: "strong_advance", label: "Score 85+" },
  { value: "advance", label: "Score 70–84" },
  { value: "review", label: "Score 50–69" },
  { value: "decline", label: "Score < 50" },
];

const RECOMMENDATIONS = [
  { value: "Strong Advance", label: "Strong Advance" },
  { value: "Advance with Diligence", label: "Advance" },
  { value: "Review Required", label: "Review Required" },
  { value: "Decline", label: "Decline" },
];

const SORT_OPTIONS = [
  { value: "created_at", label: "Date Created" },
  { value: "fund_name", label: "Fund Name" },
  { value: "composite_score", label: "Score" },
  { value: "asset_class", label: "Asset Class" },
];

function FilterDropdown({ label, value, options, onSelect, onClear }: {
  label: string;
  value: string | null;
  options: { value: string; label: string }[];
  onSelect: (val: string) => void;
  onClear: () => void;
}) {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant={value ? "solid" : "bordered"}
          color={value ? "primary" : "default"}
          size="sm"
          endContent={<ChevronDown className="h-3 w-3" />}
          className="text-xs"
        >
          {value ? options.find(o => o.value === value)?.label || label : label}
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label={label}>
        {value ? (
          [
            <DropdownItem key="clear" onPress={onClear} className="text-default-400">Clear filter</DropdownItem>,
            ...options.map(opt => (
              <DropdownItem key={opt.value} onPress={() => onSelect(opt.value)}>{opt.label}</DropdownItem>
            ))
          ]
        ) : (
          options.map(opt => (
            <DropdownItem key={opt.value} onPress={() => onSelect(opt.value)}>{opt.label}</DropdownItem>
          ))
        )}
      </DropdownMenu>
    </Dropdown>
  );
}

export function FilterBar({ filters, onChange, assetClasses }: FilterBarProps) {
  const activeChips = [
    filters.assetClass && { key: "assetClass", label: filters.assetClass },
    filters.scoreTier && { key: "scoreTier", label: SCORE_TIERS.find(t => t.value === filters.scoreTier)?.label || filters.scoreTier },
    filters.recommendation && { key: "recommendation", label: filters.recommendation },
  ].filter(Boolean) as { key: string; label: string }[];

  const clearFilter = (key: string) => {
    onChange({ ...filters, [key]: null });
  };

  return (
    <BlurFade delay={0.2}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            label="Recommendation"
            value={filters.recommendation}
            options={RECOMMENDATIONS}
            onSelect={(val) => onChange({ ...filters, recommendation: val })}
            onClear={() => onChange({ ...filters, recommendation: null })}
          />

          {activeChips.map(chip => (
            <Chip
              key={chip.key}
              size="sm"
              variant="flat"
              onClose={() => clearFilter(chip.key)}
            >
              {chip.label}
            </Chip>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Filter funds..."
            size="sm"
            value={filters.search}
            onValueChange={(val) => onChange({ ...filters, search: val })}
            startContent={<Search className="h-3.5 w-3.5 text-default-400" />}
            classNames={{
              base: "w-full sm:w-44",
              inputWrapper: "bg-default-100 shadow-none h-8",
              input: "text-xs",
            }}
          />

          <Dropdown>
            <DropdownTrigger>
              <Button variant="bordered" size="sm" isIconOnly className="sm:hidden">
                <ArrowUpDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Sort">
              {SORT_OPTIONS.map(opt => (
                <DropdownItem
                  key={opt.value}
                  onPress={() => onChange({
                    ...filters,
                    sortBy: opt.value,
                    sortDir: filters.sortBy === opt.value && filters.sortDir === "asc" ? "desc" : "asc",
                  })}
                >
                  {opt.label} {filters.sortBy === opt.value && (filters.sortDir === "asc" ? "↑" : "↓")}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          <Dropdown>
            <DropdownTrigger>
              <Button variant="bordered" size="sm" startContent={<ArrowUpDown className="h-3.5 w-3.5" />} className="hidden sm:flex text-xs">
                Sort
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Sort">
              {SORT_OPTIONS.map(opt => (
                <DropdownItem
                  key={opt.value}
                  onPress={() => onChange({
                    ...filters,
                    sortBy: opt.value,
                    sortDir: filters.sortBy === opt.value && filters.sortDir === "asc" ? "desc" : "asc",
                  })}
                >
                  {opt.label} {filters.sortBy === opt.value && (filters.sortDir === "asc" ? "↑" : "↓")}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </BlurFade>
  );
}
