import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchNotifications, broadcastNotification } from "@/lib/admin-api";
import { useState } from "react";
import { toast } from "sonner";
import { Send, Bell } from "lucide-react";

export const Route = createFileRoute("/admin/notifications")({ component: NotifAdmin });

function NotifAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["notifs-admin"], queryFn: () => fetchNotifications() });
  const [f, setF] = useState({ title: "", body: "", audience: "all" as "all" | "staff", link: "" });

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title) return;
    try {
      await broadcastNotification(f);
      toast.success("Notification envoyée");
      setF({ title: "", body: "", audience: "all", link: "" });
      qc.invalidateQueries({ queryKey: ["notifs-admin"] });
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="tracking-luxe text-[10px] text-gold">Centre de notifications</p>
        <h1 className="font-display text-3xl mt-1">Notifications</h1>
      </header>

      <form onSubmit={send} className="bg-background border rounded-lg p-6 space-y-4">
        <h2 className="font-display text-xl">Nouvelle annonce</h2>
        <input required placeholder="Titre" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="w-full border rounded px-3 py-2" />
        <textarea placeholder="Message" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} rows={3} className="w-full border rounded px-3 py-2" />
        <div className="grid sm:grid-cols-2 gap-3">
          <select value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value as any })} className="border rounded px-3 py-2">
            <option value="all">Tous les clients</option>
            <option value="staff">Équipe (staff uniquement)</option>
          </select>
          <input placeholder="Lien (optionnel) /boutique" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} className="border rounded px-3 py-2" />
        </div>
        <button className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-xs tracking-luxe"><Send className="h-4 w-4" /> Envoyer</button>
      </form>

      <div className="bg-background border rounded-lg p-6">
        <h2 className="font-display text-xl mb-4">Historique</h2>
        <ul className="divide-y">
          {(data ?? []).map((n: any) => (
            <li key={n.id} className="py-3 flex gap-3">
              <Bell className="h-4 w-4 text-gold mt-1" />
              <div className="flex-1">
                <p className="font-medium text-sm">{n.title}</p>
                {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
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
