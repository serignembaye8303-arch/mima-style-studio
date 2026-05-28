import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useIsStaff } from "@/lib/use-role";
import { AdminSidebar, AdminMobileNav } from "@/components/admin/AdminSidebar";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Mima Boutique" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading } = useAuth();
  const { isStaff, isLoading } = useIsStaff();

  if (loading || (user && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center space-y-4">
          <p className="tracking-luxe text-xs text-gold">Espace réservé</p>
          <h1 className="font-display text-4xl">Connexion administrateur</h1>
          <p className="text-sm text-muted-foreground">Vous devez être connecté avec un compte staff pour accéder au back-office Mima.</p>
          <Link to="/login" className="inline-block bg-foreground text-background px-6 py-2.5 text-xs tracking-luxe">Se connecter</Link>
        </div>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center space-y-4">
          <p className="tracking-luxe text-xs text-destructive">Accès refusé</p>
          <h1 className="font-display text-3xl">Permissions insuffisantes</h1>
          <p className="text-sm text-muted-foreground">Votre compte n'a pas accès à l'espace admin. Contactez un super administrateur.</p>
          <Link to="/" className="inline-block border border-foreground px-6 py-2.5 text-xs tracking-luxe">Retour boutique</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex">
      <AdminSidebar />
      <div className="flex-1 min-w-0">
        <AdminMobileNav />
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
