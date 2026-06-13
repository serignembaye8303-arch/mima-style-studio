
-- ============================================================
-- 1) Guest order insertion vulnerability fix
--    Replace open INSERT policies with a SECURITY DEFINER RPC
--    that creates the order + items atomically and returns the
--    order with its access_token. Only authenticated owners can
--    insert directly; guests must go through the RPC.
-- ============================================================

DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert items for their orders" ON public.order_items;

CREATE POLICY "Authenticated users insert own orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users insert items for own orders"
  ON public.order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
  );

-- Atomic RPC for both guest and authenticated checkout
CREATE OR REPLACE FUNCTION public.create_order_with_items(
  p_order jsonb,
  p_items jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_order   public.orders%ROWTYPE;
  v_subtotal numeric := 0;
  v_item jsonb;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'no_items';
  END IF;
  IF jsonb_array_length(p_items) > 100 THEN
    RAISE EXCEPTION 'too_many_items';
  END IF;

  -- Compute subtotal server-side from items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_subtotal := v_subtotal + ((v_item->>'price')::numeric * (v_item->>'quantity')::int);
  END LOOP;

  INSERT INTO public.orders (
    user_id, customer_name, customer_phone, customer_address, customer_city,
    notes, subtotal, total, currency, status
  ) VALUES (
    v_user_id,
    COALESCE(NULLIF(p_order->>'customer_name',''), ''),
    COALESCE(NULLIF(p_order->>'customer_phone',''), ''),
    NULLIF(p_order->>'customer_address',''),
    NULLIF(p_order->>'customer_city',''),
    NULLIF(p_order->>'notes',''),
    v_subtotal,
    v_subtotal,
    COALESCE(NULLIF(p_order->>'currency',''), 'XOF'),
    'pending'
  ) RETURNING * INTO v_order;

  IF v_order.customer_name = '' OR v_order.customer_phone = '' THEN
    RAISE EXCEPTION 'missing_customer_info';
  END IF;

  INSERT INTO public.order_items (
    order_id, product_id, product_name, product_image, price, quantity, size, color
  )
  SELECT
    v_order.id,
    NULLIF(it->>'product_id','')::uuid,
    it->>'product_name',
    NULLIF(it->>'product_image',''),
    (it->>'price')::numeric,
    (it->>'quantity')::int,
    NULLIF(it->>'size',''),
    NULLIF(it->>'color','')
  FROM jsonb_array_elements(p_items) AS it;

  RETURN jsonb_build_object(
    'id', v_order.id,
    'access_token', v_order.access_token,
    'total', v_order.total,
    'currency', v_order.currency,
    'status', v_order.status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_with_items(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(jsonb, jsonb) TO anon, authenticated;

-- ============================================================
-- 2) site_settings: restrict broad public read; expose only safe
--    columns via a dedicated view for storefront/checkout.
-- ============================================================

DROP POLICY IF EXISTS "Settings are public" ON public.site_settings;

CREATE POLICY "Staff read settings"
  ON public.site_settings
  FOR SELECT
  TO authenticated
  USING (is_staff(auth.uid()));

CREATE OR REPLACE VIEW public.public_site_settings
WITH (security_invoker = true) AS
SELECT
  id,
  whatsapp_number,
  wave_number,
  orange_money_number,
  paypal_link,
  card_payment_link,
  payment_instructions
FROM public.site_settings;

-- The view's SELECT runs as the caller; we need a permissive
-- policy on the underlying table for the limited columns it
-- exposes. Add a policy for anon/authenticated SELECT, but only
-- when querying through the view by using a column-blind policy
-- combined with column-level grants below.
CREATE POLICY "Public read of public settings columns"
  ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Restrict direct table access to only the public-safe columns
-- for anon/authenticated; the broader policy above is gated by
-- column privileges, so future sensitive columns won't be exposed
-- unless explicitly granted.
REVOKE SELECT ON public.site_settings FROM anon, authenticated;
GRANT SELECT (id, whatsapp_number, wave_number, orange_money_number,
              paypal_link, card_payment_link, payment_instructions, updated_at)
  ON public.site_settings TO anon, authenticated;

GRANT SELECT ON public.public_site_settings TO anon, authenticated;
