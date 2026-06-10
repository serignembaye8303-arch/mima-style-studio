import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOrder, updatePaymentStatus, updateOrderStatus, type PaymentStatus, type Order } from "@/lib/admin-api";
import { formatPrice } from "@/lib/format";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders/$id")({ component: OrderDetail });

const PAY_STATUS: { v: PaymentStatus; label: string; color: string }[] = [
  { v: "unpaid", label: "Non payé", color: "bg-gray-100 text-gray-700" },
  { v: "pending_verification", label: "En vérification", color: "bg-amber-100 text-amber-800" },
  { v: "paid", label: "Payé", color: "bg-green-100 text-green-800" },
  { v: "failed", label: "Échoué", color: "bg-red-100 text-red-800" },
  { v: "refunded", label: "Remboursé", color: "bg-purple-100 text-purple-800" },
];

const ORDER_STATUSES: Order["status"][] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

function OrderDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-order", id], queryFn: () => fetchOrder(id) });
  const o = data?.order;
  const items = data?.items ?? [];

  async function setPay(s: PaymentStatus) {
    try {
      await updatePaymentStatus(id, s);
      // Auto-confirm order when payment validated
      if (s === "paid" && o?.status === "pending") await updateOrderStatus(id, "confirmed");
      toast.success("Statut paiement mis à jour");
      qc.invalidateQueries({ queryKey: ["admin-order", id] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (e: any) { toast.error(e.message); }
  }

  async function setStatus(s: Order["status"]) {
    try {
      await updateOrderStatus(id, s);
      toast.success("Statut commande mis à jour");
      qc.invalidateQueries({ queryKey: ["admin-order", id] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (e: any) { toast.error(e.message); }
  }

  if (!o) return <div className="text-muted-foreground">Chargement…</div>;

  const payMeta = PAY_STATUS.find((p) => p.v === o.payment_status);

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
        <div className="bg-background border rounded-lg p-5 space-y-3 text-sm">
          <p className="text-xs tracking-luxe uppercase text-muted-foreground">Récapitulatif</p>
          <p>Total : <span className="font-mono font-semibold">{formatPrice(o.total)}</span></p>
          <div>
            <label className="text-[10px] tracking-luxe uppercase text-muted-foreground block mb-1">Statut commande</label>
            <select value={o.status} onChange={(e) => setStatus(e.target.value as Order["status"])} className="text-xs border rounded px-2 py-1 bg-background w-full">
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-background border rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-display text-lg">Paiement</h2>
          <span className={`text-xs px-3 py-1 rounded-full ${payMeta?.color}`}>{payMeta?.label}</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[10px] tracking-luxe uppercase text-muted-foreground">Moyen</p>
            <p className="font-medium">{o.payment_method ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-luxe uppercase text-muted-foreground">Référence</p>
            <p className="font-mono text-xs break-all">{o.payment_reference ?? "—"}</p>
          </div>
          {o.paid_at && (
            <div className="sm:col-span-2">
              <p className="text-[10px] tracking-luxe uppercase text-muted-foreground">Validé le</p>
              <p className="text-xs">{new Date(o.paid_at).toLocaleString("fr-FR")}</p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {o.payment_status !== "paid" && (
            <button onClick={() => setPay("paid")} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-xs tracking-luxe rounded">✓ Marquer payé</button>
          )}
          {o.payment_status !== "failed" && o.payment_status !== "paid" && (
            <button onClick={() => setPay("failed")} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs tracking-luxe rounded">✗ Échec</button>
          )}
          {o.payment_status === "paid" && (
            <button onClick={() => setPay("refunded")} className="border border-purple-600 text-purple-600 px-4 py-2 text-xs tracking-luxe rounded">Rembourser</button>
          )}
          {o.payment_status !== "unpaid" && o.payment_status !== "paid" && (
            <button onClick={() => setPay("unpaid")} className="border px-4 py-2 text-xs tracking-luxe rounded">Réinitialiser</button>
          )}
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
