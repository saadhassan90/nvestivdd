import { Building2, MessagesSquare, Share2, Sparkles, Bell } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const fundsActive =
    location.pathname === "/dashboard" || location.pathname.startsWith("/project/");
  const notificationsActive = location.pathname.startsWith("/notifications");

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-between gap-2 px-4 py-2">
        {/* Left cluster: icon-only nav items */}
        <div className="flex items-center gap-1">
          <NavLink
            to="/dashboard"
            aria-label="Funds"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-md transition-colors",
              fundsActive
                ? "text-foreground bg-muted"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
          >
            <Building2 className="h-5 w-5" />
          </NavLink>

          <button
            type="button"
            aria-label="Notifications"
            onClick={() => navigate("/notifications")}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-md transition-colors",
              notificationsActive
                ? "text-foreground bg-muted"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
          >
            <Bell className="h-5 w-5" />
          </button>

          {onOpenComments && (
            <button
              type="button"
              aria-label="Comments"
              onClick={onOpenComments}
              className="relative flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <MessagesSquare className="h-5 w-5" />
              {commentsCount > 0 && (
                <span className="absolute top-1 right-1 inline-flex items-center justify-center rounded-full bg-foreground text-background text-[9px] font-bold leading-none min-w-[14px] h-[14px] px-1">
                  {commentsCount > 99 ? "99+" : commentsCount}
                </span>
              )}
            </button>
          )}

          {onOpenShare && (
            <button
              type="button"
              aria-label="Share"
              onClick={onOpenShare}
              className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <Share2 className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Right: Ask Iris pill (landscape) */}
        {onOpenAskIris && (
          <button
            type="button"
            onClick={onOpenAskIris}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 h-10 text-xs font-medium text-background shadow-sm transition-opacity hover:opacity-90 active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Ask Iris
          </button>
        )}
      </div>
    </nav>
  );
}
