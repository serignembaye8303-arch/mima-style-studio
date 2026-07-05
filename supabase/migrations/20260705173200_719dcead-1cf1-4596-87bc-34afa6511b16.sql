ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS compare_at_price numeric,
  ADD COLUMN IF NOT EXISTS discount_percent numeric;