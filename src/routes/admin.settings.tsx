import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSettings, updateSettings } from "@/lib/admin-api";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({ component: Settings });

function Settings() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const [form, setForm] = useState({
    whatsapp_number: "",
    wave_number: "",
    orange_money_number: "",
    paypal_link: "",
    card_payment_link: "",
    payment_instructions: "",
    top_bar_enabled: true,
    top_bar_text: "",
    marquee_enabled: true,
    marquee_items: "",
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      whatsapp_number: data.whatsapp_number ?? "",
      wave_number: data.wave_number ?? "",
      orange_money_number: data.orange_money_number ?? "",
      paypal_link: data.paypal_link ?? "",
      card_payment_link: data.card_payment_link ?? "",
      payment_instructions: data.payment_instructions ?? "",
      top_bar_enabled: data.top_bar_enabled ?? true,
      top_bar_text: data.top_bar_text ?? "",
      marquee_enabled: data.marquee_enabled ?? true,
      marquee_items: data.marquee_items ?? "",
    });
  }, [data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateSettings(form);
      toast.success("Paramètres enregistrés");
      qc.invalidateQueries({ queryKey: ["settings"] });
    } catch (e: any) { toast.error(e.message); }
  }

  const field = (key: keyof typeof form, label: string, placeholder: string, hint?: string, type: "input" | "textarea" = "input") => (
    <label className="block space-y-1">
      <span className="text-xs tracking-luxe uppercase text-muted-foreground">{label}</span>
      {type === "input" ? (
        <input
          value={form[key] as string}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder}
          className="w-full border rounded px-3 py-2 bg-background"
        />
      ) : (
        <textarea
          value={form[key] as string}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder}
          rows={3}
          className="w-full border rounded px-3 py-2 bg-background"
        />
      )}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );

  const toggle = (key: "top_bar_enabled" | "marquee_enabled", label: string) => (
    <label className="flex items-center justify-between gap-4 cursor-pointer">
      <span className="text-xs tracking-luxe uppercase text-muted-foreground">{label}</span>
      <button
        type="button"
        onClick={() => setForm({ ...form, [key]: !form[key] })}
        className={`relative w-11 h-6 rounded-full transition-colors ${form[key] ? "bg-foreground" : "bg-muted"}`}
        aria-pressed={form[key]}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background transition-transform ${form[key] ? "translate-x-5" : ""}`} />
      </button>
    </label>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <p className="tracking-luxe text-[10px] text-gold">Configuration</p>
        <h1 className="font-display text-3xl mt-1">Paramètres</h1>
      </header>

      <form onSubmit={save} className="space-y-6">
        <section className="bg-background border rounded-lg p-6 space-y-4">
          <h2 className="font-display text-lg">Contact</h2>
          {field("whatsapp_number", "Numéro WhatsApp", "+221770000000", "Format international")}
        </section>

        <section className="bg-background border rounded-lg p-6 space-y-4">
          <h2 className="font-display text-lg">Bandeaux d'indications</h2>
          <p className="text-xs text-muted-foreground">Bandeaux affichés en haut du site pour guider vos visiteurs.</p>

          {toggle("top_bar_enabled", "Afficher la barre noire")}
          {field("top_bar_text", "Texte de la barre noire", "Livraison offerte dès 80 000 FCFA · Commande WhatsApp en 1 clic", "Affichée tout en haut, uniquement sur desktop")}

          <div className="border-t pt-4" />

          {toggle("marquee_enabled", "Afficher le bandeau défilant")}
          {field("marquee_items", "Éléments du bandeau défilant", "Livraison rapide|Commande WhatsApp|Paiement à la livraison", "Séparez chaque élément par une barre verticale |", "textarea")}
        </section>

        <section className="bg-background border rounded-lg p-6 space-y-4">
          <h2 className="font-display text-lg">Moyens de paiement</h2>
          {field("wave_number", "Numéro Wave", "+221770000000", "Numéro qui reçoit les paiements Wave")}
          {field("orange_money_number", "Numéro Orange Money", "+221770000000")}
          {field("paypal_link", "Lien PayPal", "https://paypal.me/mimaboutique", "Ex: paypal.me/votreboutique")}
          {field("card_payment_link", "Lien paiement carte", "https://buy.stripe.com/xxx", "Stripe Payment Link, Lemon Squeezy, etc.")}
          {field("payment_instructions", "Instructions supplémentaires", "Confirmation par WhatsApp sous 1h…", "Affiché aux clients sur la page de paiement", "textarea")}
        </section>

        <button className="bg-foreground text-background px-6 py-2.5 text-xs tracking-luxe">Enregistrer</button>
      </form>
    </div>
  );
}
