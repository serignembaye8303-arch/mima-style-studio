import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/products";
import { deleteProduct } from "@/lib/admin-api";
import { formatPrice } from "@/lib/format";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/products")({ component: ProductsAdmin });

function ProductsAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data } = useQuery({ queryKey: ["admin-products"], queryFn: () => fetchProducts() });

  const filtered = (data ?? []).filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Supprimer « ${name} » ?`)) return;
    try {
      await deleteProduct(id);
      toast.success("Produit supprimé");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="tracking-luxe text-[10px] text-gold">Catalogue</p>
          <h1 className="font-display text-3xl mt-1">Produits ({data?.length ?? 0})</h1>
        </div>
        <Link to="/admin/products/new" className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-xs tracking-luxe hover:bg-foreground/90">
          <Plus className="h-4 w-4" /> Nouveau produit
        </Link>
      </header>

      <div className="bg-background border rounded-lg p-3 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un produit…" className="flex-1 bg-transparent text-sm focus:outline-none" />
      </div>

      <div className="bg-background border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs tracking-luxe text-muted-foreground uppercase">
              <tr>
                <th className="text-left px-4 py-3">Produit</th>
                <th className="text-left px-4 py-3">Catégorie</th>
                <th className="text-right px-4 py-3">Prix</th>
                <th className="text-right px-4 py-3">Stock</th>
                <th className="text-center px-4 py-3">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0]} alt={p.name} className="w-12 h-12 object-cover rounded" />
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize">{p.category}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {p.sale_price ? (
                      <><span className="text-gold">{formatPrice(p.sale_price)}</span><br /><span className="text-xs line-through text-muted-foreground">{formatPrice(p.price)}</span></>
                    ) : formatPrice(p.price)}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono ${p.stock <= 3 ? "text-amber-600" : ""}`}>{p.stock}</td>
                  <td className="px-4 py-3 text-center">
                    {p.is_new && <span className="inline-block bg-foreground text-background text-[10px] tracking-luxe px-2 py-0.5 rounded mr-1">Nouveau</span>}
                    {p.sale_price && <span className="inline-block bg-gold text-background text-[10px] tracking-luxe px-2 py-0.5 rounded">Promo</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link to="/admin/products/$id" params={{ id: p.id }} className="p-2 hover:bg-secondary rounded"><Pencil className="h-4 w-4" /></Link>
                      <button onClick={() => handleDelete(p.id, p.name)} className="p-2 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">Aucun produit trouvé.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
