import { useState } from "react";
import { Search, Sparkles, X } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.svg";
import { ShimmerButton } from "@/components/magicui/ShimmerButton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Header() {
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

          {/* Ask Iris */}
          <Sheet>
            <SheetTrigger asChild>
              <ShimmerButton className="text-sm shadow-lg" shimmerColor="hsl(217, 91%, 60%)" background="hsl(0, 0%, 5%)">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Ask Iris</span>
              </ShimmerButton>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Iris AI Assistant
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-1 items-center justify-center py-20">
                <p className="text-sm text-muted-foreground">Coming soon...</p>
              </div>
            </SheetContent>
          </Sheet>
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
