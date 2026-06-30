import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, NavLink } from "react-router-dom";
import { MessageSquare, Briefcase, Network, Users, Settings as SettingsIcon, PanelLeftClose, PanelLeftOpen, Plus, Check, UserCog, MoreHorizontal, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUiVariant, type UiVariant } from "@/contexts/UiVariantContext";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useChatContext } from "@/contexts/ChatContext";
import { ChatResizeHandle } from "@/components/chat/ChatResizeHandle";
import { formatDistanceToNow } from "date-fns";
import logoAsset from "@/assets/nvestiv-logomark.svg.asset.json";
import { cn } from "@/lib/utils";
import { PageContextSync } from "@/components/iris/PageContextSync";
import { IrisProposalsBanner } from "@/components/iris/IrisProposalsBanner";
import SolarFlareBackground from "@/components/ui/SolarFlareBackground";

const RAIL_ITEMS = [
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/raises", label: "Raises", icon: Briefcase },
  { to: "/pipeline", label: "Pipeline", icon: Network },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

const PANEL_OPEN_KEY = "gp.chatPanelOpen";

export function GpShell() {
  const { pathname } = useLocation();
  const { chatWidth, conversations, loadConversations, loadConversation, conversationId, startNewConversation, deleteConversation } = useChatContext() as any;
  const { variant, setVariant } = useUiVariant();
  const variantOptions: { value: UiVariant; label: string }[] = [
    { value: "adia", label: "LP — ADIA" },
    { value: "general", label: "LP — General" },
    { value: "gp", label: "GP" },
  ];
  const [panelOpen, setPanelOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = window.localStorage.getItem(PANEL_OPEN_KEY);
    return v === null ? true : v === "1";
  });
  useEffect(() => {
    try { window.localStorage.setItem(PANEL_OPEN_KEY, panelOpen ? "1" : "0"); } catch {}
  }, [panelOpen]);

  const isChatPage = pathname === "/chat";

  useEffect(() => {
    if (isChatPage) loadConversations?.();
  }, [isChatPage, loadConversations]);

  // On /chat, the chat takes over the body. On every other route, chat is
  // a persistent left dock that reflows (not overlays) the body.
  const showDockedChat = !isChatPage && panelOpen;

  return (
    <div className="min-h-screen flex w-full bg-background">
      <PageContextSync />
      <IrisProposalsBanner />
      {/* Icon nav rail — always visible */}
      <nav className="w-14 shrink-0 border-r border-border bg-card flex flex-col items-center py-3 gap-1 sticky top-0 h-screen z-40">
        <Link to="/chat" className="mb-1 flex h-8 w-8 items-center justify-center" title="Nvestiv">
          <img src={logoAsset.url} alt="Nvestiv" className="h-6 w-auto object-contain" />
        </Link>
        {!isChatPage && (
          <button
            onClick={() => setPanelOpen((o) => !o)}
            className="mb-1 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50"
            title={panelOpen ? "Hide chat" : "Show chat"}
          >
            {panelOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
        )}
        {RAIL_ITEMS.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            title={it.label}
            className={({ isActive }) =>
              cn(
                "flex h-10 w-10 items-center justify-center rounded-md transition-colors",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )
            }
          >
            <it.icon className="h-4 w-4" />
          </NavLink>
        ))}
        <div className="mt-auto flex flex-col items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50"
                title="Switch UI variant"
                aria-label="Switch UI variant"
              >
                <UserCog className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-40">
              {variantOptions.map((opt) => (
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
        </div>
      </nav>

      {/* Docked chat panel — reflow, not overlay */}
      {showDockedChat && (
        <div
          className="relative shrink-0 border-r border-border bg-card sticky top-0 h-screen self-start"
          style={{ width: chatWidth }}
        >
          <ChatSidebar />
          <ChatResizeHandle />
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto">
          {isChatPage ? (
            // Full-page chat: history panel + conversation
            <div className="h-screen flex">
              <aside className="w-48 lg:w-52 shrink-0 border-r border-border bg-card flex flex-col">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                  <span className="text-xs font-medium text-muted-foreground">history</span>
                  <button
                    onClick={() => startNewConversation?.()}
                    className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="New chat"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-1.5">
                  {(!conversations || conversations.length === 0) ? (
                    <div className="px-2.5 py-6 text-center text-[11px] text-muted-foreground">No conversations yet</div>
                  ) : (
                    conversations.map((conv: any) => {
                      const active = conversationId === conv.id;
                      return (
                        <div
                          key={conv.id}
                          onClick={() => loadConversation?.(conv.id)}
                          className={cn(
                            "group relative flex items-center gap-1 rounded-md pl-2.5 pr-1 py-1.5 cursor-pointer transition-colors text-muted-foreground",
                            active
                              ? "bg-muted text-foreground"
                              : "hover:bg-muted/60 hover:text-foreground"
                          )}
                        >
                          <p
                            className={cn(
                              "min-w-0 flex-1 text-xs truncate",
                              active ? "font-medium" : "font-normal"
                            )}
                            title={conv.title}
                          >
                            {conv.title}
                          </p>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className={cn(
                                  "p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-background/60 transition-opacity",
                                  active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                )}
                                aria-label="Conversation actions"
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              side="right"
                              className="w-32"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenuItem
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await deleteConversation?.(conv.id);
                                  await loadConversations?.();
                                  if (active) startNewConversation?.();
                                }}
                                className="text-destructive focus:text-destructive text-xs"
                              >
                                <Trash2 className="h-3 w-3 mr-1.5" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })
                  )}
                </div>
              </aside>
              <div className="relative flex-1 min-w-0">
                <ChatSidebar hideHeader />
                <div className="pointer-events-none absolute inset-0 z-20" style={{ mixBlendMode: 'multiply' }}>
                  <SolarFlareBackground opacity={0.12} />
                </div>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}