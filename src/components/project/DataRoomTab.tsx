import { useState } from "react";
import { Mail, Check } from "lucide-react";
import { MagicCard } from "@/components/magicui/MagicCard";
import { BlurFade } from "@/components/magicui/BlurFade";
import type { Tables } from "@/integrations/supabase/types";

interface DataRoomTabProps {
  items: Tables<"data_room_items">[];
}

export function DataRoomTab({ items }: DataRoomTabProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const critical = items.filter(i => i.priority === 'critical');
  const high = items.filter(i => i.priority === 'high');
  const standard = items.filter(i => i.priority === 'standard');

  const renderGroup = (title: string, groupItems: Tables<"data_room_items">[], dotColor: string) => (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {groupItems.map((item) => (
          <MagicCard
            key={item.id}
            className={`cursor-pointer transition-all ${
              item.is_received ? 'opacity-60' : ''
            } ${selected.has(item.id) ? 'ring-2 ring-ring' : ''}`}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggleItem(item.id)}
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                  selected.has(item.id) || item.is_received
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-border'
                }`}
              >
                {(selected.has(item.id) || item.is_received) && <Check className="h-3 w-3" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{item.document_name}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.purpose}</p>
                {item.module && (
                  <span className="mt-2 inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {item.module}
                  </span>
                )}
              </div>
            </div>
          </MagicCard>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <BlurFade>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Data Room Requests</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Select missing documentation to generate a request email.</p>
          </div>
          <button className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors self-start sm:self-auto">
            <Mail className="h-4 w-4" />
            Generate Email
          </button>
        </div>
      </BlurFade>

      <BlurFade delay={0.1}>
        <div className="space-y-6 sm:space-y-8">
          {critical.length > 0 && renderGroup("Critical Priority", critical, "bg-severity-critical")}
          {high.length > 0 && renderGroup("High Priority", high, "bg-severity-elevated")}
          {standard.length > 0 && renderGroup("Standard Priority", standard, "bg-severity-monitor")}
        </div>
      </BlurFade>
    </div>
  );
}
