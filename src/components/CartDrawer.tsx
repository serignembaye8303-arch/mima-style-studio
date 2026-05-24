import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart, cartItemKey } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { Link } from "@tanstack/react-router";

export function CartDrawer() {
  const { items, open, setOpen, remove, setQuantity, total } = useCart();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[440px] bg-background shadow-luxe flex flex-col animate-fade-up">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display text-2xl">Votre panier</h2>
          <button onClick={() => setOpen(false)} aria-label="Fermer"><X className="h-5 w-5" /></button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" strokeWidth={1} />
            <p className="mt-4 text-sm text-muted-foreground">Votre panier est vide.</p>
            <Link to="/boutique" onClick={() => setOpen(false)} className="mt-6 tracking-luxe text-xs border-b border-foreground pb-1">
              Découvrir la boutique
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {items.map((i) => {
                const k = cartItemKey(i);
                return (
                  <li key={k} className="flex gap-4">
                    <img src={i.image} alt={i.name} className="w-20 h-24 object-cover bg-secondary" />
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between gap-2">
                        <h3 className="font-display text-base leading-tight">{i.name}</h3>
                        <button onClick={() => remove(k)} aria-label="Retirer"><X className="h-4 w-4 text-muted-foreground hover:text-foreground" /></button>
                      </div>
                      <p className="text-[11px] tracking-luxe text-muted-foreground mt-0.5">
                        {[i.size, i.color].filter(Boolean).join(" · ")}
                      </p>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center border border-border">
                          <button className="p-1.5" onClick={() => setQuantity(k, i.quantity - 1)}><Minus className="h-3 w-3" /></button>
                          <span className="text-xs w-6 text-center">{i.quantity}</span>
                          <button className="p-1.5" onClick={() => setQuantity(k, i.quantity + 1)}><Plus className="h-3 w-3" /></button>
                        </div>
                        <span className="text-sm font-medium">{formatPrice(i.price * i.quantity)}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-border p-5 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="font-medium">{formatPrice(total)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Livraison calculée à la commande.</p>
              <Link
                to="/panier"
                onClick={() => setOpen(false)}
                className="block w-full bg-foreground text-background text-center py-3.5 tracking-luxe text-xs hover:bg-foreground/90 transition-colors"
              >
                Commander via WhatsApp
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
