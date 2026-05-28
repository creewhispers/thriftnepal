import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Navbar } from "@/components/site/Navbar";
import { MobileNav } from "@/components/site/MobileNav";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { listProducts, type Listing, CATEGORIES, CONDITIONS, CITIES, type Condition } from "@/lib/listings";
import { Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";

const searchSchema = z.object({
  q: z.string().optional(),
  cat: z.string().optional(),
  cond: z.string().optional(),
  city: z.string().optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "trending"]).optional(),
});

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Search — Made in Chitwan" }] }),
  component: SearchPage,
});

function SearchPage() {
  const sp = Route.useSearch();
  const navigate = useNavigate();
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(sp.q ?? "");
  const [openFilters, setOpenFilters] = useState(false);

  useEffect(() => { setQ(sp.q ?? ""); }, [sp.q]);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    listProducts({
      search: sp.q,
      category: sp.cat,
      condition: sp.cond as Condition | undefined,
      location: sp.city,
      minPrice: sp.min,
      maxPrice: sp.max,
      sort: sp.sort ?? "newest",
      limit: 60,
    })
      .then((r) => { if (!cancel) setItems(r); })
      .catch(() => { if (!cancel) setItems([]); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [sp.q, sp.cat, sp.cond, sp.city, sp.min, sp.max, sp.sort]);

  const update = (patch: Partial<z.infer<typeof searchSchema>>) =>
    navigate({ to: "/search", search: { ...sp, ...patch } });

  const clear = () => navigate({ to: "/search", search: {} });

  const activeFilters = [sp.cat, sp.cond, sp.city, sp.min, sp.max].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 md:px-6 py-8 pb-32 md:pb-14">
        <div className="flex items-center gap-2">
          <form
            onSubmit={(e) => { e.preventDefault(); update({ q: q.trim() || undefined }); }}
            className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2.5 focus-within:border-accent"
          >
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Vintage tees, sneakers, brands…"
              className="w-full bg-transparent text-sm outline-none"
            />
            {q && (
              <button type="button" onClick={() => { setQ(""); update({ q: undefined }); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </form>
          <button
            onClick={() => setOpenFilters((v) => !v)}
            className="relative grid h-11 w-11 place-items-center rounded-full border border-border hover:bg-secondary"
            aria-label="Filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilters > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-foreground text-background text-[10px] grid place-items-center">{activeFilters}</span>
            )}
          </button>
        </div>

        {openFilters && (
          <div className="mt-4 rounded-2xl border border-border bg-card/40 p-4 space-y-3">
            <Row label="Category">
              <Chips options={CATEGORIES} value={sp.cat} onChange={(v) => update({ cat: v })} />
            </Row>
            <Row label="Condition">
              <Chips options={CONDITIONS} value={sp.cond} onChange={(v) => update({ cond: v })} />
            </Row>
            <Row label="City">
              <Chips options={CITIES} value={sp.city} onChange={(v) => update({ city: v })} />
            </Row>
            <Row label="Price (NPR)">
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={sp.min ?? ""} onChange={(e) => update({ min: e.target.value ? Number(e.target.value) : undefined })} className="w-28 rounded-full border border-border bg-background px-3 py-1.5 text-sm" />
                <input type="number" placeholder="Max" value={sp.max ?? ""} onChange={(e) => update({ max: e.target.value ? Number(e.target.value) : undefined })} className="w-28 rounded-full border border-border bg-background px-3 py-1.5 text-sm" />
              </div>
            </Row>
            <Row label="Sort">
              <Chips
                options={["newest", "trending", "price_asc", "price_desc"]}
                labels={{ newest: "Newest", trending: "Trending", price_asc: "Price ↑", price_desc: "Price ↓" }}
                value={sp.sort ?? "newest"}
                onChange={(v) => update({ sort: v as "newest" | "price_asc" | "price_desc" | "trending" })}
              />
            </Row>
            {activeFilters > 0 && (
              <button onClick={clear} className="text-xs text-muted-foreground hover:text-foreground underline">Clear all filters</button>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4">
          {loading ? "Searching…" : `${items.length} result${items.length === 1 ? "" : "s"}`}
          {sp.q && ` for “${sp.q}”`}
        </p>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 mt-6">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/5] rounded-2xl bg-secondary animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center mt-6">
            <p className="font-medium">Nothing matches yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Try different keywords or clear your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 mt-6">
            {items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
      {children}
    </div>
  );
}

function Chips({ options, value, onChange, labels }: { options: readonly string[]; value?: string; onChange: (v?: string) => void; labels?: Record<string, string> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = value === o;
        return (
          <button
            key={o}
            onClick={() => onChange(active ? undefined : o)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${active ? "bg-foreground text-background border-foreground" : "border-border hover:bg-secondary"}`}
          >
            {labels?.[o] ?? o}
          </button>
        );
      })}
    </div>
  );
}
