import { useEffect, useState } from "react";
import { BadgeCheck, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type SellerStat = {
  user_id: string;
  display_name: string | null;
  handle: string | null;
  location: string | null;
  verified: boolean;
  rating: number;
  listings: number;
};

export function Sellers() {
  const [sellers, setSellers] = useState<SellerStat[] | null>(null);

  useEffect(() => {
    (async () => {
      // Fetch active products and their seller_ids, then count + join profiles client-side
      const { data: prods } = await supabase
        .from("products")
        .select("seller_id")
        .eq("status", "active");
      const counts = new Map<string, number>();
      for (const p of prods ?? []) counts.set(p.seller_id, (counts.get(p.seller_id) ?? 0) + 1);
      const topIds = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id]) => id);
      if (topIds.length === 0) { setSellers([]); return; }
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, handle, location, verified, rating")
        .in("user_id", topIds);
      const ordered = topIds.map((id) => {
        const p = profiles?.find((x) => x.user_id === id);
        return {
          user_id: id,
          display_name: p?.display_name ?? "Seller",
          handle: p?.handle ?? "@seller",
          location: p?.location ?? "Nepal",
          verified: p?.verified ?? false,
          rating: Number(p?.rating ?? 0),
          listings: counts.get(id) ?? 0,
        };
      });
      setSellers(ordered);
    })();
  }, []);

  if (sellers !== null && sellers.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 mt-16 md:mt-24">
      <div className="flex items-end justify-between mb-6">
        <h2 className="font-display text-3xl md:text-5xl tracking-tight">Top sellers</h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(sellers ?? Array.from({ length: 4 })).map((s, i) => {
          if (!s) {
            return <div key={i} className="rounded-2xl border border-border bg-card/60 p-5 h-40 animate-pulse" />;
          }
          const initial = (s.display_name ?? "S").trim().charAt(0).toUpperCase();
          return (
            <div key={s.user_id} className="rounded-2xl border border-border bg-card/60 p-5 hover:bg-secondary/60 transition">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-foreground text-background font-display text-lg">
                  {initial}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1 font-medium text-sm truncate">
                    {s.display_name}
                    {s.verified && <BadgeCheck className="h-3.5 w-3.5 text-accent shrink-0" />}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{s.handle} · {s.location}</div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{s.listings} active listing{s.listings === 1 ? "" : "s"}</span>
                {s.rating > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-foreground" /> {s.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
