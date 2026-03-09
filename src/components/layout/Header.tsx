import { Search, Plus, User } from "lucide-react";
import { ShimmerButton } from "@/components/magicui/ShimmerButton";
import { Link } from "react-router-dom";

interface HeaderProps {
  onNewDeal?: () => void;
}

export function Header({ onNewDeal }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-6">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">N</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">Nvestiv</span>
        </Link>

        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search platform..."
              className="w-full rounded-lg border-0 bg-muted py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onNewDeal && (
            <ShimmerButton onClick={onNewDeal} className="text-sm">
              <Plus className="h-4 w-4" />
              New Deal
            </ShimmerButton>
          )}
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </header>
  );
}
