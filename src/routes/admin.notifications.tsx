import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchNotifications, broadcastNotification, type NotifMediaItem } from "@/lib/admin-api";
import { generateNotificationMessage } from "@/lib/ai-notif.functions";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { Send, Bell, Sparkles, Upload, Loader2, X, Image as ImageIcon, Video, Tag, MessageSquare, GripVertical } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin/notifications")({ component: NotifAdmin });

function NotifAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["notifs-admin"], queryFn: () => fetchNotifications() });
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

  const [price, setPrice] = useState<string>("");
  const [compareAt, setCompareAt] = useState<string>("");
  const [discount, setDiscount] = useState<string>("");
  const [currency, setCurrency] = useState<string>("XOF");

  const priceNum = price ? Number(price) : null;
  const compareNum = compareAt ? Number(compareAt) : null;
  const discountNum = discount ? Number(discount) : null;
  // Auto-compute discount % when both prices given and no manual override
  const autoDiscount =
    priceNum && compareNum && compareNum > priceNum && !discountNum
      ? Math.round(((compareNum - priceNum) / compareNum) * 100)
      : null;
  const effectiveDiscount = discountNum ?? autoDiscount;
  const finalPrice =
    priceNum ??
    (compareNum && discountNum ? Math.round(compareNum * (1 - discountNum / 100)) : null);

  async function handleAiGenerate() {
    setAiLoading(true);
    try {
      const res = await genAi({ data: { prompt: aiPrompt, title } });
      if (res?.text) {
        setBody(res.text);
        toast.success("Message généré ✨");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur génération IA");
    } finally {
      setAiLoading(false);
    }
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
      if (added.length) {
        setMediaItems((prev) => [...prev, ...added]);
        toast.success(`${added.length} média(s) ajouté(s)`);
      }
    } finally {
      setUploading(false);
    }
  }

  function removeMedia(i: number) {
    setMediaItems((prev) => prev.filter((_, j) => j !== i));
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    setMediaItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!title) {
      toast.error("Le titre est requis");
      return;
    }
    try {
      await broadcastNotification({
        title,
        body,
        audience,
        link,
        media_items: mediaItems,
        price: price ? Number(price) : null,
        currency: price ? currency : null,
      });
      toast.success("Notification envoyée");
      setTitle(""); setBody(""); setLink(""); setAiPrompt("");
      setMediaItems([]); setPrice("");
      qc.invalidateQueries({ queryKey: ["notifs-admin"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="tracking-luxe text-[10px] text-gold">Centre de notifications</p>
        <h1 className="font-display text-3xl mt-1">Notifications</h1>
      </header>

      <form onSubmit={send} className="bg-background border rounded-lg p-6 space-y-4">
        <h2 className="font-display text-xl">Nouvelle annonce</h2>

        <input
          required
          placeholder="Titre"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />

        <Tabs defaultValue="message" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="message"><MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Message</TabsTrigger>
            <TabsTrigger value="media"><ImageIcon className="h-3.5 w-3.5 mr-1.5" /> Médias</TabsTrigger>
            <TabsTrigger value="price"><Tag className="h-3.5 w-3.5 mr-1.5" /> Prix</TabsTrigger>
          </TabsList>

          <TabsContent value="message" className="space-y-3 mt-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                placeholder="Décris ton annonce à l'IA (ex: soldes -30% sur les robes)"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="flex-1 border rounded px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={aiLoading}
                className="inline-flex items-center justify-center gap-2 bg-gold text-background px-4 py-2 text-xs tracking-luxe disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Générer
              </button>
            </div>
            <textarea
              placeholder="Message (rédigé manuellement ou via l'IA)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full border rounded px-3 py-2"
            />
          </TabsContent>

          <TabsContent value="media" className="space-y-3 mt-4">
            {mediaItems.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground">
                  Glisser-déposer pour réordonner. Le premier média sert d'aperçu principal.
                </p>
                <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {mediaItems.map((m, i) => (
                    <li
                      key={m.url}
                      draggable
                      onDragStart={(e) => { setDragIndex(i); e.dataTransfer.effectAllowed = "move"; }}
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (overIndex !== i) setOverIndex(i); }}
                      onDragLeave={() => { if (overIndex === i) setOverIndex(null); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragIndex !== null) reorder(dragIndex, i);
                        setDragIndex(null); setOverIndex(null);
                      }}
                      onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                      className={`relative group border rounded-lg overflow-hidden bg-secondary/20 cursor-move transition ${
                        overIndex === i ? "ring-2 ring-gold" : ""
                      } ${dragIndex === i ? "opacity-40" : ""}`}
                    >
                      <div className="aspect-square w-full">
                        {m.type === "video" ? (
                          <video src={m.url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={m.url} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="absolute top-1 left-1 bg-foreground/80 text-background text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                        <GripVertical className="h-3 w-3" /> {i + 1}
                      </div>
                      {i === 0 && (
                        <div className="absolute bottom-1 left-1 bg-gold text-background text-[10px] px-1.5 py-0.5 rounded tracking-luxe">
                          Principal
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeMedia(i)}
                        className="absolute top-1 right-1 bg-foreground text-background rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                        aria-label="Retirer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-secondary/30 transition">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-gold" />
              ) : (
                <>
                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-sm">Cliquer pour ajouter des photos ou vidéos</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, MP4, WebM — max 25 Mo / fichier</p>
                </>
              )}
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => { handleUploadFiles(e.target.files); e.target.value = ""; }}
              />
            </label>

            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Image</span>
              <span className="inline-flex items-center gap-1"><Video className="h-3 w-3" /> Vidéo</span>
              <span className="inline-flex items-center gap-1"><GripVertical className="h-3 w-3" /> Glisser pour réordonner</span>
            </div>
          </TabsContent>

          <TabsContent value="price" className="space-y-3 mt-4">
            <div className="grid sm:grid-cols-[1fr_auto] gap-3">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Prix (optionnel)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="border rounded px-3 py-2"
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="border rounded px-3 py-2"
              >
                <option value="XOF">XOF (FCFA)</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground">Affiche un prix dans la notification (ex: promo, nouveau produit).</p>
          </TabsContent>
        </Tabs>

        <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t">
          <select value={audience} onChange={(e) => setAudience(e.target.value as any)} className="border rounded px-3 py-2">
            <option value="all">Tous les clients</option>
            <option value="staff">Équipe (staff uniquement)</option>
          </select>
          <input placeholder="Lien (optionnel) /boutique" value={link} onChange={(e) => setLink(e.target.value)} className="border rounded px-3 py-2" />
        </div>

        <button className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-xs tracking-luxe">
          <Send className="h-4 w-4" /> Envoyer
        </button>
      </form>

      <div className="bg-background border rounded-lg p-6">
        <h2 className="font-display text-xl mb-4">Historique</h2>
        <ul className="divide-y">
          {(data ?? []).map((n: any) => (
            <li key={n.id} className="py-3 flex gap-3">
              <Bell className="h-4 w-4 text-gold mt-1 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{n.title}</p>
                {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                {n.media_url && (
                  n.media_type === "video"
                    ? <video src={n.media_url} className="mt-2 max-h-32 rounded border" controls />
                    : <img src={n.media_url} alt="" className="mt-2 max-h-32 rounded border" />
                )}
                {n.price != null && (
                  <p className="text-xs font-medium text-gold mt-1">
                    {Number(n.price).toLocaleString("fr-FR")} {n.currency ?? "XOF"}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">{n.audience} · {new Date(n.created_at).toLocaleString("fr-FR")}</p>
              </div>
            </li>
          ))}
          {!data?.length && <p className="text-muted-foreground text-sm text-center py-6">Aucune notification.</p>}
        </ul>
      </div>
    </div>
  );
}
