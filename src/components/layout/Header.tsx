import { useState } from "react";
import { Search, Sparkles, X, PanelRightClose } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.svg";
import { ShimmerButton } from "@/components/magicui/ShimmerButton";
import { useChatContext } from "@/contexts/ChatContext";

export function Header() {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { isOpen, setIsOpen } = useChatContext();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card">
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

          {/* Ask AI / Close panel */}
          {isOpen ? (
            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              <PanelRightClose className="h-4 w-4" />
              <span className="hidden sm:inline">Close AI</span>
            </button>
          ) : (
            <ShimmerButton
              onClick={() => setIsOpen(true)}
              className="text-sm shadow-lg"
              shimmerColor="hsl(217, 91%, 60%)"
              background="hsl(0, 0%, 5%)"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Ask Iris</span>
            </ShimmerButton>
          )}
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
