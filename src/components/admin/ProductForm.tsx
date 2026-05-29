import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { upsertProduct } from "@/lib/admin-api";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Upload, X, Loader2 } from "lucide-react";

const CATEGORIES = ["robes", "ensembles", "chaussures", "sacs", "accessoires"];

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export interface ProductFormValues {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  sale_price?: number | null;
  category?: string;
  sizes?: string[];
  colors?: string[];
  images?: string[];
  video_url?: string | null;
  stock?: number;
  is_new?: boolean;
  is_featured?: boolean;
}

export function ProductForm({ initial }: { initial?: ProductFormValues }) {
  const nav = useNavigate();
  const [f, setF] = useState<ProductFormValues>(initial ?? { category: "robes", price: 0, stock: 0, images: [], sizes: [], colors: [], is_new: true });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  function set<K extends keyof ProductFormValues>(k: K, v: ProductFormValues[K]) {
    setF((p) => ({ ...p, [k]: v }));
  }

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error } = await supabase.storage.from("products").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("products").getPublicUrl(path);
      return data.publicUrl;
    } finally {
      setUploading(false);
    }
  }

  async function handleImages(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      try {
        const url = await uploadFile(file);
        set("images", [...(f.images ?? []), url]);
      } catch (e: any) {
        toast.error(e.message);
      }
    }
  }

  async function handleVideo(file: File | null) {
    if (!file) return;
    try { set("video_url", await uploadFile(file)); } catch (e: any) { toast.error(e.message); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name || !f.price) { toast.error("Nom et prix requis"); return; }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...f,
        slug: f.slug?.trim() || slugify(f.name),
        sale_price: f.sale_price || null,
      };
      await upsertProduct(payload);
      toast.success(initial?.id ? "Produit mis à jour" : "Produit créé");
      nav({ to: "/admin/products" });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Field label="Nom" required><input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} className={inp} /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Slug (URL)"><input value={f.slug ?? ""} onChange={(e) => set("slug", e.target.value)} placeholder="auto-généré" className={inp} /></Field>
          <Field label="Catégorie">
            <select value={f.category} onChange={(e) => set("category", e.target.value)} className={inp}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Description"><textarea value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} rows={4} className={inp} /></Field>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Prix (XOF)" required><input type="number" value={f.price ?? 0} onChange={(e) => set("price", Number(e.target.value))} className={inp} /></Field>
          <Field label="Promo (XOF)"><input type="number" value={f.sale_price ?? ""} onChange={(e) => set("sale_price", e.target.value ? Number(e.target.value) : null)} className={inp} /></Field>
          <Field label="Stock"><input type="number" value={f.stock ?? 0} onChange={(e) => set("stock", Number(e.target.value))} className={inp} /></Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Tailles (séparées par virgules)"><input value={(f.sizes ?? []).join(", ")} onChange={(e) => set("sizes", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className={inp} placeholder="XS, S, M, L" /></Field>
          <Field label="Couleurs"><input value={(f.colors ?? []).join(", ")} onChange={(e) => set("colors", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className={inp} placeholder="Noir, Rose, Doré" /></Field>
        </div>
        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!f.is_new} onChange={(e) => set("is_new", e.target.checked)} /> Nouveauté</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!f.is_featured} onChange={(e) => set("is_featured", e.target.checked)} /> En vedette</label>
        </div>
      </div>

      <aside className="space-y-6">
        <div className="bg-background border rounded-lg p-5 space-y-3">
          <p className="text-xs tracking-luxe text-muted-foreground uppercase">Images</p>
          <div className="grid grid-cols-3 gap-2">
            {(f.images ?? []).map((url, i) => (
              <div key={url} className="relative aspect-square group">
                <img src={url} alt="" className="w-full h-full object-cover rounded" />
                <button type="button" onClick={() => set("images", (f.images ?? []).filter((_, j) => j !== i))} className="absolute -top-2 -right-2 bg-foreground text-background rounded-full p-1"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded p-4 text-xs text-muted-foreground cursor-pointer hover:bg-secondary/30">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Envoi…" : "Téléverser des images"}
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImages(e.target.files)} />
          </label>
        </div>

        <div className="bg-background border rounded-lg p-5 space-y-3">
          <p className="text-xs tracking-luxe text-muted-foreground uppercase">Vidéo produit (optionnel)</p>
          {f.video_url && (
            <div className="relative">
              <video src={f.video_url} controls className="w-full rounded" />
              <button type="button" onClick={() => set("video_url", null)} className="absolute top-2 right-2 bg-foreground text-background rounded-full p-1"><X className="h-3 w-3" /></button>
            </div>
          )}
          <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded p-3 text-xs text-muted-foreground cursor-pointer hover:bg-secondary/30">
            <Upload className="h-4 w-4" /> Téléverser une vidéo
            <input type="file" accept="video/*" className="hidden" onChange={(e) => handleVideo(e.target.files?.[0] ?? null)} />
          </label>
        </div>

        <button type="button" onClick={() => setPreview(true)} className="w-full border border-foreground px-6 py-3 text-xs tracking-luxe hover:bg-secondary">
          Aperçu avant publication
        </button>
        <button type="submit" disabled={saving} className="w-full bg-foreground text-background px-6 py-3 text-xs tracking-luxe disabled:opacity-50">
          {saving ? "Enregistrement…" : initial?.id ? "Mettre à jour" : "Créer le produit"}
        </button>
      </aside>

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPreview(false)}>
          <div className="bg-background rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-display text-xl">Aperçu produit</h3>
              <button type="button" onClick={() => setPreview(false)} className="p-1 hover:bg-secondary rounded"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid md:grid-cols-2 gap-6 p-6">
              <div className="space-y-2">
                {f.images?.[0] ? <img src={f.images[0]} alt={f.name} className="w-full aspect-[3/4] object-cover rounded" /> : <div className="aspect-[3/4] bg-secondary rounded flex items-center justify-center text-muted-foreground text-xs">Aucune image</div>}
                <div className="grid grid-cols-4 gap-2">{f.images?.slice(1, 5).map((u) => <img key={u} src={u} className="aspect-square object-cover rounded" />)}</div>
              </div>
              <div className="space-y-3">
                <div className="flex gap-1">
                  {f.is_new && <span className="bg-foreground text-background text-[10px] tracking-luxe px-2 py-1 rounded">Nouveau</span>}
                  {f.sale_price && <span className="bg-gold text-background text-[10px] tracking-luxe px-2 py-1 rounded">Promo</span>}
                </div>
                <p className="tracking-luxe text-[10px] text-gold uppercase">{f.category}</p>
                <h2 className="font-display text-3xl">{f.name || "Nom du produit"}</h2>
                <div className="flex items-baseline gap-2">
                  {f.sale_price ? <>
                    <span className="text-2xl font-mono text-gold">{f.sale_price.toLocaleString()} XOF</span>
                    <span className="text-sm line-through text-muted-foreground">{f.price?.toLocaleString()} XOF</span>
                  </> : <span className="text-2xl font-mono">{f.price?.toLocaleString() ?? 0} XOF</span>}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{f.description || "Aucune description."}</p>
                {f.sizes?.length ? <div className="text-xs"><span className="text-muted-foreground">Tailles : </span>{f.sizes.join(" · ")}</div> : null}
                {f.colors?.length ? <div className="text-xs"><span className="text-muted-foreground">Couleurs : </span>{f.colors.join(" · ")}</div> : null}
                <p className="text-xs text-muted-foreground">Stock : {f.stock ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

const inp = "w-full border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground rounded";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs tracking-luxe text-muted-foreground uppercase">{label}{required && <span className="text-destructive"> *</span>}</span>
      {children}
    </label>
  );
}
