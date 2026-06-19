import { Link, Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { GpSidebar } from "./GpSidebar";
import { VariantSwitcher } from "@/components/layout/VariantSwitcher";
import logo from "@/assets/logo.svg";

export function GpShell() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <GpSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 border-b border-border bg-card">
            <div className="flex h-14 items-center gap-3 px-4">
              <SidebarTrigger />
              <Link to="/chat" className="flex items-center shrink-0">
                <img src={logo} alt="Nvestiv" className="h-5 sm:h-6" />
              </Link>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
                Manager
              </span>
              <div className="ml-auto">
                <VariantSwitcher />
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}