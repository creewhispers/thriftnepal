import { categories } from "@/lib/products";

export function Categories() {
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 mt-16 md:mt-24">
      <div className="flex items-end justify-between mb-6">
        <h2 className="font-display text-3xl md:text-5xl tracking-tight">Shop by category</h2>
        <a className="hidden md:inline text-sm text-muted-foreground hover:text-foreground">View all →</a>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            className="shrink-0 rounded-full border border-border bg-card/60 px-5 py-2.5 text-sm font-medium hover:bg-foreground hover:text-background hover:border-foreground transition"
          >
            {c}
          </button>
        ))}
      </div>
    </section>
  );
}
