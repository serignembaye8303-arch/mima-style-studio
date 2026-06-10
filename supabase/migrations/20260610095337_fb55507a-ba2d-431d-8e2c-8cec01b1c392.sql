
CREATE POLICY "Guest orders readable by id"
  ON public.orders FOR SELECT
  USING (user_id IS NULL);
