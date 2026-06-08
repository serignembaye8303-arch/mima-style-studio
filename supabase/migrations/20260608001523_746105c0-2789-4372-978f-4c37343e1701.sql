-- Remove notifications from realtime publication to prevent cross-user data exposure
ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;

-- Fix orders INSERT policy to prevent user_id spoofing
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
CREATE POLICY "Anyone can insert orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Fix order_items INSERT policy to restrict to own orders
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
CREATE POLICY "Users can insert items for their orders" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = order_id AND (user_id = auth.uid() OR user_id IS NULL)
  )
);

-- Fix user_roles privilege escalation: prevent admins from assigning admin/super_admin
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin') AND role NOT IN ('admin', 'super_admin'));