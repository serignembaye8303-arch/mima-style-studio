import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/SiteLayout";
import { fetchOrder } from "@/lib/admin-api";
import { setOrderPayment, markWhatsAppSent, type PaymentMethod } from "@/lib/admin-api";
import { fetchSettings } from "@/lib/admin-api";
import { fetchWhatsAppNumber } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, Copy, ExternalLink, Loader2, XCircle } from "lucide-react";

export const Route = createFileRoute("/paiement/$id")({
  head: () => ({ meta: [{ title: "Paiement — Mima Boutique" }, { name: "robots", content: "noindex" }] }),
  component: PaymentPage,
});

type Method = { id: PaymentMethod; label: string; emoji: string; type: "phone" | "link" | "cod" };

function PaymentPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: orderData, refetch } = useQuery({ queryKey: ["order-public", id], queryFn: () => fetchOrder(id), refetchInterval: 8000 });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const { data: whatsapp = "+221770000000" } = useQuery({ queryKey: ["whatsapp"], queryFn: fetchWhatsAppNumber });

  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const order = orderData?.order;
  const items = orderData?.items ?? [];

  if (!orderData) {
    return (
      <SiteLayout>
        <div className="min-h-[50vh] grid place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </SiteLayout>
    );
  }

  if (!order) {
    return (
      <SiteLayout>
        <div className="max-w-xl mx-auto px-6 py-20 text-center space-y-4">
          <h1 className="font-display text-3xl">Commande introuvable</h1>
          <p className="text-sm text-muted-foreground">Ce lien de paiement est invalide ou expiré.</p>
          <Link to="/boutique" className="inline-block tracking-luxe text-xs border-b border-foreground pb-1">Retour boutique</Link>
        </div>
      </SiteLayout>
    );
  }

  // Already paid / locked states
  if (order.payment_status === "paid") return <StatusScreen kind="success" order={order} whatsapp={whatsapp} />;
  if (order.payment_status === "failed") return <StatusScreen kind="failed" order={order} whatsapp={whatsapp} />;
  if (order.payment_status === "pending_verification") return <StatusScreen kind="pending" order={order} whatsapp={whatsapp} />;

  const methods: Method[] = [
    { id: "wave", label: "Wave", emoji: "🌊", type: "phone" },
    { id: "orange_money", label: "Orange Money", emoji: "🟠", type: "phone" },
    { id: "card", label: "Carte bancaire", emoji: "💳", type: "link" },
    { id: "paypal", label: "PayPal", emoji: "🅿️", type: "link" },
    { id: "cash_on_delivery", label: "Paiement à la livraison", emoji: "📦", type: "cod" },
  ];

  const methodInfo = (m: PaymentMethod): { instruction: string; link?: string; phone?: string } => {
    switch (m) {
      case "wave":
        return { instruction: `Envoyez ${formatPrice(order.total)} via Wave au numéro ci-dessous, puis renseignez l'ID de transaction.`, phone: settings?.wave_number || whatsapp };
      case "orange_money":
        return { instruction: `Envoyez ${formatPrice(order.total)} via Orange Money au numéro ci-dessous, puis renseignez l'ID de transaction.`, phone: settings?.orange_money_number || whatsapp };
      case "card":
        return { instruction: "Cliquez sur le bouton ci-dessous pour payer par carte bancaire de façon sécurisée.", link: settings?.card_payment_link };
      case "paypal":
        return { instruction: "Cliquez sur le bouton ci-dessous pour payer via PayPal.", link: settings?.paypal_link };
      case "cash_on_delivery":
        return { instruction: "Réglez en espèces au livreur lors de la réception. Vous recevrez une confirmation par WhatsApp avant l'expédition." };
    }
  };

  async function confirm() {
    if (!selected) return;
    setSubmitting(true);
    try {
      await setOrderPayment(order!.id, selected, reference.trim() || undefined);
      // Notify shop via WhatsApp
      const info = methodInfo(selected);
      const lines = items.map((i) => `• ${i.product_name}${i.size ? ` (${i.size})` : ""}${i.color ? ` — ${i.color}` : ""} × ${i.quantity}`).join("\n");
      const msg = `Bonjour Mima Boutique 🌸\n\nCommande #${order!.id.slice(0, 8)}\n${order!.customer_name} · ${order!.customer_phone}\nMontant : ${formatPrice(order!.total)}\nPaiement : ${selected.toUpperCase()}${reference.trim() ? ` — Réf : ${reference.trim()}` : ""}\n\n${lines}\n\nMerci de confirmer la réception du paiement.`;
      await markWhatsAppSent(order!.id);
      const num = whatsapp.replace(/[^0-9]/g, "");
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
      toast.success("Paiement signalé. Nous vérifions et confirmons sous peu.");
      void info;
      await refetch();
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  const info = selected ? methodInfo(selected) : null;
  const selectedMeta = methods.find((m) => m.id === selected);
  const canSubmit = !!selected && (selectedMeta?.type !== "phone" || reference.trim().length >= 3);

  return (
    <SiteLayout>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <p className="tracking-luxe text-[10px] text-gold text-center">Étape finale</p>
        <h1 className="font-display text-4xl md:text-5xl text-center mt-2">Paiement</h1>
        <p className="text-sm text-muted-foreground text-center mt-2">Commande #{order.id.slice(0, 8)} · {formatPrice(order.total)}</p>

        <div className="grid lg:grid-cols-[1fr,360px] gap-10 mt-10">
          <div>
            <h2 className="font-display text-xl mb-4">Choisissez votre moyen de paiement</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {methods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setSelected(m.id); setReference(""); }}
                  className={`text-left p-4 border rounded-lg transition ${selected === m.id ? "border-foreground bg-secondary/30" : "border-border hover:border-foreground/50"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="font-medium">{m.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {selected && info && (
              <div className="mt-6 bg-secondary/30 border rounded-lg p-5 space-y-4">
                <p className="text-sm">{info.instruction}</p>

                {info.phone && (
                  <div className="flex items-center justify-between bg-background border rounded px-4 py-3">
                    <div>
                      <p className="text-[10px] tracking-luxe uppercase text-muted-foreground">Numéro {selectedMeta?.label}</p>
                      <p className="font-mono text-lg">{info.phone}</p>
                    </div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(info.phone!); toast.success("Numéro copié"); }}
                      className="p-2 hover:bg-secondary rounded"
                      aria-label="Copier"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {info.link && (
                  <a href={info.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-3 tracking-luxe text-xs">
                    Ouvrir la page de paiement <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {!info.link && selectedMeta?.type === "link" && (
                  <p className="text-xs text-amber-700">⚠️ Ce mode n'est pas encore configuré par la boutique. Choisissez un autre moyen ou contactez-nous sur WhatsApp.</p>
                )}

                {selectedMeta?.type === "phone" && (
                  <div>
                    <label className="text-[10px] tracking-luxe uppercase text-muted-foreground">ID de transaction *</label>
                    <input
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="Ex: TF24XXXXXXX"
                      maxLength={60}
                      className="w-full mt-1 bg-background border px-3 py-2.5 text-sm focus:outline-none focus:border-foreground"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">L'ID est visible dans la confirmation Wave/Orange Money.</p>
                  </div>
                )}

                <button
                  onClick={confirm}
                  disabled={!canSubmit || submitting}
                  className="w-full bg-foreground text-background py-4 tracking-luxe text-xs hover:bg-foreground/90 disabled:opacity-50"
                >
                  {submitting ? "Envoi…" : selectedMeta?.type === "cod" ? "Confirmer la commande" : "J'ai effectué le paiement"}
                </button>
              </div>
            )}
          </div>

          <aside className="bg-secondary/50 p-6 h-fit">
            <h2 className="font-display text-xl">Récapitulatif</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <span className="flex-1 min-w-0">
                    {i.product_name}
                    <span className="block text-[11px] text-muted-foreground">× {i.quantity}</span>
                  </span>
                  <span className="font-mono shrink-0">{formatPrice(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-border mt-4 pt-4 flex justify-between font-display text-lg">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
            <div className="mt-6 text-[11px] text-muted-foreground space-y-1">
              <p><strong>{order.customer_name}</strong></p>
              <p>{order.customer_phone}</p>
              {order.customer_address && <p>{order.customer_address}{order.customer_city ? `, ${order.customer_city}` : ""}</p>}
            </div>
            <button onClick={() => navigate({ to: "/boutique" })} className="mt-6 w-full text-[11px] tracking-luxe text-muted-foreground hover:text-foreground">
              ← Continuer mes achats
            </button>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}

function StatusScreen({ kind, order, whatsapp }: { kind: "success" | "pending" | "failed"; order: any; whatsapp: string }) {
  const config = {
    success: { icon: CheckCircle2, color: "text-green-600", title: "Paiement confirmé", desc: "Votre commande est en cours de préparation. Merci !" },
    pending: { icon: Clock, color: "text-amber-600", title: "Paiement en vérification", desc: "Nous avons bien reçu votre signalement. La boutique confirme sous quelques minutes." },
    failed: { icon: XCircle, color: "text-red-600", title: "Paiement échoué", desc: "Votre paiement n'a pas pu être validé. Contactez-nous pour réessayer." },
  }[kind];
  const Icon = config.icon;
  const num = whatsapp.replace(/[^0-9]/g, "");
  return (
    <SiteLayout>
      <div className="max-w-xl mx-auto px-6 py-20 text-center space-y-6">
        <Icon className={`h-16 w-16 mx-auto ${config.color}`} />
        <h1 className="font-display text-4xl">{config.title}</h1>
        <p className="text-sm text-muted-foreground">{config.desc}</p>
        <div className="bg-secondary/30 border rounded-lg p-5 text-sm text-left space-y-1">
          <p className="text-[10px] tracking-luxe uppercase text-muted-foreground">Commande</p>
          <p className="font-mono">#{order.id.slice(0, 8)}</p>
          <p className="mt-2">Statut commande : <span className="font-medium capitalize">{order.status}</span></p>
          <p>Statut paiement : <span className="font-medium">{order.payment_status}</span></p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href={`https://wa.me/${num}`} target="_blank" rel="noopener noreferrer" className="bg-foreground text-background px-6 py-3 tracking-luxe text-xs">Contacter la boutique</a>
          <Link to="/boutique" className="border border-foreground px-6 py-3 tracking-luxe text-xs">Retour boutique</Link>
        </div>
      </div>
    </SiteLayout>
  );
}
