import { type ReactNode } from "react";
import { useOptionalChatContext } from "@/contexts/ChatContext";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";

export function AppLayout({ children }: { children: ReactNode }) {
  const chat = useOptionalChatContext();
  const isOpen = chat?.isOpen ?? false;
  const chatWidth = chat?.chatWidth ?? 420;
  const isMobile = useIsMobile();
  const location = useLocation();
  // Suppress the global Iris drawer on the IC memo workspace —
  // that page hosts its own embedded chat in the right column.
  const isMemoRoute = /^\/project\/[^/]+\/memo$/.test(location.pathname);
  const drawerActive = isOpen && !isMemoRoute;

  return (
    <div className="flex h-screen w-full overflow-hidden">
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
              className="fixed left-0 top-0 bottom-0 z-40 animate-slide-in-left"
              style={{ width: chatWidth }}
            >
              <ChatSidebar />
            </div>
          )}
        </>
      )}
    </div>
  );
}
