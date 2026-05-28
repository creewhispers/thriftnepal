
-- Replace order update trigger to allow status changes by buyer or seller
CREATE OR REPLACE FUNCTION public.enforce_order_integrity_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_seller BOOLEAN := FALSE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Lock immutable fields no matter who is updating
  NEW.product_id    := OLD.product_id;
  NEW.product_title := OLD.product_title;
  NEW.product_image := OLD.product_image;
  NEW.unit_price    := OLD.unit_price;
  NEW.quantity      := OLD.quantity;
  NEW.total         := OLD.total;
  NEW.payment_method := OLD.payment_method;
  NEW.user_id       := OLD.user_id;
  NEW.created_at    := OLD.created_at;

  -- Determine if the caller is the seller of the product
  SELECT EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id::text = OLD.product_id AND p.seller_id = auth.uid()
  ) INTO is_seller;

  -- Only buyer or seller can change status; others get the old status back
  IF auth.uid() <> OLD.user_id AND NOT is_seller THEN
    NEW.status := OLD.status;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_order_integrity_on_update() FROM PUBLIC, anon, authenticated;

-- Allow sellers to UPDATE orders for their products (RLS gate; trigger enforces what fields they can change)
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
);
