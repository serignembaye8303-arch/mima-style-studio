-- activity_log: prevent forging entries on behalf of other users
DROP POLICY IF EXISTS "Auth insert log" ON public.activity_log;
CREATE POLICY "Auth insert log" ON public.activity_log FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- order_items: only allow inserts for orders owned by the caller, or guest-to-guest (both anon)
DROP POLICY IF EXISTS "Users can insert items for their orders" ON public.order_items;
CREATE POLICY "Users can insert items for their orders" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = order_id 
      AND (
        (user_id = auth.uid() AND auth.uid() IS NOT NULL)
        OR (user_id IS NULL AND auth.uid() IS NULL)
      )
  )
);