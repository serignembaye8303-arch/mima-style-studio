import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { useFavorites } from "@/lib/use-favorites";
import { useAuth } from "@/lib/auth-context";
import type { Product } from "@/lib/products";

export const Route = createFileRoute("/favoris")({ component: Favoris });

function Favoris() {
  const { user } = useAuth();
  const { favorites, loading } = useFavorites();

  if (!user) {
    return (
      <SiteLayout>
        <div className="max-w-md mx-auto px-6 py-32 text-center">
          <h1 className="font-display text-4xl">Vos favoris</h1>
          <p className="mt-4 text-muted-foreground">Connectez-vous pour retrouver vos pièces préférées.</p>
          <Link to="/login" className="mt-6 inline-block bg-foreground text-background px-8 py-3.5 tracking-luxe text-xs">Se connecter</Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="font-display text-5xl text-center">Mes favoris</h1>
        {loading ? (
          <p className="text-center mt-12 text-muted-foreground text-sm">Chargement...</p>
        ) : favorites.length === 0 ? (
          <p className="text-center mt-12 text-muted-foreground">Aucun favori pour le moment.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10 mt-12">
            {favorites.map((f) => f.products && <ProductCard key={f.product_id} product={f.products as unknown as Product} />)}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
