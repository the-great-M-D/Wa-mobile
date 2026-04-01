import { Link, useLocation } from "wouter";
import { 
  Terminal, 
  MessageSquare, 
  Users, 
  Settings2, 
  Zap, 
  Activity,
  LogOut
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

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        toast.success("Bot disconnected");
        queryClient.invalidateQueries({ queryKey: getGetBotStatusQueryKey() });
      },
      onError: (err) => {
        toast.error("Failed to disconnect bot");
        console.error(err);
      }
    });
  };

  const navItems = [
    { href: "/", label: "Console", icon: Terminal },
    { href: "/messages", label: "Messages", icon: MessageSquare },
    { href: "/contacts", label: "Contacts", icon: Users },
    { href: "/auto-replies", label: "Auto-Replies", icon: Zap },
    { href: "/settings", label: "Settings", icon: Settings2 },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col z-10 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary border border-primary/30 shadow-[0_0_15px_rgba(79,70,229,0.3)]">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-mono font-bold tracking-tight text-sidebar-foreground">
              WA_CONTROL
            </span>
          </div>
        </div>

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
                >
                  <Icon className={cn(
                    "mr-3 h-4 w-4 transition-colors", 
                    isActive ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                  )} />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="rounded-lg bg-card border border-border p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Status</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono capitalize">
                  {status?.state || "Unknown"}
                </span>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  status?.state === "connected" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                  status?.state === "connecting" || status?.state === "awaiting_pairing" ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" :
                  "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                )} />
              </div>
            </div>
            {(status?.state === "connected" || status?.state === "awaiting_pairing" || status?.state === "connecting") && (
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background relative z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
        <div className="flex-1 overflow-y-auto p-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
