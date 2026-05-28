import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSettings, updateSettings } from "@/lib/admin-api";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({ component: Settings });

function Settings() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => { if (data?.whatsapp_number) setWhatsapp(data.whatsapp_number); }, [data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateSettings({ whatsapp_number: whatsapp });
      toast.success("Paramètres enregistrés");
      qc.invalidateQueries({ queryKey: ["settings"] });
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <p className="tracking-luxe text-[10px] text-gold">Configuration</p>
        <h1 className="font-display text-3xl mt-1">Paramètres</h1>
      </header>

      <form onSubmit={save} className="bg-background border rounded-lg p-6 space-y-4">
        <label className="block space-y-1">
          <span className="text-xs tracking-luxe uppercase text-muted-foreground">Numéro WhatsApp boutique</span>
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+221770000000" className="w-full border rounded px-3 py-2" />
          <span className="text-xs text-muted-foreground">Inclure l'indicatif pays. Format international : +221770000000</span>
        </label>
        <button className="bg-foreground text-background px-6 py-2.5 text-xs tracking-luxe">Enregistrer</button>
      </form>
    </div>
  );
}
