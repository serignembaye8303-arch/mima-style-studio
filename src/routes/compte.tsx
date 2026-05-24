import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { useAuth } from "@/lib/auth-context";
import { useFavorites } from "@/lib/use-favorites";

export const Route = createFileRoute("/compte")({ component: Compte });

function Compte() {
  const { user, loading, signOut } = useAuth();
  const { favorites } = useFavorites();
  const navigate = useNavigate();

  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [user, loading, navigate]);

  if (!user) return null;
  const name = (user.user_metadata?.display_name as string | undefined) ?? user.email?.split("@")[0];

  return (
    <SiteLayout>
      <div className="max-w-4xl mx-auto px-6 py-16">
        <p className="tracking-luxe text-[10px] text-gold">Mon espace</p>
        <h1 className="mt-2 font-display text-5xl">Bonjour, {name}</h1>
        <p className="text-muted-foreground mt-2">{user.email}</p>

        <div className="grid sm:grid-cols-3 gap-4 mt-12">
          <Link to="/favoris" className="border border-border p-6 hover:border-foreground">
            <p className="tracking-luxe text-[10px] text-gold">Favoris</p>
            <p className="font-display text-3xl mt-2">{favorites.length}</p>
            <p className="text-xs text-muted-foreground mt-1">pièces sauvegardées</p>
          </Link>
          <Link to="/boutique" className="border border-border p-6 hover:border-foreground">
            <p className="tracking-luxe text-[10px] text-gold">Boutique</p>
            <p className="font-display text-3xl mt-2">↗</p>
            <p className="text-xs text-muted-foreground mt-1">Voir la collection</p>
          </Link>
          <Link to="/contact" className="border border-border p-6 hover:border-foreground">
            <p className="tracking-luxe text-[10px] text-gold">Aide</p>
            <p className="font-display text-3xl mt-2">✎</p>
            <p className="text-xs text-muted-foreground mt-1">Nous contacter</p>
          </Link>
        </div>

        <button onClick={() => { signOut(); navigate({ to: "/" }); }} className="mt-12 text-xs tracking-luxe border-b border-foreground pb-1">
          Se déconnecter
        </button>
      </div>
    </SiteLayout>
  );
}
