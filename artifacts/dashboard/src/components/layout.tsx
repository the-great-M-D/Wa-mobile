import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Terminal,
  MessageSquare,
  Users,
  Settings2,
  Zap,
  Activity,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useGetBotStatus, useLogoutBot, getGetBotStatusQueryKey } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const { data: status } = useGetBotStatus({ query: { refetchInterval: 5000 } });
  const logout = useLogoutBot();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        toast.success("Bot disconnected");
        queryClient.invalidateQueries({ queryKey: getGetBotStatusQueryKey() });
      },
      onError: (err) => {
        toast.error("Failed to disconnect bot");
        console.error(err);
      },
    });
  };

  const navItems = [
    { href: "/", label: "Console", icon: Terminal },
    { href: "/messages", label: "Messages", icon: MessageSquare },
    { href: "/contacts", label: "Contacts", icon: Users },
    { href: "/auto-replies", label: "Auto-Replies", icon: Zap },
    { href: "/settings", label: "Settings", icon: Settings2 },
  ];

  const statusDot = (
    <div
      className={cn(
        "w-2 h-2 rounded-full shrink-0",
        status?.state === "connected"
          ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
          : status?.state === "connecting" || status?.state === "awaiting_pairing"
          ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
          : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
      )}
    />
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/30">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-sidebar flex flex-col transition-transform duration-300 ease-in-out",
          "md:relative md:translate-x-0 md:z-auto md:shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Sidebar header */}
        <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary border border-primary/30 shadow-[0_0_15px_rgba(79,70,229,0.3)] shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-mono font-bold tracking-tight text-sidebar-foreground truncate">
              WA_CONTROL
            </span>
          </div>
          <button
            className="md:hidden ml-2 p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-10 font-mono text-sm group",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon
                    className={cn(
                      "mr-3 h-4 w-4 transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                    )}
                  />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Status + disconnect */}
        <div className="p-4 border-t border-border shrink-0">
          <div className="rounded-lg bg-card border border-border p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                Status
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono capitalize">
                  {status?.state || "Unknown"}
                </span>
                {statusDot}
              </div>
            </div>
            {(status?.state === "connected" ||
              status?.state === "awaiting_pairing" ||
              status?.state === "connecting") && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-mono h-8 border-border bg-background hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                onClick={handleLogout}
                disabled={logout.isPending}
              >
                <LogOut className="w-3 h-3 mr-2" />
                Disconnect
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background relative z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />

        {/* Mobile top bar */}
        <div className="md:hidden relative z-10 h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center px-4 gap-3 shrink-0">
          <button
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary border border-primary/30 shrink-0">
              <Activity className="w-3 h-3" />
            </div>
            <span className="font-mono font-bold text-sm tracking-tight truncate">WA_CONTROL</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {statusDot}
            <span className="font-mono text-xs capitalize text-muted-foreground">
              {status?.state ?? "—"}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
