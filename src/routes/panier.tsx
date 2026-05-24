import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCart, cartItemKey } from "@/lib/cart-context";
import { SiteLayout } from "@/components/SiteLayout";
import { formatPrice } from "@/lib/format";
import { fetchWhatsAppNumber } from "@/lib/products";
import { Minus, Plus, X } from "lucide-react";

export const Route = createFileRoute("/panier")({ component: Panier });

function Panier() {
  const { items, remove, setQuantity, total, clear } = useCart();
  const { data: whatsapp = "+221770000000" } = useQuery({ queryKey: ["whatsapp"], queryFn: fetchWhatsAppNumber });

  const orderViaWhatsApp = () => {
    const lines = items.map((i) => `• ${i.name}${i.size ? ` (${i.size})` : ""}${i.color ? ` — ${i.color}` : ""} × ${i.quantity} = ${formatPrice(i.price * i.quantity)}`).join("\n");
    const msg = `Bonjour Mima Boutique 🌸\n\nJe souhaite commander :\n${lines}\n\nTotal : ${formatPrice(total)}\n\nMerci !`;
    const num = whatsapp.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <SiteLayout>
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="font-display text-5xl text-center">Votre panier</h1>
        {items.length === 0 ? (
          <div className="text-center mt-12">
            <p className="text-muted-foreground">Votre panier est vide.</p>
            <Link to="/boutique" className="mt-6 inline-block tracking-luxe text-xs border-b border-foreground pb-1">Découvrir la boutique</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr,360px] gap-12 mt-12">
            <ul className="space-y-6">
              {items.map((i) => {
                const k = cartItemKey(i);
                return (
                  <li key={k} className="flex gap-5 pb-6 border-b border-border">
                    <img src={i.image} alt={i.name} className="w-24 h-32 object-cover bg-secondary" />
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between">
                        <h3 className="font-display text-xl">{i.name}</h3>
                        <button onClick={() => remove(k)}><X className="h-4 w-4 text-muted-foreground hover:text-foreground" /></button>
                      </div>
                      <p className="text-[11px] tracking-luxe text-muted-foreground mt-1">{[i.size, i.color].filter(Boolean).join(" · ")}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center border border-border">
                          <button className="p-2" onClick={() => setQuantity(k, i.quantity - 1)}><Minus className="h-3 w-3" /></button>
                          <span className="text-xs w-8 text-center">{i.quantity}</span>
                          <button className="p-2" onClick={() => setQuantity(k, i.quantity + 1)}><Plus className="h-3 w-3" /></button>
                        </div>
                        <span className="font-medium">{formatPrice(i.price * i.quantity)}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <aside className="bg-secondary/50 p-6 h-fit">
              <h2 className="font-display text-2xl">Récapitulatif</h2>
              <div className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span>{formatPrice(total)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Livraison</span><span className="text-xs text-muted-foreground">Calculée à la commande</span></div>
              </div>
              <div className="border-t border-border mt-4 pt-4 flex justify-between font-display text-lg">
                <span>Total</span><span>{formatPrice(total)}</span>
              </div>
              <button onClick={orderViaWhatsApp} className="mt-6 w-full bg-foreground text-background py-4 tracking-luxe text-xs hover:bg-foreground/90">
                Commander via WhatsApp
              </button>
              <button onClick={clear} className="mt-3 w-full text-[11px] tracking-luxe text-muted-foreground hover:text-foreground">Vider le panier</button>
              <p className="mt-4 text-[11px] text-muted-foreground text-center">Vous recevrez confirmation et lien de paiement par WhatsApp.</p>
            </aside>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
