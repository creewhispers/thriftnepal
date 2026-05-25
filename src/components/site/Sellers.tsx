import { BadgeCheck, Star } from "lucide-react";

const sellers = [
  { name: "Prerana S.", handle: "@prerana.fits", location: "Kathmandu", items: 42, rating: 5.0, vibe: "Y2K & rare denim curator" },
  { name: "Aayush K.", handle: "@aayush.thrift", location: "Lalitpur", items: 88, rating: 4.9, vibe: "Vintage band tees & 90s archive" },
  { name: "Niharika M.", handle: "@nih.vintage", location: "Bhaktapur", items: 31, rating: 4.8, vibe: "Leather, bags & accessories" },
  { name: "Rojina P.", handle: "@rojina.silver", location: "Kathmandu", items: 56, rating: 4.8, vibe: "Handmade silver jewelry" },
];

export function Sellers() {
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 mt-16 md:mt-24">
      <div className="flex items-end justify-between mb-6">
        <h2 className="font-display text-3xl md:text-5xl tracking-tight">Featured sellers</h2>
        <a className="hidden md:inline text-sm text-muted-foreground hover:text-foreground">All sellers →</a>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sellers.map((s) => (
          <div key={s.handle} className="rounded-2xl border border-border bg-card/60 p-5 hover:bg-secondary/60 transition">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-foreground text-background font-display text-lg">
                {s.name[0]}
              </div>
              <div>
                <div className="flex items-center gap-1 font-medium text-sm">
                  {s.name} <BadgeCheck className="h-3.5 w-3.5 text-accent" />
                </div>
                <div className="text-xs text-muted-foreground">{s.handle} · {s.location}</div>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground line-clamp-2">{s.vibe}</p>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{s.items} listings</span>
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-foreground" /> {s.rating.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
