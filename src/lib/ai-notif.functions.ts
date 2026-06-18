import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const generateNotificationMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const d = data as { prompt?: string; title?: string };
    return { prompt: String(d?.prompt ?? "").slice(0, 500), title: String(d?.title ?? "").slice(0, 200) };
  })
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "Tu es un rédacteur marketing pour une boutique de mode féminine (Mima Boutique, Sénégal). Rédige un message d'annonce court (2-3 phrases max), élégant, chaleureux, en français, prêt à envoyer en notification. N'utilise pas de markdown.",
          },
          {
            role: "user",
            content: `Titre: ${data.title || "(non fourni)"}\nConsigne: ${data.prompt || "Rédige une annonce attractive."}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 429) throw new Error("Limite de requêtes IA atteinte. Réessaie dans un instant.");
      if (res.status === 402) throw new Error("Crédits IA épuisés. Ajoute des crédits dans les paramètres.");
      throw new Error(`Erreur IA: ${txt.slice(0, 200)}`);
    }

    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content ?? "";
    return { text: String(text).trim() };
  });
