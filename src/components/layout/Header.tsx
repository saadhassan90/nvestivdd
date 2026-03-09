import { useState } from "react";
import { Search, Plus, User, Menu, X } from "lucide-react";
import { ShimmerButton } from "@/components/magicui/ShimmerButton";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.svg";

interface HeaderProps {
  onNewDeal?: () => void;
}

export function Header({ onNewDeal }: HeaderProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
        <Link to="/dashboard" className="flex items-center shrink-0">
          <img src={logo} alt="Nvestiv" className="h-5 sm:h-7" />
        </Link>

        {/* Desktop search */}
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

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile search toggle */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
          >
            {mobileSearchOpen ? <X className="h-4 w-4 text-muted-foreground" /> : <Search className="h-4 w-4 text-muted-foreground" />}
          </button>

          {onNewDeal && (
            <>
              {/* Full button on sm+ */}
              <ShimmerButton onClick={onNewDeal} className="hidden sm:inline-flex text-sm">
                <Plus className="h-4 w-4" />
                New Deal
              </ShimmerButton>
              {/* Icon-only on mobile */}
              <button
                onClick={onNewDeal}
                className="sm:hidden flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
              </button>
            </>
          )}
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-border bg-muted">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      {mobileSearchOpen && (
        <div className="md:hidden border-t border-border px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search platform..."
              autoFocus
              className="w-full rounded-lg border-0 bg-muted py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      )}
    </header>
  );
}
