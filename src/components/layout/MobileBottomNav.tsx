import { Building2, MessagesSquare, Share2, Sparkles } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  /** When provided, shows the Comments action (project context). */
  onOpenComments?: () => void;
  commentsCount?: number;
  /** When provided, shows the Share action (project context). */
  onOpenShare?: () => void;
  /** When provided, shows the Ask Iris action (project context). */
  onOpenAskIris?: () => void;
}

export function MobileBottomNav({
  onOpenComments,
  commentsCount = 0,
  onOpenShare,
  onOpenAskIris,
}: MobileBottomNavProps = {}) {
  const location = useLocation();
  const fundsActive =
    location.pathname === "/dashboard" || location.pathname.startsWith("/project/");

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card">
      <div className="flex items-center justify-around py-1.5">
        {/* Funds — always present, leftmost */}
        <NavLink
          to="/dashboard"
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors",
            fundsActive ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <Building2 className="h-4 w-4" />
          Funds
        </NavLink>

        {onOpenComments && (
          <button
            type="button"
            onClick={onOpenComments}
            className="relative flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="relative">
              <MessagesSquare className="h-4 w-4" />
              {commentsCount > 0 && (
                <span className="absolute -top-1 -right-2 inline-flex items-center justify-center rounded-full bg-foreground text-background text-[9px] font-bold leading-none min-w-[14px] h-[14px] px-1">
                  {commentsCount > 99 ? "99+" : commentsCount}
                </span>
              )}
            </span>
            Comments
          </button>
        )}

        {onOpenShare && (
          <button
            type="button"
            onClick={onOpenShare}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        )}

        {onOpenAskIris && (
          <button
            type="button"
            onClick={onOpenAskIris}
            className="ml-auto flex flex-col items-center gap-0.5 rounded-md bg-foreground px-3 py-1 text-[10px] font-medium text-background transition-opacity hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" />
            Ask Iris
          </button>
        )}
      </div>
    </nav>
  );
}
