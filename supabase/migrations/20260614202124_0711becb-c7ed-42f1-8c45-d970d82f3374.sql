
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS top_bar_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS top_bar_text text NOT NULL DEFAULT 'Livraison offerte dès 80 000 FCFA · Commande par WhatsApp en 1 clic',
  ADD COLUMN IF NOT EXISTS marquee_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS marquee_items text NOT NULL DEFAULT 'Livraison rapide|Commande WhatsApp|Paiement à la livraison|Pièces exclusives|Service sur mesure';

DROP VIEW IF EXISTS public.public_site_settings;
CREATE VIEW public.public_site_settings
WITH (security_invoker = true) AS
SELECT
  id,
  whatsapp_number,
  wave_number,
  orange_money_number,
  paypal_link,
  card_payment_link,
  payment_instructions,
  top_bar_enabled,
  top_bar_text,
  marquee_enabled,
  marquee_items
FROM public.site_settings;

GRANT SELECT ON public.public_site_settings TO anon, authenticated;
