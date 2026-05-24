import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { useFavorites } from "@/lib/use-favorites";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(product.id);
  const onSale = product.sale_price && product.sale_price < product.price;

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Connectez-vous pour ajouter aux favoris");
      return;
    }
    toggle(product.id);
  };

  return (
    <Link to="/produit/$slug" params={{ slug: product.slug }} className="group block">
      <div className="relative aspect-[4/5] bg-secondary overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.is_new && (
            <span className="bg-foreground text-background text-[9px] tracking-luxe px-2.5 py-1">Nouveau</span>
          )}
          {onSale && (
            <span className="bg-rose text-foreground text-[9px] tracking-luxe px-2.5 py-1">Promo</span>
          )}
        </div>
        <button
          onClick={handleFav}
          aria-label="Favori"
          className="absolute top-3 right-3 h-9 w-9 bg-background/90 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
        >
          <Heart className={`h-4 w-4 ${fav ? "fill-rose-deep text-rose-deep" : ""}`} style={fav ? { fill: "var(--rose-deep)", color: "var(--rose-deep)" } : undefined} />
        </button>
      </div>
      <div className="pt-4 pb-2">
        <h3 className="font-display text-lg leading-tight">{product.name}</h3>
        <p className="text-[11px] tracking-luxe text-muted-foreground mt-1 capitalize">{product.category}</p>
        <div className="mt-2 flex items-baseline gap-2">
          {onSale ? (
            <>
              <span className="text-foreground font-medium">{formatPrice(product.sale_price!, product.currency)}</span>
              <span className="text-xs text-muted-foreground line-through">{formatPrice(product.price, product.currency)}</span>
            </>
          ) : (
            <span className="text-foreground font-medium">{formatPrice(product.price, product.currency)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
