import { useNavigate, useSearch } from "@tanstack/react-router";
import { CATEGORIES } from "@/lib/listings";

export function Categories() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/" }) as { cat?: string };
  const active = search.cat;

  const pick = (c: string) => {
    navigate({
      to: "/",
      search: c === active ? {} : { cat: c },
      replace: true,
    });
    setTimeout(() => {
      document.getElementById("feed")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 mt-16 md:mt-24">
      <div className="flex items-end justify-between mb-6">
        <h2 className="font-display text-3xl md:text-5xl tracking-tight">Shop by category</h2>
        {active && (
          <button onClick={() => navigate({ to: "/", search: {}, replace: true })} className="text-sm text-muted-foreground hover:text-foreground">
            Clear filter ✕
          </button>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
        {CATEGORIES.map((c) => {
          const isActive = c === active;
          return (
            <button
              key={c}
              onClick={() => pick(c)}
              className={`shrink-0 rounded-full border px-5 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-foreground text-background border-foreground"
                  : "border-border bg-card/60 hover:bg-foreground hover:text-background hover:border-foreground"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>
    </section>
  );
}
