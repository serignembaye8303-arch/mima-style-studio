-- Drop the old overly-permissive policies that conflict with the new ones
DROP POLICY IF EXISTS "Anyone can create order" ON public.orders;
DROP POLICY IF EXISTS "Anyone insert order items" ON public.order_items;