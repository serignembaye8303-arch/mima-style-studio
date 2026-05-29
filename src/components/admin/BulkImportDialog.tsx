import { useState } from "react";
import { Upload, X, FileSpreadsheet } from "lucide-react";
import { upsertProduct } from "@/lib/admin-api";
import { toast } from "sonner";

interface Props { open: boolean; onClose: () => void; onDone: () => void }

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  if (!lines.length) return [];
  const split = (l: string) => {
    const out: string[] = []; let cur = ""; let q = false;
    for (let i = 0; i < l.length; i++) {
      const c = l[i];
      if (c === '"') { if (q && l[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
      else if (c === "," && !q) { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur); return out;
  };
  const headers = split(lines[0]).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((l) => {
    const cells = split(l);
    const o: Record<string, string> = {};
    headers.forEach((h, i) => { o[h] = (cells[i] ?? "").trim(); });
    return o;
  });
}

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function BulkImportDialog({ open, onClose, onDone }: Props) {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!open) return null;

  const onFile = async (f: File) => {
    const text = await f.text();
    setRows(parseCSV(text));
  };

  const handleImport = async () => {
    setLoading(true); setProgress(0);
    let ok = 0, fail = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        await upsertProduct({
          name: r.name || r.nom,
          slug: r.slug || slugify(r.name || r.nom || `produit-${Date.now()}-${i}`),
          description: r.description || null,
          price: Number(r.price || r.prix || 0),
          sale_price: r.sale_price || r.promo ? Number(r.sale_price || r.promo) : null,
          category: r.category || r.categorie || "robes",
          stock: Number(r.stock || 0),
          sizes: (r.sizes || r.tailles || "").split("|").filter(Boolean),
          colors: (r.colors || r.couleurs || "").split("|").filter(Boolean),
          images: (r.images || r.image || "").split("|").filter(Boolean),
          video_url: r.video_url || r.video || null,
          is_new: ["1", "true", "oui"].includes((r.is_new || r.nouveau || "").toLowerCase()),
          is_featured: ["1", "true", "oui"].includes((r.is_featured || r.vedette || "").toLowerCase()),
        });
        ok++;
      } catch { fail++; }
      setProgress(i + 1);
    }
    setLoading(false);
    toast.success(`Import terminé : ${ok} ajoutés, ${fail} erreurs`);
    onDone(); onClose(); setRows([]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-lg shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-gold" />
            <h2 className="font-display text-xl">Import massif (CSV)</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-xs text-muted-foreground bg-secondary/40 p-3 rounded">
            Colonnes attendues (en-têtes ligne 1) :
            <code className="block mt-1 font-mono text-[11px]">name, slug, description, price, sale_price, category, stock, sizes, colors, images, video_url, is_new, is_featured</code>
            <p className="mt-2">Sépare les listes (sizes, colors, images) avec <code>|</code>. Catégories : robes, ensembles, chaussures, sacs, accessoires.</p>
          </div>

          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 cursor-pointer hover:border-gold transition">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm">{rows.length ? `${rows.length} ligne(s) prêtes` : "Choisir un fichier CSV"}</span>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </label>

          {rows.length > 0 && (
            <div className="border rounded overflow-hidden">
              <div className="max-h-48 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-secondary/50 sticky top-0">
                    <tr>{Object.keys(rows[0]).slice(0, 5).map((k) => <th key={k} className="text-left px-2 py-1.5">{k}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.slice(0, 8).map((r, i) => (
                      <tr key={i}>{Object.keys(rows[0]).slice(0, 5).map((k) => <td key={k} className="px-2 py-1.5 truncate max-w-[140px]">{r[k]}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-muted-foreground px-2 py-1.5 bg-secondary/30">Aperçu des 8 premières lignes.</p>
            </div>
          )}

          {loading && (
            <div className="space-y-1">
              <div className="h-2 bg-secondary rounded overflow-hidden"><div className="h-full bg-gold transition-all" style={{ width: `${(progress / rows.length) * 100}%` }} /></div>
              <p className="text-xs text-muted-foreground">{progress} / {rows.length}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-5 border-t">
          <button onClick={onClose} className="px-4 py-2 text-xs tracking-luxe border rounded">Annuler</button>
          <button onClick={handleImport} disabled={!rows.length || loading} className="px-5 py-2 text-xs tracking-luxe bg-foreground text-background rounded disabled:opacity-40">
            {loading ? "Import…" : `Importer ${rows.length || ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
