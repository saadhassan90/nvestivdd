import { ArrowLeft, Trash2 } from "lucide-react";
import { useChatContext } from "@/contexts/ChatContext";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

function groupByTime(items: { created_at: string }[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const week = new Date(today.getTime() - 7 * 86400000);

  const groups: Record<string, typeof items> = { Today: [], Yesterday: [], "Previous 7 Days": [], Older: [] };
  items.forEach((item) => {
    const d = new Date(item.created_at);
    if (d >= today) groups["Today"].push(item);
    else if (d >= yesterday) groups["Yesterday"].push(item);
    else if (d >= week) groups["Previous 7 Days"].push(item);
    else groups["Older"].push(item);
  });
  return groups;
}

export function ChatHistory({ onBack }: { onBack: () => void }) {
  const { conversations, loadConversation, deleteConversation } = useChatContext();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const groups = groupByTime(conversations);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <button onClick={onBack} className="p-1 rounded-md hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-semibold text-foreground">Chat History</span>
      </div>

      {conversations.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">No conversations yet</div>
      ) : (
        <div className="py-2">
          {Object.entries(groups).map(([label, items]) =>
            items.length === 0 ? null : (
              <div key={label}>
                <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                {items.map((conv: any) => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => { loadConversation(conv.id); onBack(); }}
                    onMouseEnter={() => setHoveredId(conv.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{conv.title}</p>
                      <p className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(conv.created_at), { addSuffix: true })}</p>
                    </div>
                    {hoveredId === conv.id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                        className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
