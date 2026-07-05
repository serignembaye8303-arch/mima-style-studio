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

  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [uploading, setUploading] = useState(false);

  const [price, setPrice] = useState<string>("");
  const [currency, setCurrency] = useState<string>("XOF");

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

  async function handleUpload(file: File) {
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      toast.error("Seuls les images et vidéos sont acceptés");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 25 Mo)");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
      const path = `notifications/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("products").upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("products").getPublicUrl(path);
      setMediaUrl(pub.publicUrl);
      setMediaType(isVideo ? "video" : "image");
      toast.success("Média téléversé");
    } catch (e: any) {
      toast.error(e?.message ?? "Échec du téléversement");
    } finally {
      setUploading(false);
    }
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
        media_url: mediaUrl,
        media_type: mediaType,
        price: price ? Number(price) : null,
        currency: price ? currency : null,
      });
      toast.success("Notification envoyée");
      setTitle(""); setBody(""); setLink(""); setAiPrompt("");
      setMediaUrl(null); setMediaType(null); setPrice("");
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
            {mediaUrl ? (
              <div className="relative inline-block">
                {mediaType === "video" ? (
                  <video src={mediaUrl} className="max-h-64 rounded border" controls />
                ) : (
                  <img src={mediaUrl} alt="Aperçu" className="max-h-64 rounded border" />
                )}
                <button
                  type="button"
                  onClick={() => { setMediaUrl(null); setMediaType(null); }}
                  className="absolute -top-2 -right-2 bg-foreground text-background rounded-full p-1"
                  aria-label="Retirer le média"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer hover:bg-secondary/30 transition">
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gold" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                    <p className="text-sm">Cliquer pour ajouter une photo ou une vidéo</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, MP4, WebM — max 25 Mo</p>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
              </label>
            )}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Image</span>
              <span className="inline-flex items-center gap-1"><Video className="h-3 w-3" /> Vidéo</span>
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
