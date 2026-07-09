import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchNotifications, broadcastNotification, fetchProductsLite, fetchAllProfiles, type NotifMediaItem } from "@/lib/admin-api";
import { generateNotificationMessage } from "@/lib/ai-notif.functions";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Send, Bell, Sparkles, Upload, Loader2, X, Image as ImageIcon, Video, Tag, MessageSquare, GripVertical, Package, User, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin/notifications")({ component: NotifAdmin });

function NotifAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["notifs-admin"], queryFn: () => fetchNotifications() });
  const { data: products = [] } = useQuery({ queryKey: ["notif-products"], queryFn: () => fetchProductsLite() });
  const { data: profiles = [] } = useQuery({ queryKey: ["notif-profiles"], queryFn: () => fetchAllProfiles() });
  const genAi = useServerFn(generateNotificationMessage);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "staff">("all");
  const [link, setLink] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [mediaItems, setMediaItems] = useState<NotifMediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const [productId, setProductId] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [compareAt, setCompareAt] = useState<string>("");
  const [discount, setDiscount] = useState<string>("");
  const [currency, setCurrency] = useState<string>("XOF");

  const priceNum = price !== "" ? Number(price) : null;
  const compareNum = compareAt !== "" ? Number(compareAt) : null;
  const discountNum = discount !== "" ? Number(discount) : null;

  // Auto-compute the promo price from compare + discount when promo is empty
  const autoPromoFromDiscount = useMemo(() => {
    if (priceNum != null) return null;
    if (compareNum != null && discountNum != null && discountNum > 0 && discountNum < 100) {
      return Math.round(compareNum * (1 - discountNum / 100));
    }
    return null;
  }, [priceNum, compareNum, discountNum]);

  const autoDiscount =
    priceNum != null && compareNum != null && compareNum > priceNum && discountNum == null
      ? Math.round(((compareNum - priceNum) / compareNum) * 100)
      : null;

  const finalPrice = priceNum ?? autoPromoFromDiscount;
  const effectiveDiscount = discountNum ?? autoDiscount;

  // Validation errors
  const validationError = useMemo(() => {
    if (discountNum != null && (discountNum < 0 || discountNum > 100)) return "La remise doit être entre 0 et 100 %.";
    if (finalPrice != null && compareNum != null && finalPrice > compareNum) return "Le prix promo doit être inférieur au prix d'origine.";
    if (finalPrice != null && finalPrice < 0) return "Le prix ne peut pas être négatif.";
    return null;
  }, [discountNum, finalPrice, compareNum]);

  // Prefill from selected product
  function onSelectProduct(id: string) {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    if (p) {
      setCompareAt(String(p.price));
      if (p.sale_price != null) setPrice(String(p.sale_price));
      setCurrency(p.currency || "XOF");
    }
  }

  async function handleAiGenerate() {
    setAiLoading(true);
    try {
      const res = await genAi({ data: { prompt: aiPrompt, title } });
      if (res?.text) { setBody(res.text); toast.success("Message généré ✨"); }
    } catch (e: any) { toast.error(e?.message ?? "Erreur génération IA"); }
    finally { setAiLoading(false); }
  }

  async function handleUploadFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const added: NotifMediaItem[] = [];
      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");
        if (!isVideo && !isImage) { toast.error(`« ${file.name} » ignoré (type non supporté)`); continue; }
        if (file.size > 25 * 1024 * 1024) { toast.error(`« ${file.name} » ignoré (>25 Mo)`); continue; }
        const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
        const path = `notifications/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from("products").upload(path, file, { upsert: false, contentType: file.type });
        if (error) { toast.error(`Échec « ${file.name} » : ${error.message}`); continue; }
        const { data: pub } = supabase.storage.from("products").getPublicUrl(path);
        added.push({ url: pub.publicUrl, type: isVideo ? "video" : "image" });
      }
      if (added.length) { setMediaItems((prev) => [...prev, ...added]); toast.success(`${added.length} média(s) ajouté(s)`); }
    } finally { setUploading(false); }
  }

  function removeMedia(i: number) { setMediaItems((prev) => prev.filter((_, j) => j !== i)); }
  function reorder(from: number, to: number) {
    if (from === to) return;
    setMediaItems((prev) => { const next = [...prev]; const [m] = next.splice(from, 1); next.splice(to, 0, m); return next; });
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return toast.error("Le titre est requis");
    if (validationError) return toast.error(validationError);
    try {
      await broadcastNotification({
        title, body, audience, link,
        media_items: mediaItems,
        price: finalPrice,
        compare_at_price: compareNum,
        discount_percent: effectiveDiscount,
        currency: finalPrice != null || compareNum != null ? currency : null,
        product_id: productId || null,
      });
      toast.success("Notification envoyée");
      setTitle(""); setBody(""); setLink(""); setAiPrompt("");
      setMediaItems([]); setPrice(""); setCompareAt(""); setDiscount(""); setProductId("");
      qc.invalidateQueries({ queryKey: ["notifs-admin"] });
    } catch (e: any) { toast.error(e.message); }
  }

  const profileMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of profiles) m.set(p.user_id, p.display_name || p.email || "—");
    return m;
  }, [profiles]);

  // Compute "Avant / Après" per notification based on previous entry with same product_id (or previous entry overall)
  const historyWithDiff = useMemo(() => {
    const list = (data ?? []) as any[];
    return list.map((n, idx) => {
      let prev: any = null;
      for (let j = idx + 1; j < list.length; j++) {
        const c = list[j];
        if (n.product_id ? c.product_id === n.product_id : !c.product_id) { prev = c; break; }
      }
      const priceChanged = prev && (prev.price !== n.price || prev.compare_at_price !== n.compare_at_price);
      return { n, prev, priceChanged };
    });
  }, [data]);

  return (
    <div className="space-y-6">
      <header>
        <p className="tracking-luxe text-[10px] text-gold">Centre de notifications</p>
        <h1 className="font-display text-3xl mt-1">Notifications</h1>
      </header>

      <form onSubmit={send} className="bg-background border rounded-lg p-6 space-y-4">
        <h2 className="font-display text-xl">Nouvelle annonce</h2>

        <input required placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded px-3 py-2" />

        <Tabs defaultValue="message" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="message"><MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Message</TabsTrigger>
            <TabsTrigger value="media"><ImageIcon className="h-3.5 w-3.5 mr-1.5" /> Médias</TabsTrigger>
            <TabsTrigger value="price"><Tag className="h-3.5 w-3.5 mr-1.5" /> Prix</TabsTrigger>
          </TabsList>

          <TabsContent value="message" className="space-y-3 mt-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <input placeholder="Décris ton annonce à l'IA (ex: soldes -30% sur les robes)" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} className="flex-1 border rounded px-3 py-2 text-sm" />
              <button type="button" onClick={handleAiGenerate} disabled={aiLoading} className="inline-flex items-center justify-center gap-2 bg-gold text-background px-4 py-2 text-xs tracking-luxe disabled:opacity-50">
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Générer
              </button>
            </div>
            <textarea placeholder="Message (rédigé manuellement ou via l'IA). Le prix sera ajouté automatiquement à la fin." value={body} onChange={(e) => setBody(e.target.value)} rows={5} className="w-full border rounded px-3 py-2" />
          </TabsContent>

          <TabsContent value="media" className="space-y-3 mt-4">
            {mediaItems.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground">Glisser-déposer pour réordonner. Le premier média sert d'aperçu principal.</p>
                <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {mediaItems.map((m, i) => (
                    <li key={m.url} draggable
                      onDragStart={(e) => { setDragIndex(i); e.dataTransfer.effectAllowed = "move"; }}
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (overIndex !== i) setOverIndex(i); }}
                      onDragLeave={() => { if (overIndex === i) setOverIndex(null); }}
                      onDrop={(e) => { e.preventDefault(); if (dragIndex !== null) reorder(dragIndex, i); setDragIndex(null); setOverIndex(null); }}
                      onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                      className={`relative group border rounded-lg overflow-hidden bg-secondary/20 cursor-move transition ${overIndex === i ? "ring-2 ring-gold" : ""} ${dragIndex === i ? "opacity-40" : ""}`}>
                      <div className="aspect-square w-full">
                        {m.type === "video" ? <video src={m.url} className="w-full h-full object-cover" muted /> : <img src={m.url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="absolute top-1 left-1 bg-foreground/80 text-background text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1"><GripVertical className="h-3 w-3" /> {i + 1}</div>
                      {i === 0 && <div className="absolute bottom-1 left-1 bg-gold text-background text-[10px] px-1.5 py-0.5 rounded tracking-luxe">Principal</div>}
                      <button type="button" onClick={() => removeMedia(i)} className="absolute top-1 right-1 bg-foreground text-background rounded-full p-1 opacity-0 group-hover:opacity-100 transition" aria-label="Retirer"><X className="h-3 w-3" /></button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-secondary/30 transition">
              {uploading ? <Loader2 className="h-6 w-6 animate-spin text-gold" /> : (
                <>
                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-sm">Cliquer pour ajouter des photos ou vidéos</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, MP4, WebM — max 25 Mo / fichier</p>
                </>
              )}
              <input type="file" accept="image/*,video/*" multiple className="hidden" disabled={uploading} onChange={(e) => { handleUploadFiles(e.target.files); e.target.value = ""; }} />
            </label>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Image</span>
              <span className="inline-flex items-center gap-1"><Video className="h-3 w-3" /> Vidéo</span>
              <span className="inline-flex items-center gap-1"><GripVertical className="h-3 w-3" /> Glisser pour réordonner</span>
            </div>
          </TabsContent>

          <TabsContent value="price" className="space-y-3 mt-4">
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Package className="h-3 w-3" /> Produit lié (synchronise le prix côté boutique)</span>
              <select value={productId} onChange={(e) => onSelectProduct(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
                <option value="">— Aucun (notification autonome) —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} · {formatPrice(p.sale_price ?? p.price, p.currency)}</option>
                ))}
              </select>
            </label>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Prix promo</span>
                <input type="number" min="0" step="0.01" placeholder={autoPromoFromDiscount ? `Auto: ${autoPromoFromDiscount}` : "Ex: 12000"} value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border rounded px-3 py-2" />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Prix d'origine (barré)</span>
                <input type="number" min="0" step="0.01" placeholder="Ex: 18000" value={compareAt} onChange={(e) => setCompareAt(e.target.value)} className="w-full border rounded px-3 py-2" />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Remise (%)</span>
                <input type="number" min="0" max="100" step="1" placeholder={autoDiscount ? `Auto: ${autoDiscount}%` : "Ex: 30"} value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full border rounded px-3 py-2" />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Devise</span>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full border rounded px-3 py-2">
                  <option value="XOF">XOF (FCFA)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </label>
            </div>

            {validationError && (
              <div className="bg-rose/10 border border-rose text-rose-deep text-xs rounded px-3 py-2">{validationError}</div>
            )}

            {(finalPrice != null || compareNum != null || effectiveDiscount != null) && (
              <div className="bg-secondary/30 border rounded p-3 flex items-baseline gap-3 flex-wrap">
                <span className="text-[10px] tracking-luxe text-muted-foreground uppercase">Aperçu</span>
                {finalPrice != null && <span className="text-lg font-medium text-gold">{formatPrice(finalPrice, currency)}</span>}
                {compareNum != null && finalPrice != null && compareNum > finalPrice && (
                  <span className="text-sm line-through text-muted-foreground">{formatPrice(compareNum, currency)}</span>
                )}
                {effectiveDiscount != null && (
                  <span className="bg-gold text-background text-[10px] tracking-luxe px-2 py-0.5 rounded">-{effectiveDiscount}%</span>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Renseigne le prix promo, le prix barré, ou une remise en %. Les autres champs sont calculés automatiquement, et le prix est ajouté au message envoyé au client.</p>
          </TabsContent>
        </Tabs>

        <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t">
          <select value={audience} onChange={(e) => setAudience(e.target.value as any)} className="border rounded px-3 py-2">
            <option value="all">Tous les clients</option>
            <option value="staff">Équipe (staff uniquement)</option>
          </select>
          <input placeholder="Lien (optionnel) /boutique" value={link} onChange={(e) => setLink(e.target.value)} className="border rounded px-3 py-2" />
        </div>

        <button disabled={!!validationError} className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-xs tracking-luxe disabled:opacity-50">
          <Send className="h-4 w-4" /> Envoyer
        </button>
      </form>

      <div className="bg-background border rounded-lg p-6">
        <h2 className="font-display text-xl mb-4">Historique</h2>
        <ul className="divide-y">
          {historyWithDiff.map(({ n, prev, priceChanged }) => {
            const cur = n.currency ?? "XOF";
            const author = n.created_by ? (profileMap.get(n.created_by) ?? "Admin") : "—";
            const productName = n.product_id ? products.find((p) => p.id === n.product_id)?.name : null;
            return (
              <li key={n.id} className="py-3 flex gap-3">
                <Bell className="h-4 w-4 text-gold mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="font-medium text-sm">{n.title}</p>
                    {productName && (
                      <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                        <Package className="h-3 w-3" /> {productName}
                      </span>
                    )}
                  </div>
                  {n.body && <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">{n.body}</p>}
                  {n.media_url && (n.media_type === "video"
                    ? <video src={n.media_url} className="mt-2 max-h-32 rounded border" controls />
                    : <img src={n.media_url} alt="" className="mt-2 max-h-32 rounded border" />)}

                  {(n.price != null || n.compare_at_price != null) && (
                    <p className="mt-1 flex items-baseline gap-2 flex-wrap">
                      {n.price != null && <span className="text-xs font-medium text-gold">{formatPrice(Number(n.price), cur)}</span>}
                      {n.compare_at_price != null && <span className="text-[10px] line-through text-muted-foreground">{formatPrice(Number(n.compare_at_price), cur)}</span>}
                      {n.discount_percent != null && <span className="bg-gold text-background text-[9px] tracking-luxe px-1.5 py-0.5 rounded">-{Number(n.discount_percent)}%</span>}
                    </p>
                  )}

                  {priceChanged && (
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] flex-wrap">
                      <span className="bg-muted px-1.5 py-0.5 rounded tracking-luxe uppercase">Avant</span>
                      <span className="text-muted-foreground">
                        {prev.price != null ? formatPrice(Number(prev.price), prev.currency ?? cur) : "—"}
                        {prev.compare_at_price != null && <span className="line-through ml-1">{formatPrice(Number(prev.compare_at_price), prev.currency ?? cur)}</span>}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="bg-gold/20 text-gold px-1.5 py-0.5 rounded tracking-luxe uppercase">Après</span>
                      <span className="font-medium">
                        {n.price != null ? formatPrice(Number(n.price), cur) : "—"}
                        {n.compare_at_price != null && <span className="line-through ml-1 text-muted-foreground">{formatPrice(Number(n.compare_at_price), cur)}</span>}
                      </span>
                    </div>
                  )}

                  <p className="text-[10px] text-muted-foreground mt-1 inline-flex items-center gap-2 flex-wrap">
                    <span>{n.audience}</span>
                    <span>·</span>
                    <span>{new Date(n.created_at).toLocaleString("fr-FR")}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1"><User className="h-3 w-3" /> Mise à jour par <span className="text-foreground">{author}</span></span>
                  </p>
                </div>
              </li>
            );
          })}
          {!data?.length && <p className="text-muted-foreground text-sm text-center py-6">Aucune notification.</p>}
        </ul>
      </div>
    </div>
  );
}
