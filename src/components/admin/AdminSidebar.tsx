import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ShoppingBag, Package, Users, BarChart3, Megaphone, Bell, Settings, Boxes, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const items = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Produits", icon: ShoppingBag },
  { to: "/admin/orders", label: "Commandes", icon: Package },
  { to: "/admin/stock", label: "Stocks", icon: Boxes },
  { to: "/admin/users", label: "Utilisateurs", icon: Users },
  { to: "/admin/analytics", label: "Statistiques", icon: BarChart3 },
  { to: "/admin/promotions", label: "Promotions", icon: Megaphone },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/settings", label: "Paramètres", icon: Settings },
];

export function AdminSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { signOut } = useAuth();
  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-foreground text-background min-h-screen sticky top-0">
      <div className="p-6 border-b border-background/10">
        <Link to="/" className="block">
          <p className="font-display text-2xl">Mima</p>
          <p className="tracking-luxe text-[10px] text-gold mt-1">Espace admin</p>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-6 space-y-1">
        {items.map((it) => {
          const active = it.exact ? path === it.to : path.startsWith(it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                active ? "bg-background text-foreground" : "text-background/70 hover:bg-background/10 hover:text-background",
              )}
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => signOut()}
        className="m-3 flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-background/70 hover:bg-background/10 hover:text-background"
      >
        <LogOut className="h-4 w-4" /> Déconnexion
      </button>
    </aside>
  );
}

export function AdminMobileNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="md:hidden sticky top-0 z-30 bg-foreground text-background overflow-x-auto">
      <div className="flex gap-1 px-3 py-2">
        {items.map((it) => {
          const active = it.exact ? path === it.to : path.startsWith(it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-xs whitespace-nowrap",
                active ? "bg-background text-foreground" : "text-background/70",
              )}
            >
              <it.icon className="h-3.5 w-3.5" />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
