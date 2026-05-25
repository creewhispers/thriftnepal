const items = [
  "vintage tees", "sneakers", "y2k", "cargo pants", "handmade",
  "streetwear", "denim", "jewelry", "bags", "rewear, don't waste",
];

export function Marquee() {
  return (
    <div className="border-y border-border bg-foreground text-background overflow-hidden py-4">
      <div className="flex whitespace-nowrap marquee">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex shrink-0 items-center gap-10 pr-10">
            {items.map((t) => (
              <span key={t} className="font-display italic text-3xl md:text-4xl">
                {t} <span className="text-accent not-italic mx-4">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
