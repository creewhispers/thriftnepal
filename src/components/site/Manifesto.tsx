export function Manifesto() {
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 mt-20 md:mt-32">
      <div className="rounded-3xl bg-foreground text-background p-8 md:p-16 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
        <p className="text-xs uppercase tracking-[0.2em] text-background/60">The thriftdepo manifesto</p>
        <h2 className="font-display mt-6 text-4xl md:text-7xl leading-[1.02] max-w-4xl">
          Fashion shouldn't end up in a landfill. It should end up in your closet —{" "}
          <span className="italic text-accent">again, and again.</span>
        </h2>
        <div className="mt-10 grid md:grid-cols-3 gap-6 text-sm">
          {[
            { k: "01", t: "Built for Nepal", d: "Local sellers, NPR pricing, eSewa & Khalti, cash on delivery." },
            { k: "02", t: "Real people, real fits", d: "Verified sellers, ratings & reviews. No bots, no resellers." },
            { k: "03", t: "Circular by default", d: "Every rewear keeps a garment out of waste — and money in Nepal." },
          ].map((b) => (
            <div key={b.k} className="border-t border-background/20 pt-4">
              <div className="text-background/50 font-mono text-xs">{b.k}</div>
              <div className="font-display text-2xl mt-2">{b.t}</div>
              <p className="text-background/70 mt-2">{b.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
