import { useState } from "react";
import { products } from "@/lib/products";
import { ProductCard } from "./ProductCard";

const tabs = ["For you", "Newest drops", "Sneakers", "Vintage picks", "Trending"];

export function Feed() {
  const [tab, setTab] = useState(tabs[0]);
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 mt-16 md:mt-24">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight">The feed</h2>
          <p className="text-sm text-muted-foreground mt-1">Hand-picked drops from across Nepal.</p>
        </div>
        <div className="flex gap-1 rounded-full border border-border bg-card/60 p-1 overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition ${
                tab === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
        {products.concat(products).map((p, i) => (
          <ProductCard key={`${p.id}-${i}`} product={p} index={i} />
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <button className="rounded-full border border-border bg-card/60 px-6 py-3 text-sm font-medium hover:bg-secondary transition">
          Load more drops
        </button>
      </div>
    </section>
  );
}
