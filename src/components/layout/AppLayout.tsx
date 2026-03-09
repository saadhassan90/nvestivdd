import { type ReactNode } from "react";
import { useChatContext } from "@/contexts/ChatContext";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppLayout({ children }: { children: ReactNode }) {
  const { isOpen } = useChatContext();
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Main content */}
      <div
        className="flex-1 min-w-0 overflow-y-auto transition-all duration-300 ease-in-out"
        style={{
          marginRight: !isMobile && isOpen ? 420 : 0,
        }}
      >
        {children}
      </div>

      {/* Chat drawer */}
      {isOpen && (
        <>
          {isMobile ? (
            <div className="fixed inset-0 z-50 bg-card">
              <ChatSidebar />
            </div>
          ) : (
            <div
              className="fixed right-0 top-0 bottom-0 z-40 animate-slide-in-right"
              style={{ width: 420 }}
            >
              <ChatSidebar />
            </div>
          )}
        </>
      )}
    </div>
  );
}
