import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { MobileNav } from "@/components/site/MobileNav";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import type { Listing } from "@/lib/listings";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/saved")({
  head: () => ({ meta: [{ title: "Saved items — Made in Chitwan" }] }),
  component: SavedPage,
});

function SavedPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login", search: { redirect: "/saved" } });
  }, [user, authLoading, navigate]);

  const loadSaved = async (uid: string) => {
    setLoading(true);
    const { data: wl } = await supabase.from("wishlists").select("product_id").eq("user_id", uid);
    const ids = (wl ?? []).map((r) => r.product_id);
    if (ids.length === 0) { setItems([]); setLoading(false); return; }
    const { data: prods } = await supabase
      .from("products")
      .select("id, seller_id, title, description, category, brand, size, condition, price, location, images, tags, status, views, created_at")
      .in("id", ids);
    const sellerIds = Array.from(new Set((prods ?? []).map((p) => p.seller_id)));
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, handle, display_name, avatar_url, verified, rating, rating_count")
      .in("user_id", sellerIds);
    const map = new Map((profs ?? []).map((p) => [p.user_id, p]));
    const rows = (prods ?? []).map((p) => ({ ...p, seller: map.get(p.seller_id) ?? null })) as Listing[];
    setItems(rows);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    void loadSaved(user.id);
    const ch = supabase
      .channel("saved-items")
      .on("postgres_changes", { event: "*", schema: "public", table: "wishlists", filter: `user_id=eq.${user.id}` }, () => {
        void loadSaved(user.id);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        void loadSaved(user.id);
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 md:px-6 py-10 pb-32 md:pb-14">
        <h1 className="font-display text-4xl md:text-5xl">Saved items</h1>
        <p className="text-sm text-muted-foreground mt-1">Pieces you're keeping an eye on.</p>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 mt-8">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/5] rounded-2xl bg-secondary animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center mt-8">
            <Heart className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="mt-3 font-medium">No saves yet</p>
            <p className="text-sm text-muted-foreground mt-1">Tap the heart on any listing to save it for later.</p>
            <Link to="/" className="inline-block mt-4 rounded-full bg-foreground text-background px-5 py-2 text-sm">Browse the feed</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 mt-8">
            {items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
