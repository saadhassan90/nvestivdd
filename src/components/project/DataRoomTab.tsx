import { useState } from "react";
import { Mail, Check, FolderOpen } from "lucide-react";
import { MagicCard } from "@/components/magicui/MagicCard";
import { BlurFade } from "@/components/magicui/BlurFade";
import type { Tables } from "@/integrations/supabase/types";

interface DataRoomTabProps {
  items: Tables<"data_room_items">[];
}

const TIER_META: Record<string, { label: string; desc: string; dot: string }> = {
  critical: { label: "Tier 1: Essential", desc: "Deal-breaking if missing — required for go/no-go decision", dot: "bg-severity-critical" },
  high: { label: "Tier 2: Important", desc: "Significant diligence value for advanced review", dot: "bg-severity-elevated" },
  medium: { label: "Tier 3: Standard", desc: "Required for final investment decision", dot: "bg-score-advance" },
  standard: { label: "Tier 4: Nice-to-Have", desc: "Enhances confidence; can supplement via interrogatory", dot: "bg-severity-monitor" },
};

export function DataRoomTab({ items }: DataRoomTabProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Group by priority, then by module within each priority
  const priorities = ['critical', 'high', 'medium', 'standard'];

  const groupByModule = (groupItems: Tables<"data_room_items">[]) => {
    const modules: Record<string, Tables<"data_room_items">[]> = {};
    groupItems.forEach(item => {
      const mod = item.module || 'General';
      if (!modules[mod]) modules[mod] = [];
      modules[mod].push(item);
    });
    return modules;
  };

  const receivedCount = items.filter(i => i.is_received).length;
  const selectedCount = selected.size;

  return (
    <div className="space-y-4 sm:space-y-6">
      <BlurFade>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Data Room Request Checklist</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {receivedCount} of {items.length} documents received • Select missing items to generate request email.
            </p>
          </div>
          {selectedCount > 0 && (
            <button className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors self-start sm:self-auto">
              <Mail className="h-4 w-4" />
              Request {selectedCount} Items
            </button>
          )}
        </div>
      </BlurFade>

      <BlurFade delay={0.1}>
        <div className="space-y-8">
          {priorities.map(priority => {
            const groupItems = items.filter(i => i.priority === priority);
            if (groupItems.length === 0) return null;
            const meta = TIER_META[priority] || TIER_META.standard;
            const moduleGroups = groupByModule(groupItems);

            return (
              <div key={priority}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground">{meta.label}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mb-4 ml-[18px]">{meta.desc}</p>

                <div className="space-y-5 ml-[18px]">
                  {Object.entries(moduleGroups).map(([module, modItems]) => (
                    <div key={module}>
                      <div className="flex items-center gap-2 mb-2">
                        <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{module}</span>
                      </div>
                      <div className="space-y-1.5">
                        {modItems.map((item) => {
                          const isChecked = item.is_received || selected.has(item.id);
                          return (
                            <div
                              key={item.id}
                              className={`flex items-start gap-3 rounded-lg border border-border p-3 transition-all cursor-pointer hover:bg-muted/30 ${
                                item.is_received ? 'opacity-50' : ''
                              } ${selected.has(item.id) ? 'ring-1 ring-ring bg-muted/20' : ''}`}
                              onClick={() => !item.is_received && toggleItem(item.id)}
                            >
                              <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                                isChecked
                                  ? 'bg-primary border-primary text-primary-foreground'
                                  : 'border-border'
                              }`}>
                                {isChecked && <Check className="h-3 w-3" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${item.is_received ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                  {item.document_name}
                                </p>
                                {item.purpose && (
                                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.purpose}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </BlurFade>
    </div>
  );
}
