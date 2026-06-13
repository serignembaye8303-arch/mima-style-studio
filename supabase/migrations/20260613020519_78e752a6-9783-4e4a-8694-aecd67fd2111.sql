
-- 1) Per-order secret access token for guest orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS access_token text NOT NULL DEFAULT gen_random_uuid()::text;
CREATE INDEX IF NOT EXISTS orders_access_token_idx ON public.orders(access_token);

-- 2) Drop the dangerous guest-order policies
DROP POLICY IF EXISTS "Guest orders readable by id" ON public.orders;
DROP POLICY IF EXISTS "Buyers set payment on own orders" ON public.orders;

-- Re-add a buyer-update policy scoped to AUTHENTICATED owners only (no guest path)
CREATE POLICY "Buyers set payment on own orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND payment_status IN ('unpaid','pending_verification'))
WITH CHECK (auth.uid() = user_id AND payment_status IN ('unpaid','pending_verification'));

-- 3) Secure RPCs for guest access using the per-order token
CREATE OR REPLACE FUNCTION public.get_guest_order_with_items(p_id uuid, p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o public.orders%ROWTYPE;
  its jsonb;
BEGIN
  SELECT * INTO o FROM public.orders WHERE id = p_id AND access_token = p_token;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  SELECT COALESCE(jsonb_agg(to_jsonb(i.*)), '[]'::jsonb) INTO its
    FROM public.order_items i WHERE i.order_id = o.id;
  RETURN jsonb_build_object('order', to_jsonb(o), 'items', its);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_guest_order_payment(
  p_id uuid, p_token text, p_method text, p_reference text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_method NOT IN ('wave','orange_money','card','paypal','cash_on_delivery') THEN
    RAISE EXCEPTION 'invalid_method';
  END IF;
  UPDATE public.orders
     SET payment_method = p_method,
         payment_status = 'pending_verification',
         payment_reference = NULLIF(p_reference, '')
   WHERE id = p_id
     AND access_token = p_token
     AND payment_status IN ('unpaid','pending_verification');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found_or_locked';
  END IF;
END;
$$;

-- Allow anon + authenticated to call the token-gated RPCs (token is the auth)
REVOKE ALL ON FUNCTION public.get_guest_order_with_items(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_guest_order_with_items(uuid, text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.set_guest_order_payment(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_guest_order_payment(uuid, text, text, text) TO anon, authenticated;

-- 4) Tighten SECURITY DEFINER function execution
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.apply_stock_movement() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC;

-- 5) Storage: forbid listing of the products bucket. Public file URLs still work via the CDN.
DROP POLICY IF EXISTS "Product media public read" ON storage.objects;
