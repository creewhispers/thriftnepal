ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wishlists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.wishlists REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;