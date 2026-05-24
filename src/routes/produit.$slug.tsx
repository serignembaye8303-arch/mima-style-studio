import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, Minus, Plus, Truck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { fetchProductBySlug } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart-context";
import { useFavorites } from "@/lib/use-favorites";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/produit/$slug")({
  component: ProductPage,
  notFoundComponent: () => (
    <SiteLayout><div className="py-32 text-center"><h1 className="font-display text-4xl">Produit introuvable</h1><Link to="/boutique" className="mt-6 inline-block tracking-luxe text-xs border-b border-foreground pb-1">Retour à la boutique</Link></div></SiteLayout>
  ),
  errorComponent: () => <SiteLayout><div className="py-32 text-center text-muted-foreground">Erreur de chargement</div></SiteLayout>,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const { add } = useCart();
  const { isFavorite, toggle } = useFavorites();
  const [size, setSize] = useState<string>();
  const [color, setColor] = useState<string>();
  const [qty, setQty] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductBySlug(slug),
  });

  if (isLoading) return <SiteLayout><div className="py-32 text-center text-muted-foreground">Chargement...</div></SiteLayout>;
  if (!product) throw notFound();

  const price = product.sale_price ?? product.price;
  const fav = isFavorite(product.id);

  const handleAdd = () => {
    if (product.sizes.length > 0 && !size) { toast.error("Choisissez une taille"); return; }
    if (product.colors.length > 0 && !color) { toast.error("Choisissez une couleur"); return; }
    add({ id: product.id, name: product.name, price, image: product.images[0], size, color, quantity: qty });
    toast.success("Ajouté au panier");
  };

  return (
    <SiteLayout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <nav className="text-[11px] tracking-luxe text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground">Accueil</Link> · <Link to="/boutique" className="hover:text-foreground">Boutique</Link> · <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="bg-secondary aspect-[4/5] overflow-hidden">
            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
          </div>
          <div className="lg:py-8">
            {product.is_new && <span className="bg-foreground text-background text-[9px] tracking-luxe px-2.5 py-1 inline-block mb-4">Nouveau</span>}
            <h1 className="font-display text-4xl sm:text-5xl">{product.name}</h1>
            <p className="text-[11px] tracking-luxe text-muted-foreground mt-2 capitalize">{product.category}</p>
            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-2xl font-display">{formatPrice(price, product.currency)}</span>
              {product.sale_price && <span className="text-sm text-muted-foreground line-through">{formatPrice(product.price, product.currency)}</span>}
            </div>
            <p className="mt-6 text-muted-foreground leading-relaxed">{product.description}</p>

            {product.sizes.length > 0 && (
              <div className="mt-8">
                <p className="tracking-luxe text-[10px] text-muted-foreground mb-3">Taille</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button key={s} onClick={() => setSize(s)} className={`min-w-12 px-4 py-2.5 text-xs border ${size === s ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {product.colors.length > 0 && (
              <div className="mt-6">
                <p className="tracking-luxe text-[10px] text-muted-foreground mb-3">Couleur</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button key={c} onClick={() => setColor(c)} className={`px-4 py-2.5 text-xs border ${color === c ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}>{c}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center border border-border">
                <button className="p-3" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-3 w-3" /></button>
                <span className="text-xs w-8 text-center">{qty}</span>
                <button className="p-3" onClick={() => setQty(qty + 1)}><Plus className="h-3 w-3" /></button>
              </div>
              <button onClick={handleAdd} className="flex-1 bg-foreground text-background py-4 tracking-luxe text-xs hover:bg-foreground/90">Ajouter au panier</button>
              <button
                onClick={() => { if (!user) { toast.error("Connectez-vous pour ajouter aux favoris"); return; } toggle(product.id); }}
                className="p-4 border border-border hover:border-foreground"
                aria-label="Favori"
              >
                <Heart className="h-4 w-4" style={fav ? { fill: "var(--rose-deep)", color: "var(--rose-deep)" } : undefined} />
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-border space-y-3 text-sm">
              <p className="flex items-center gap-3 text-muted-foreground"><Truck className="h-4 w-4 text-gold" />Livraison Dakar 24h, international 3-7j</p>
              <p className="flex items-center gap-3 text-muted-foreground"><ShieldCheck className="h-4 w-4 text-gold" />Paiement à la livraison ou via WhatsApp</p>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
