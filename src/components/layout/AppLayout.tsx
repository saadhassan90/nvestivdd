import { type ReactNode } from "react";
import { useOptionalChatContext } from "@/contexts/ChatContext";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { LpRail } from "@/components/layout/LpRail";
import { LpRailActionsProvider } from "@/contexts/LpRailActionsContext";

export function AppLayout({ children }: { children: ReactNode }) {
  const chat = useOptionalChatContext();
  const isOpen = chat?.isOpen ?? false;
  const chatWidth = chat?.chatWidth ?? 420;
  const isMobile = useIsMobile();
  // The global Iris drawer is available on every route, including the IC
  // memo workspace, so the chat keeps context as the user navigates.
  const drawerActive = isOpen;

  return (
    <LpRailActionsProvider>
    <div className="flex h-screen w-full overflow-hidden">
      {/* Persistent LP icon rail (desktop only — mobile uses MobileBottomNav) */}
      {!isMobile && <LpRail />}

      {/* Main content */}
      <div
        className="flex-1 min-w-0 overflow-y-auto transition-[margin] duration-200 ease-out"
        style={{
          marginLeft: !isMobile && drawerActive ? chatWidth : 0,
        }}
      >
        {children}
      </div>

      {/* Chat drawer */}
      {drawerActive && (
        <>
          {isMobile ? (
            <div className="fixed inset-0 z-50 bg-card">
              <ChatSidebar />
            </div>
          ) : (
            <div
              className="fixed bottom-0 z-30 animate-slide-in-left"
              style={{ width: chatWidth, top: 0, left: 56 }}
            >
              <ChatSidebar />
            </div>
          )}
        </>
      )}
    </div>
    </LpRailActionsProvider>
  );
}
