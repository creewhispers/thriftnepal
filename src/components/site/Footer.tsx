export function Footer() {
  return (
    <footer className="mx-auto max-w-7xl px-4 md:px-6 mt-20 md:mt-32 pb-28 md:pb-12">
      <div className="border-t border-border pt-10 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="font-display text-3xl">thriftdepo<span className="text-accent">.</span>np</div>
          <p className="text-sm text-muted-foreground mt-3 max-w-xs">
            Nepal's online thrift marketplace. Rewear. Resell. Reduce.
          </p>
        </div>
        {[
          { h: "Marketplace", l: ["Browse", "Categories", "Sellers", "Drops"] },
          { h: "Company", l: ["About", "Community", "FAQ", "Contact"] },
        ].map((c) => (
          <div key={c.h}>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">{c.h}</div>
            <ul className="space-y-2 text-sm">
              {c.l.map((i) => (<li key={i}><a className="hover:text-accent transition">{i}</a></li>))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>© 2026 thriftdepo.np — Made in Kathmandu.</span>
        <span>Terms · Privacy · Community Guidelines</span>
      </div>
    </footer>
  );
}
