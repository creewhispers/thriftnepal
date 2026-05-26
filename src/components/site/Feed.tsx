import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ProductCard } from "./ProductCard";
import { listProducts, type Listing } from "@/lib/listings";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Loader2 } from "lucide-react";

const tabs = [
  { key: "newest", label: "Newest drops", sort: "newest" as const },
  { key: "trending", label: "Trending", sort: "trending" as const },
  { key: "price_asc", label: "Lowest price", sort: "price_asc" as const },
  { key: "price_desc", label: "Highest price", sort: "price_desc" as const },
];

export function Feed() {
  const [tab, setTab] = useState(tabs[0]);
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    listProducts({ sort: tab.sort, limit: 48 })
      .then((rows) => { if (!cancel) setItems(rows); })
      .catch(() => { if (!cancel) setItems([]); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [tab]);

  // realtime: refresh on new/updated/deleted products
  useEffect(() => {
    const channel = supabase
      .channel("products-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        listProducts({ sort: tab.sort, limit: 48 }).then(setItems).catch(() => {});
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [tab]);

  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 mt-16 md:mt-24">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight">The feed</h2>
          <p className="text-sm text-muted-foreground mt-1">Live drops from sellers across Nepal.</p>
        </div>
        <div className="flex gap-1 rounded-full border border-border bg-card/60 p-1 overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition ${
                tab.key === t.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-2xl bg-secondary animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card/40 p-10 md:p-16 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-secondary grid place-items-center mb-4">
            <Plus className="h-5 w-5" />
          </div>
          <h3 className="font-display text-2xl">The depot is fresh</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            No active listings yet. Be the first to drop your closet — it takes under a minute.
          </p>
          <Link to="/sell" className="inline-flex items-center gap-1.5 mt-6 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 transition">
            <Plus className="h-4 w-4" /> List your first item
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}

      {loading && items.length > 0 && (
        <div className="mt-6 flex justify-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}
    </section>
  );
}
