import { motion } from "framer-motion";
import { Heart, MapPin, BadgeCheck, ShoppingBag } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { type Listing, formatNPR } from "@/lib/listings";
import { CheckoutDialog } from "./CheckoutDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";

export function ProductCard({ product, index = 0 }: { product: Listing; index?: number }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const cover = product.images[0] ?? "https://placehold.co/600x750/0a0a0a/666?text=No+image";

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    supabase.from("wishlists").select("product_id").eq("user_id", user.id).eq("product_id", product.id).maybeSingle()
      .then(({ data }) => { if (!cancel) setLiked(!!data); });
    return () => { cancel = true; };
  }, [user, product.id]);

  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.message("Sign in to save items"); return; }
    if (liked) {
      setLiked(false);
      await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", product.id);
    } else {
      setLiked(true);
      const { error } = await supabase.from("wishlists").insert({ user_id: user.id, product_id: product.id });
      if (error) { setLiked(false); toast.error(error.message); }
    }
  };

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay: (index % 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
        className="group relative break-inside-avoid"
      >
        <Link to="/p/$id" params={{ id: product.id }} className="block">
          <div className="relative overflow-hidden rounded-2xl bg-secondary aspect-[4/5]">
            <img
              src={cover}
              alt={product.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent opacity-0 group-hover:opacity-100 transition" />
            <button
              onClick={toggleLike}
              className="absolute top-2 right-2 grid h-9 w-9 place-items-center rounded-full glass border border-border/60"
              aria-label="Save"
            >
              <Heart className={`h-4 w-4 transition ${liked ? "fill-destructive text-destructive" : ""}`} />
            </button>
            <span className="absolute top-2 left-2 rounded-full bg-background/85 backdrop-blur px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
              {product.condition}
            </span>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCheckoutOpen(true); }}
              className="absolute bottom-2 left-2 right-2 inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground text-background py-2 text-xs font-medium opacity-0 group-hover:opacity-100 transition"
            >
              <ShoppingBag className="h-3.5 w-3.5" /> Buy now · COD
            </button>
          </div>

          <div className="pt-3 px-0.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-medium leading-snug line-clamp-2">{product.title}</h3>
              <p className="text-sm font-semibold whitespace-nowrap">{formatNPR(product.price)}</p>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1 truncate">
                {product.seller?.handle ?? product.seller?.display_name ?? "Seller"}
                {product.seller?.verified && <BadgeCheck className="h-3 w-3 text-accent" />}
              </span>
              <span className="flex items-center gap-1 shrink-0">
                <MapPin className="h-3 w-3" /> {product.location}{product.size ? ` · ${product.size}` : ""}
              </span>
            </div>
          </div>
        </Link>
      </motion.article>
      <CheckoutDialog product={product} open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </>
  );
}
