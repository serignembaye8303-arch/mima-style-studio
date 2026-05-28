import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchOrder } from "@/lib/admin-api";
import { formatPrice } from "@/lib/format";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/admin/orders/$id")({ component: OrderDetail });

function OrderDetail() {
  const { id } = Route.useParams();
  const { data } = useQuery({ queryKey: ["admin-order", id], queryFn: () => fetchOrder(id) });
  const o = data?.order;
  const items = data?.items ?? [];

  if (!o) return <div className="text-muted-foreground">Chargement…</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link to="/admin/orders" className="inline-flex items-center gap-1 text-xs tracking-luxe text-muted-foreground"><ChevronLeft className="h-3 w-3" /> Toutes les commandes</Link>
      <header>
        <h1 className="font-display text-3xl">Commande #{o.id.slice(0, 8)}</h1>
        <p className="text-xs text-muted-foreground mt-1">{new Date(o.created_at).toLocaleString("fr-FR")}</p>
      </header>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-background border rounded-lg p-5 space-y-2 text-sm">
          <p className="text-xs tracking-luxe uppercase text-muted-foreground">Client</p>
          <p className="font-medium">{o.customer_name}</p>
          <p>{o.customer_phone}</p>
          {o.customer_address && <p className="text-muted-foreground">{o.customer_address}{o.customer_city ? `, ${o.customer_city}` : ""}</p>}
        </div>
        <div className="bg-background border rounded-lg p-5 space-y-2 text-sm">
          <p className="text-xs tracking-luxe uppercase text-muted-foreground">Récapitulatif</p>
          <p>Statut : <span className="font-medium">{o.status}</span></p>
          <p>Total : <span className="font-mono font-semibold">{formatPrice(o.total)}</span></p>
          {o.whatsapp_sent_at && <p className="text-xs text-green-700">WhatsApp envoyé le {new Date(o.whatsapp_sent_at).toLocaleString("fr-FR")}</p>}
        </div>
      </div>

      <div className="bg-background border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-luxe text-muted-foreground">
            <tr><th className="text-left px-4 py-3">Produit</th><th className="text-center px-4 py-3">Variante</th><th className="text-right px-4 py-3">Qté</th><th className="text-right px-4 py-3">Prix</th></tr>
          </thead>
          <tbody className="divide-y">
            {items.map((i) => (
              <tr key={i.id}>
                <td className="px-4 py-3 flex items-center gap-3">
                  {i.product_image && <img src={i.product_image} alt="" className="w-10 h-10 object-cover rounded" />}
                  {i.product_name}
                </td>
                <td className="px-4 py-3 text-center text-xs text-muted-foreground">{[i.size, i.color].filter(Boolean).join(" · ") || "—"}</td>
                <td className="px-4 py-3 text-right">{i.quantity}</td>
                <td className="px-4 py-3 text-right font-mono">{formatPrice(i.price * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {o.notes && <div className="bg-background border rounded-lg p-5 text-sm"><p className="text-xs tracking-luxe uppercase text-muted-foreground mb-2">Notes</p>{o.notes}</div>}
    </div>
  );
}
