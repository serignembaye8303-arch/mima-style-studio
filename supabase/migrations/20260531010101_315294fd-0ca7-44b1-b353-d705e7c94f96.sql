
-- 1. Promote thiamalioune617@gmail.com to admin + super_admin
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role FROM auth.users u
WHERE u.email = 'thiamalioune617@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'super_admin'::app_role FROM auth.users u
WHERE u.email = 'thiamalioune617@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Allow any staff member to manage products (not only admin role)
DROP POLICY IF EXISTS "Admins manage products" ON public.products;
CREATE POLICY "Staff manage products"
  ON public.products
  FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
