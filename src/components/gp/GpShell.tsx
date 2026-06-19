import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, NavLink } from "react-router-dom";
import { MessageSquare, Briefcase, Network, Users, Settings as SettingsIcon, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { VariantSwitcher } from "@/components/layout/VariantSwitcher";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useChatContext } from "@/contexts/ChatContext";
import { ChatResizeHandle } from "@/components/chat/ChatResizeHandle";
import logo from "@/assets/logo.svg";
import { cn } from "@/lib/utils";

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
  const { chatWidth } = useChatContext();
  const [panelOpen, setPanelOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = window.localStorage.getItem(PANEL_OPEN_KEY);
    return v === null ? true : v === "1";
  });
  useEffect(() => {
    try { window.localStorage.setItem(PANEL_OPEN_KEY, panelOpen ? "1" : "0"); } catch {}
  }, [panelOpen]);

  const isChatPage = pathname === "/chat";
  // On /chat, the chat takes over the body. On every other route, chat is
  // a persistent left dock that reflows (not overlays) the body.
  const showDockedChat = !isChatPage && panelOpen;

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Icon nav rail — always visible */}
      <nav className="w-14 shrink-0 border-r border-border bg-card flex flex-col items-center py-3 gap-1 sticky top-0 h-screen z-40">
        <Link to="/chat" className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-foreground">
          <span className="text-[10px] font-bold text-background">N</span>
        </Link>
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
      </nav>

      {/* Docked chat panel — reflow, not overlay */}
      {showDockedChat && (
        <div
          className="relative shrink-0 border-r border-border bg-card"
          style={{ width: chatWidth }}
        >
          <ChatSidebar />
          <ChatResizeHandle />
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b border-border bg-card">
          <div className="flex h-14 items-center gap-3 px-4">
            {!isChatPage && (
              <button
                onClick={() => setPanelOpen((o) => !o)}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
                title={panelOpen ? "Hide chat" : "Show chat"}
              >
                {panelOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              </button>
            )}
            <Link to="/chat" className="flex items-center shrink-0">
              <img src={logo} alt="Nvestiv" className="h-5 sm:h-6" />
            </Link>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
              Manager
            </span>
            <div className="ml-auto">
              <VariantSwitcher />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {isChatPage ? (
            // Full-page chat: same conversation, expanded
            <div className="h-[calc(100vh-3.5rem)]">
              <ChatSidebar />
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}