import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/products";
import { addStockMovement, fetchStockMovements } from "@/lib/admin-api";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/stock")({ component: StockAdmin });

function StockAdmin() {
  const qc = useQueryClient();
  const { data: products } = useQuery({ queryKey: ["admin-products"], queryFn: () => fetchProducts() });
  const { data: moves } = useQuery({ queryKey: ["stock-moves"], queryFn: () => fetchStockMovements() });
  const [adj, setAdj] = useState<Record<string, { delta: number; reason: string }>>({});

  async function apply(id: string) {
    const a = adj[id];
    if (!a?.delta) return;
    try {
      await addStockMovement({ product_id: id, delta: Number(a.delta), reason: a.reason || "manual" });
      toast.success("Stock mis à jour");
      setAdj((p) => ({ ...p, [id]: { delta: 0, reason: "" } }));
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["stock-moves"] });
    } catch (e: any) { toast.error(e.message); }
  }

  function statusBadge(s: number) {
    if (s === 0) return <span className="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded">Rupture</span>;
    if (s <= 3) return <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded">Faible</span>;
    return <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded">En stock</span>;
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="tracking-luxe text-[10px] text-gold">Stock</p>
        <h1 className="font-display text-3xl mt-1">Gestion des stocks</h1>
        <p className="text-sm text-muted-foreground mt-2">Ajustez et tracez chaque mouvement (réapprovisionnement, vente, retour, casse…).</p>
      </header>

      <div className="bg-background border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-luxe text-muted-foreground">
              <tr><th className="text-left px-4 py-3">Produit</th><th className="text-right px-4 py-3">Stock</th><th className="text-center px-4 py-3">Statut</th><th className="px-4 py-3">Ajustement</th></tr>
            </thead>
            <tbody className="divide-y">
              {(products ?? []).map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 flex items-center gap-3">
                    <img src={p.images?.[0]} alt={p.name} className="w-10 h-10 object-cover rounded" /> {p.name}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{p.stock}</td>
                  <td className="px-4 py-3 text-center">{statusBadge(p.stock)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <input type="number" placeholder="+/-" value={adj[p.id]?.delta ?? ""} onChange={(e) => setAdj((x) => ({ ...x, [p.id]: { ...x[p.id], delta: Number(e.target.value) } }))} className="w-20 border rounded px-2 py-1 text-sm" />
                      <select value={adj[p.id]?.reason ?? ""} onChange={(e) => setAdj((x) => ({ ...x, [p.id]: { ...x[p.id], reason: e.target.value } }))} className="border rounded px-2 py-1 text-sm">
                        <option value="">Raison…</option>
                        <option value="restock">Réapprovisionnement</option>
                        <option value="sale">Vente</option>
                        <option value="return">Retour</option>
                        <option value="loss">Perte/Casse</option>
                        <option value="adjustment">Ajustement</option>
                      </select>
                      <button onClick={() => apply(p.id)} className="bg-foreground text-background px-3 py-1 text-xs tracking-luxe rounded">OK</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-background border rounded-lg p-6">
        <h2 className="font-display text-xl mb-4">Historique des mouvements</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {(moves ?? []).map((m: any) => (
            <div key={m.id} className="flex justify-between items-center text-sm py-2 border-b last:border-0">
              <div>
                <span className="font-medium">{m.products?.name ?? "Produit supprimé"}</span>
                <span className="ml-2 text-xs text-muted-foreground">{m.reason}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-mono ${m.delta > 0 ? "text-green-700" : "text-red-700"}`}>{m.delta > 0 ? "+" : ""}{m.delta}</span>
                <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("fr-FR")}</span>
              </div>
            </div>
          ))}
          {!moves?.length && <p className="text-muted-foreground text-sm text-center py-8">Aucun mouvement enregistré.</p>}
        </div>
      </div>
    </div>
  );
}
