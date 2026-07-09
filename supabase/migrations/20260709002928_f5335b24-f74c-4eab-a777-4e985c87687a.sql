
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Discount must be a valid percentage
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_discount_percent_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_discount_percent_check
  CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100));

-- Auto-fill created_by from auth.uid() when a staff member inserts
CREATE OR REPLACE FUNCTION public.set_notification_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notifications_set_created_by ON public.notifications;
CREATE TRIGGER trg_notifications_set_created_by
  BEFORE INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_notification_created_by();

CREATE INDEX IF NOT EXISTS idx_notifications_product ON public.notifications(product_id, created_at DESC);
