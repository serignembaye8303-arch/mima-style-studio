import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPromotions, upsertPromotion, deletePromotion } from "@/lib/admin-api";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";

export const Route = createFileRoute("/admin/promotions")({ component: PromosAdmin });

function PromosAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["promos"], queryFn: fetchPromotions });
  const [editing, setEditing] = useState<any | null>(null);

  async function save(p: any) {
    try {
      await upsertPromotion(p);
      toast.success("Enregistré");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["promos"] });
    } catch (e: any) { toast.error(e.message); }
  }

  async function del(id: string) {
    if (!confirm("Supprimer cette promotion ?")) return;
    await deletePromotion(id);
    toast.success("Supprimé");
    qc.invalidateQueries({ queryKey: ["promos"] });
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <p className="tracking-luxe text-[10px] text-gold">Marketing</p>
          <h1 className="font-display text-3xl mt-1">Promotions & bannières</h1>
        </div>
        <button onClick={() => setEditing({ type: "banner", is_active: true })} className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-xs tracking-luxe"><Plus className="h-4 w-4" /> Nouvelle promo</button>
      </header>

      {editing && <PromoForm value={editing} onSave={save} onCancel={() => setEditing(null)} />}

      <div className="grid md:grid-cols-2 gap-4">
        {(data ?? []).map((p: any) => (
          <div key={p.id} className="bg-background border rounded-lg overflow-hidden group">
            {p.image_url && <img src={p.image_url} alt={p.title} className="w-full h-40 object-cover" />}
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] tracking-luxe uppercase text-muted-foreground">{p.type}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded ${p.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>{p.is_active ? "Active" : "Inactive"}</span>
              </div>
              <h3 className="font-display text-xl">{p.title}</h3>
              {p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}
              {p.code && <p className="mt-2 text-xs">Code : <span className="font-mono bg-secondary px-2 py-0.5 rounded">{p.code}</span> {p.discount_percent && `(-${p.discount_percent}%)`}</p>}
              <div className="mt-3 flex gap-2">
                <button onClick={() => setEditing(p)} className="text-xs tracking-luxe inline-flex items-center gap-1 border-b border-foreground"><Pencil className="h-3 w-3" /> Modifier</button>
                <button onClick={() => del(p.id)} className="text-xs tracking-luxe inline-flex items-center gap-1 text-destructive ml-auto"><Trash2 className="h-3 w-3" /> Supprimer</button>
              </div>
            </div>
          </div>
        ))}
        {!data?.length && !editing && <p className="text-muted-foreground text-sm col-span-2 text-center py-12">Aucune promotion. Créez la première !</p>}
      </div>
    </div>
  );
}

function PromoForm({ value, onSave, onCancel }: { value: any; onSave: (p: any) => void; onCancel: () => void }) {
  const [f, setF] = useState(value);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(f); }} className="bg-background border rounded-lg p-6 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Titre"><input required value={f.title ?? ""} onChange={(e) => setF({ ...f, title: e.target.value })} className={inp} /></Field>
        <Field label="Type">
          <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className={inp}>
            <option value="banner">Bannière</option>
            <option value="popup">Popup</option>
            <option value="announcement">Annonce</option>
          </select>
        </Field>
      </div>
      <Field label="Description"><textarea value={f.description ?? ""} onChange={(e) => setF({ ...f, description: e.target.value })} className={inp} rows={2} /></Field>
      <Field label="Image (URL)"><input value={f.image_url ?? ""} onChange={(e) => setF({ ...f, image_url: e.target.value })} className={inp} placeholder="https://…" /></Field>
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Lien"><input value={f.link_url ?? ""} onChange={(e) => setF({ ...f, link_url: e.target.value })} className={inp} placeholder="/boutique" /></Field>
        <Field label="Code promo"><input value={f.code ?? ""} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} className={inp} placeholder="MIMA10" /></Field>
        <Field label="% remise"><input type="number" value={f.discount_percent ?? ""} onChange={(e) => setF({ ...f, discount_percent: e.target.value ? Number(e.target.value) : null })} className={inp} /></Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Début"><input type="datetime-local" value={f.starts_at?.slice(0, 16) ?? ""} onChange={(e) => setF({ ...f, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })} className={inp} /></Field>
        <Field label="Fin"><input type="datetime-local" value={f.ends_at?.slice(0, 16) ?? ""} onChange={(e) => setF({ ...f, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} className={inp} /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} /> Active</label>
      <div className="flex gap-3">
        <button type="submit" className="bg-foreground text-background px-6 py-2.5 text-xs tracking-luxe">Enregistrer</button>
        <button type="button" onClick={onCancel} className="border border-foreground px-6 py-2.5 text-xs tracking-luxe">Annuler</button>
      </div>
    </form>
  );
}

const inp = "w-full border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground rounded";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1"><span className="text-xs tracking-luxe uppercase text-muted-foreground">{label}</span>{children}</label>;
}
