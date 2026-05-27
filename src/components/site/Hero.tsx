import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import hero from "@/assets/hero-model.jpg";

export function Hero() {
  const scrollToFeed = () => {
    document.getElementById("feed")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative mx-auto max-w-7xl px-4 md:px-6 pt-6 md:pt-10">
      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl bg-secondary/60 p-6 md:p-10 lg:p-14 min-h-[60vh]">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Nepal's thrift marketplace · made in Chitwan
          </div>

          <div className="mt-10">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-[14vw] leading-[0.92] md:text-[9rem] lg:text-[10rem] tracking-tight"
            >
              Buy.<br />
              Sell.<br />
              <span className="italic text-accent">Rewear.</span>
            </motion.h1>

            <p className="mt-6 max-w-md text-base md:text-lg text-muted-foreground">
              The online thrift marketplace for vintage, streetwear & sustainable
              fashion — built in Chitwan, for all of Nepal.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/sell" className="group inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3 text-sm font-medium hover:opacity-90 transition">
                Start Selling
                <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <button onClick={scrollToFeed} className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-6 py-3 text-sm font-medium hover:bg-secondary transition">
                Explore Items
              </button>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-xs text-muted-foreground">
            <Stat n="Live" l="active marketplace" />
            <Stat n="77" l="districts in Nepal" />
            <Stat n="COD" l="cash on delivery" />
            <Stat n="0%" l="seller fees" />
          </div>
        </div>

        <div className="lg:col-span-5 relative rounded-3xl overflow-hidden bg-muted min-h-[60vh]">
          <img src={hero} alt="Featured fit of the week" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-[11px] font-medium">
            <Sparkles className="h-3 w-3 text-accent" /> Drop of the week
          </div>
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <p className="text-xs uppercase tracking-wider opacity-80">Featured fit</p>
            <p className="font-display text-3xl md:text-4xl leading-tight mt-1">
              "Y2K denim, reworked."
            </p>
            <p className="text-xs opacity-80 mt-1">curated from Bharatpur · Chitwan</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="font-display text-2xl text-foreground">{n}</div>
      <div>{l}</div>
    </div>
  );
}
