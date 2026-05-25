import { motion } from "framer-motion";
import { Heart, MapPin, BadgeCheck } from "lucide-react";
import { type Product, formatNPR } from "@/lib/products";
import { useState } from "react";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const [liked, setLiked] = useState(false);
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: (index % 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="group relative break-inside-avoid"
    >
      <div className="relative overflow-hidden rounded-2xl bg-secondary aspect-[4/5]">
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent opacity-0 group-hover:opacity-100 transition" />
        <button
          onClick={(e) => { e.preventDefault(); setLiked((l) => !l); }}
          className="absolute top-2 right-2 grid h-9 w-9 place-items-center rounded-full glass border border-border/60"
          aria-label="Save"
        >
          <Heart className={`h-4 w-4 transition ${liked ? "fill-destructive text-destructive" : ""}`} />
        </button>
        <span className="absolute top-2 left-2 rounded-full bg-background/85 backdrop-blur px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
          {product.condition}
        </span>
      </div>

      <div className="pt-3 px-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium leading-snug line-clamp-2">{product.title}</h3>
          <p className="text-sm font-semibold whitespace-nowrap">{formatNPR(product.price)}</p>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            {product.seller.handle}
            {product.seller.verified && <BadgeCheck className="h-3 w-3 text-accent" />}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {product.location} · {product.size}
          </span>
        </div>
      </div>
    </motion.article>
  );
}
