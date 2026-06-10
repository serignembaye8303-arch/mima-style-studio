
-- Add payment fields to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IS NULL OR payment_method IN ('wave','orange_money','card','paypal','cash_on_delivery'));

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('unpaid','pending_verification','paid','failed','refunded'));

-- Allow buyer to update ONLY payment_method/reference on their own unpaid orders
CREATE POLICY "Buyers set payment on own orders"
  ON public.orders FOR UPDATE
  USING ((auth.uid() = user_id OR user_id IS NULL) AND payment_status IN ('unpaid','pending_verification'))
  WITH CHECK ((auth.uid() = user_id OR user_id IS NULL) AND payment_status IN ('unpaid','pending_verification'));

-- Add payment settings
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS wave_number text,
  ADD COLUMN IF NOT EXISTS orange_money_number text,
  ADD COLUMN IF NOT EXISTS paypal_link text,
  ADD COLUMN IF NOT EXISTS card_payment_link text,
  ADD COLUMN IF NOT EXISTS payment_instructions text;
