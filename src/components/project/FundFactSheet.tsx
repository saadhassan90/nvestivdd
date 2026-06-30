import { FileText } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import type { Tables } from "@/integrations/supabase/types";

/**
 * One-pager fund fact sheet pinned to the top of the Overview tab.
 * Mirrors a traditional fund tear-sheet: manager, strategy, vintage, size,
 * domicile, target return, mgmt fee, carry, hurdle, term. Empty cells render
 * as "—" instead of being hidden, so the table shape stays predictable.
 */
interface FundFactSheetProps {
  project: Tables<"projects">;
  fees?: Tables<"fee_structure">[];
}

function findFee(fees: Tables<"fee_structure">[] | undefined, re: RegExp): string | null {
  if (!fees) return null;
  const hit = fees.find((f) => re.test(f.component));
  return hit?.value ?? null;
}

export function FundFactSheet({ project, fees = [] }: FundFactSheetProps) {
  const mgmtFee = findFee(fees, /management|mgmt/i);
  const carry = findFee(fees, /carr(y|ied)|incentive|performance.*fee/i);
  const hurdle = findFee(fees, /hurdle|preferred/i);
  const term = findFee(fees, /term|fund.*life|lifespan/i);
  const targetReturn = findFee(fees, /target.*return|target.*irr/i);

  const rows: Array<{ label: string; value: string | null | undefined }> = [
    { label: "Manager", value: (project as any).gp_entity_name || project.fund_name },
    { label: "Strategy", value: project.strategy },
    { label: "Vintage", value: project.vintage },
    { label: "Fund Size", value: (project as any).fund_size_estimated },
    { label: "Domicile", value: (project as any).domicile },
    { label: "Target Return", value: targetReturn },
    { label: "Mgmt Fee", value: mgmtFee },
    { label: "Carry", value: carry },
    { label: "Hurdle", value: hurdle },
    { label: "Term", value: term },
  ];

  return (
    <BlurFade>
      <SectionCard
        title="Fund Fact Sheet"
        subtitle="One-pager on the fund itself — manager, strategy, terms"
        icon={<FileText className="h-4 w-4" />}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3">
          {rows.map((r) => (
            <div key={r.label} className="min-w-0">
              <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">
                {r.label}
              </p>
              <p className="text-xs font-medium text-foreground leading-snug break-words">
                {r.value && String(r.value).trim().length > 0 ? r.value : <span className="text-muted-foreground">—</span>}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </BlurFade>
  );
}