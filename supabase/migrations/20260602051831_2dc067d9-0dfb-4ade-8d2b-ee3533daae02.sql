DO $$
BEGIN
  IF to_regclass('public.orders') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_enforce_order_integrity_insert ON public.orders;
    CREATE TRIGGER trg_enforce_order_integrity_insert
      BEFORE INSERT ON public.orders
      FOR EACH ROW
      EXECUTE FUNCTION public.enforce_order_integrity_on_insert();

    DROP TRIGGER IF EXISTS trg_enforce_order_integrity_update ON public.orders;
    CREATE TRIGGER trg_enforce_order_integrity_update
      BEFORE UPDATE ON public.orders
      FOR EACH ROW
      EXECUTE FUNCTION public.enforce_order_integrity_on_update();

    DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
    CREATE TRIGGER orders_updated_at
      BEFORE UPDATE ON public.orders
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF to_regclass('public.profiles') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_enforce_profile_trust_fields ON public.profiles;
    CREATE TRIGGER trg_enforce_profile_trust_fields
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.enforce_profile_trust_fields();

    DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
    CREATE TRIGGER profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF to_regclass('public.products') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS products_updated_at ON public.products;
    CREATE TRIGGER products_updated_at
      BEFORE UPDATE ON public.products
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;