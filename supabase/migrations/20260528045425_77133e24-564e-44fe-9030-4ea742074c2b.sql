
-- =========================================================
-- 1. ORDERS: server-side price/integrity trigger on INSERT
-- =========================================================
CREATE OR REPLACE FUNCTION public.enforce_order_integrity_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prod RECORD;
  qty INTEGER;
BEGIN
  -- Lookup product server-side
  SELECT id, seller_id, title, price, status, images
    INTO prod
  FROM public.products
  WHERE id::text = NEW.product_id;

  IF prod.id IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  IF prod.status <> 'active' THEN
    RAISE EXCEPTION 'Product is not available for purchase';
  END IF;

  IF prod.seller_id = NEW.user_id THEN
    RAISE EXCEPTION 'You cannot buy your own listing';
  END IF;

  -- Clamp quantity (thrift = single-unit listings)
  qty := COALESCE(NEW.quantity, 1);
  IF qty < 1 OR qty > 1 THEN
    qty := 1;
  END IF;

  -- Overwrite client-supplied price/total/title/image with trusted values
  NEW.quantity := qty;
  NEW.unit_price := prod.price;
  NEW.total := prod.price * qty;
  NEW.product_title := prod.title;
  NEW.product_image := COALESCE(prod.images[1], NEW.product_image);
  NEW.status := 'pending';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_order_integrity_insert ON public.orders;
CREATE TRIGGER trg_enforce_order_integrity_insert
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.enforce_order_integrity_on_insert();

-- =========================================================
-- 2. ORDERS: restrict buyer UPDATE to shipping fields only
-- =========================================================
CREATE OR REPLACE FUNCTION public.enforce_order_integrity_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role bypasses this check (no auth.uid())
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Sellers/buyers cannot alter immutable / sensitive fields
  NEW.product_id   := OLD.product_id;
  NEW.product_title := OLD.product_title;
  NEW.product_image := OLD.product_image;
  NEW.unit_price   := OLD.unit_price;
  NEW.quantity     := OLD.quantity;
  NEW.total        := OLD.total;
  NEW.status       := OLD.status;
  NEW.payment_method := OLD.payment_method;
  NEW.user_id      := OLD.user_id;
  NEW.created_at   := OLD.created_at;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_order_integrity_update ON public.orders;
CREATE TRIGGER trg_enforce_order_integrity_update
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.enforce_order_integrity_on_update();

-- =========================================================
-- 3. ORDERS: allow sellers to view orders for their products
-- =========================================================
DROP POLICY IF EXISTS "Sellers view orders for their products" ON public.orders;
CREATE POLICY "Sellers view orders for their products"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id::text = orders.product_id
      AND p.seller_id = auth.uid()
  )
);

-- =========================================================
-- 4. PROFILES: prevent self-granted verified/rating
-- =========================================================
CREATE OR REPLACE FUNCTION public.enforce_profile_trust_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    -- Service role / trusted backend: allow
    RETURN NEW;
  END IF;

  -- Lock trust signals from user-facing writes
  NEW.verified     := OLD.verified;
  NEW.rating       := OLD.rating;
  NEW.rating_count := OLD.rating_count;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_trust_fields ON public.profiles;
CREATE TRIGGER trg_enforce_profile_trust_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_profile_trust_fields();
