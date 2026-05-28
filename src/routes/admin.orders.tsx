import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOrders, updateOrderStatus, type Order } from "@/lib/admin-api";
import { formatPrice } from "@/lib/format";
import { useState } from "react";
import { toast } from "sonner";

const STATUSES: { value: Order["status"]; label: string; color: string }[] = [
  { value: "pending", label: "En attente", color: "bg-amber-100 text-amber-800" },
  { value: "confirmed", label: "Confirmée", color: "bg-blue-100 text-blue-800" },
  { value: "shipped", label: "Expédiée", color: "bg-purple-100 text-purple-800" },
  { value: "delivered", label: "Livrée", color: "bg-green-100 text-green-800" },
  { value: "cancelled", label: "Annulée", color: "bg-red-100 text-red-800" },
];

export const Route = createFileRoute("/admin/orders")({ component: OrdersAdmin });

function OrdersAdmin() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Order["status"] | "all">("all");
  const { data } = useQuery({ queryKey: ["admin-orders", filter], queryFn: () => fetchOrders(filter === "all" ? undefined : { status: filter }) });

  async function changeStatus(id: string, s: Order["status"]) {
    try {
      await updateOrderStatus(id, s);
      toast.success("Statut mis à jour");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="tracking-luxe text-[10px] text-gold">Commandes</p>
        <h1 className="font-display text-3xl mt-1">Toutes les commandes</h1>
      </header>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")} className={chip(filter === "all")}>Toutes</button>
        {STATUSES.map((s) => <button key={s.value} onClick={() => setFilter(s.value)} className={chip(filter === s.value)}>{s.label}</button>)}
      </div>

      <div className="bg-background border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs tracking-luxe uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">Téléphone</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(data ?? []).map((o) => (
                <tr key={o.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("fr-FR")}</td>
                  <td className="px-4 py-3 font-medium">{o.customer_name}</td>
                  <td className="px-4 py-3">{o.customer_phone}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatPrice(o.total)}</td>
                  <td className="px-4 py-3">
                    <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value as Order["status"])} className="text-xs border rounded px-2 py-1 bg-background">
                      {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to="/admin/orders/$id" params={{ id: o.id }} className="text-xs tracking-luxe border-b border-foreground">Détails</Link>
                  </td>
                </tr>
              ))}
              {!data?.length && <tr><td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">Aucune commande.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const chip = (a: boolean) => `px-3 py-1.5 text-xs tracking-luxe rounded-full border ${a ? "bg-foreground text-background border-foreground" : "bg-background hover:bg-secondary"}`;
