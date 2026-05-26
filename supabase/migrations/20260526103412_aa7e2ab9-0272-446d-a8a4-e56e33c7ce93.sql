
-- Remove broad listing policies; public buckets still serve files via direct public URLs.
DROP POLICY IF EXISTS "Product images public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatars public read" ON storage.objects;

-- Lock down SECURITY DEFINER signup function (only trigger needs to run it)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
