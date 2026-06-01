
-- 1) Remove sensitive tables from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.orders;
ALTER PUBLICATION supabase_realtime DROP TABLE public.messages;
ALTER PUBLICATION supabase_realtime DROP TABLE public.wishlists;

-- 2) Tighten seller order update policy with WITH CHECK to prevent financial tampering
DROP POLICY IF EXISTS "Sellers update orders for their products" ON public.orders;
CREATE POLICY "Sellers update orders for their products"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id::text = orders.product_id AND p.seller_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id::text = orders.product_id AND p.seller_id = auth.uid()
  )
);

-- 3) Harden the order update trigger: enforce immutability of financial/identity
-- fields for ALL non-service-role updates (sellers included), and only allow
-- buyer or seller to change status.
CREATE OR REPLACE FUNCTION public.enforce_order_integrity_on_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_seller BOOLEAN := FALSE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Lock immutable fields regardless of caller (buyer or seller)
  NEW.product_id     := OLD.product_id;
  NEW.product_title  := OLD.product_title;
  NEW.product_image  := OLD.product_image;
  NEW.unit_price     := OLD.unit_price;
  NEW.quantity       := OLD.quantity;
  NEW.total          := OLD.total;
  NEW.payment_method := OLD.payment_method;
  NEW.user_id        := OLD.user_id;
  NEW.created_at     := OLD.created_at;
  NEW.full_name      := OLD.full_name;
  NEW.phone          := OLD.phone;
  NEW.address        := OLD.address;
  NEW.city           := OLD.city;
  NEW.notes          := OLD.notes;

  SELECT EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id::text = OLD.product_id AND p.seller_id = auth.uid()
  ) INTO is_seller;

  -- Only buyer or seller can change status
  IF auth.uid() <> OLD.user_id AND NOT is_seller THEN
    NEW.status := OLD.status;
  END IF;

  RETURN NEW;
END;
$function$;
