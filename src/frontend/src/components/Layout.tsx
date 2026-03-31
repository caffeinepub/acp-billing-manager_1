import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart2,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  Users,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import type { NavState, Page } from "../App";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface LayoutProps {
  children: ReactNode;
  nav: NavState;
  setNav: (nav: NavState) => void;
}

const NAV_ITEMS: { label: string; page: Page; icon: ReactNode }[] = [
  {
    label: "Dashboard",
    page: "dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  { label: "Customers", page: "customers", icon: <Users size={18} /> },
  { label: "Inventory", page: "inventory", icon: <Package size={18} /> },
  { label: "Invoices", page: "invoices", icon: <FileText size={18} /> },
  { label: "Reports", page: "reports", icon: <BarChart2 size={18} /> },
  { label: "Settings", page: "settings", icon: <Settings size={18} /> },
];

const PAGE_TITLES: Partial<Record<Page, string>> = {
  dashboard: "Dashboard",
  customers: "Customers",
  inventory: "Inventory",
  invoices: "Invoices",
  "invoice-new-packing": "New Packing List",
  "invoice-new-tax": "New Tax Invoice",
  "invoice-edit": "Edit Invoice",
  reports: "Reports",
  settings: "Settings",
};

export default function Layout({ children, nav, setNav }: LayoutProps) {
  const { clear, identity } = useInternetIdentity();
  const { actor } = useActor();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: role } = useQuery({
    queryKey: ["userRole"],
    queryFn: () => actor?.getCallerUserRole(),
    enabled: !!actor,
  });

  const principalShort = `${identity?.getPrincipal().toString().slice(0, 8)}...`;
  const activePage = nav.page;

  const navLink = (item: (typeof NAV_ITEMS)[0]) => (
    <button
      type="button"
      key={item.page}
      data-ocid={`nav.${item.page}.link`}
      onClick={() => {
        setNav({ page: item.page });
        setSidebarOpen(false);
      }}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
        activePage === item.page
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      {item.icon}
      {item.label}
    </button>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          role="presentation"
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:relative z-30 flex flex-col h-full w-60 transition-transform duration-300 bg-sidebar",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Building2 size={16} className="text-sidebar-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sidebar-foreground font-bold text-sm leading-tight truncate">
              ACP Billing
            </p>
            <p className="text-sidebar-foreground/60 text-xs truncate">
              Manager
            </p>
          </div>
          <button
            type="button"
            className="ml-auto lg:hidden text-sidebar-foreground/60"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV_ITEMS.map(navLink)}
        </nav>

        {/* User / logout */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-2 py-1 mb-2">
            <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-xs font-bold text-sidebar-accent-foreground">
                {principalShort?.[0]?.toUpperCase() ?? "U"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sidebar-foreground text-xs font-medium truncate">
                {principalShort}
              </p>
              {role && (
                <p className="text-sidebar-foreground/60 text-xs capitalize">
                  {role}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            data-ocid="nav.logout.button"
            onClick={clear}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="no-print flex items-center gap-3 h-14 px-4 lg:px-6 bg-card border-b border-border shrink-0">
          <button
            type="button"
            className="lg:hidden text-muted-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <h1 className="text-base font-semibold text-foreground">
            {PAGE_TITLES[activePage] ?? "ACP Billing Manager"}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            {role && (
              <Badge
                variant="outline"
                className="text-xs capitalize border-primary/30 text-primary"
              >
                {role}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              className="text-muted-foreground hover:text-foreground hidden sm:flex"
            >
              <LogOut size={14} className="mr-1" />
              Sign Out
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-background">
          {children}
        </main>
        <footer className="no-print py-2 px-6 text-center text-xs text-muted-foreground border-t border-border bg-card shrink-0">
          &copy; {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href="https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}
