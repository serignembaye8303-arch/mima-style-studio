import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { fetchProducts } from "@/lib/products";
import { CATEGORIES } from "@/lib/format";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";

const searchSchema = z.object({
  category: fallback(z.string().optional(), undefined),
  q: fallback(z.string().optional(), undefined),
});

export const Route = createFileRoute("/boutique")({
  validateSearch: zodValidator(searchSchema),
  component: Boutique,
});

function Boutique() {
  const { category, q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [query, setQuery] = useState(q ?? "");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", category, q],
    queryFn: () => fetchProducts({ category, search: q }),
  });

  return (
    <SiteLayout>
      <section className="border-b border-border bg-secondary/40">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <p className="tracking-luxe text-[10px] text-gold">La boutique</p>
          <h1 className="mt-3 font-display text-5xl sm:text-6xl">
            {category ? CATEGORIES.find((c) => c.slug === category)?.label : "Toute la collection"}
          </h1>
          <form
            onSubmit={(e) => { e.preventDefault(); navigate({ search: (p) => ({ ...p, q: query || undefined }) }); }}
            className="mt-8 max-w-md mx-auto flex items-center border-b border-foreground"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une pièce..."
              className="flex-1 bg-transparent px-3 py-2.5 text-sm focus:outline-none placeholder:text-muted-foreground"
            />
          </form>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <nav className="flex flex-wrap gap-2 mb-10 justify-center">
          <Link
            to="/boutique"
            className={`text-[11px] tracking-luxe px-4 py-2 border ${!category ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"}`}
          >Toutes</Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to="/boutique"
              search={{ category: c.slug }}
              className={`text-[11px] tracking-luxe px-4 py-2 border ${category === c.slug ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"}`}
            >{c.label}</Link>
          ))}
        </nav>

        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground text-sm">Chargement...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">Aucun produit pour le moment.</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
