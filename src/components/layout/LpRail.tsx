import { Link, NavLink } from "react-router-dom";
import { LayoutDashboard, Bell, Check, UserCog } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUiVariant, type UiVariant } from "@/contexts/UiVariantContext";
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/nvestiv-logomark.svg.asset.json";

const RAIL_ITEMS = [
  { to: "/dashboard", label: "Funds", icon: LayoutDashboard, match: (p: string) => p === "/dashboard" || p.startsWith("/project/") },
  { to: "/notifications", label: "Notifications", icon: Bell, match: (p: string) => p.startsWith("/notifications") },
];

const VARIANT_OPTIONS: { value: UiVariant; label: string }[] = [
  { value: "adia", label: "LP — ADIA" },
  { value: "general", label: "LP — General" },
  { value: "gp", label: "GP" },
];

export function LpRail() {
  const { variant, setVariant } = useUiVariant();
  return (
    <nav className="w-14 shrink-0 border-r border-border bg-card flex flex-col items-center py-3 gap-1 sticky top-0 h-screen z-40">
      <Link to="/dashboard" className="mb-1 flex h-8 w-8 items-center justify-center" title="Nvestiv">
        <img src={logoAsset.url} alt="Nvestiv" className="h-6 w-auto object-contain" />
      </Link>
      {RAIL_ITEMS.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          title={it.label}
          className={({ isActive }) =>
            cn(
              "flex h-10 w-10 items-center justify-center rounded-md transition-colors",
              (isActive || it.match(window.location.pathname))
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )
          }
        >
          <it.icon className="h-4 w-4" />
        </NavLink>
      ))}
      <div className="mt-auto flex flex-col items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50"
              title="Switch UI variant"
              aria-label="Switch UI variant"
            >
              <UserCog className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-40">
            {VARIANT_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => setVariant(opt.value)}
                className="flex items-center justify-between"
              >
                <span>{opt.label}</span>
                {variant === opt.value && <Check className="h-3.5 w-3.5" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}