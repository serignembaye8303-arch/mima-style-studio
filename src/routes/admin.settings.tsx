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
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder}
          className="w-full border rounded px-3 py-2 bg-background"
        />
      ) : (
        <textarea
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder}
          rows={3}
          className="w-full border rounded px-3 py-2 bg-background"
        />
      )}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
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
