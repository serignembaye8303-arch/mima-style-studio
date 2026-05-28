
-- Helper: is_staff
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','super_admin','manager')
  )
$$;

-- Products: add video_url
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url text;

-- Profiles: suspended flag
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;

-- Orders
CREATE TYPE public.order_status AS ENUM ('pending','confirmed','shipped','delivered','cancelled');

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text,
  customer_city text,
  status public.order_status NOT NULL DEFAULT 'pending',
  subtotal numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  notes text,
  whatsapp_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create order" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users see own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Staff update orders" ON public.orders FOR UPDATE USING (public.is_staff(auth.uid()));
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Order items
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid,
  product_name text NOT NULL,
  product_image text,
  price numeric NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  size text,
  color text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_items TO authenticated, anon;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners view items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_staff(auth.uid())))
);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX idx_orders_user ON public.orders(user_id);

-- Stock movements
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason text NOT NULL DEFAULT 'manual',
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage stock movements" ON public.stock_movements FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE INDEX idx_stock_mov_product ON public.stock_movements(product_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.products SET stock = GREATEST(0, stock + NEW.delta), updated_at = now() WHERE id = NEW.product_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER stock_movement_apply AFTER INSERT ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION public.apply_stock_movement();

-- Promotions
CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  link_url text,
  code text,
  discount_percent integer,
  type text NOT NULL DEFAULT 'banner',
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promotions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
GRANT ALL ON public.promotions TO service_role;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Promotions public read" ON public.promotions FOR SELECT USING (true);
CREATE POLICY "Staff manage promotions" ON public.promotions FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER promotions_touch BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  body text,
  type text NOT NULL DEFAULT 'info',
  link text,
  is_read boolean NOT NULL DEFAULT false,
  audience text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own or broadcast notifs" ON public.notifications FOR SELECT USING (
  (auth.uid() = user_id) OR (audience = 'all') OR (audience = 'staff' AND public.is_staff(auth.uid()))
);
CREATE POLICY "Users update own notifs" ON public.notifications FOR UPDATE USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Staff create notifs" ON public.notifications FOR INSERT WITH CHECK (public.is_staff(auth.uid()));
CREATE INDEX idx_notifs_user ON public.notifications(user_id, created_at DESC);

-- Activity log
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  entity text,
  entity_id text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read log" ON public.activity_log FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Auth insert log" ON public.activity_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE INDEX idx_log_created ON public.activity_log(created_at DESC);

-- Profile staff access
CREATE POLICY "Staff view all profiles" ON public.profiles FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff update profiles" ON public.profiles FOR UPDATE USING (public.is_staff(auth.uid()));

-- Super admin role management
CREATE POLICY "Super admin manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('products','products', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Product media public read" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Staff upload product media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff update product media" ON storage.objects FOR UPDATE USING (bucket_id = 'products' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff delete product media" ON storage.objects FOR DELETE USING (bucket_id = 'products' AND public.is_staff(auth.uid()));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
