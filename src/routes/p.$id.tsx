import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getProduct, listProducts, formatNPR, type Listing } from "@/lib/listings";
import { Navbar } from "@/components/site/Navbar";
import { MobileNav } from "@/components/site/MobileNav";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { CheckoutDialog } from "@/components/site/CheckoutDialog";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BadgeCheck, Heart, Share2, MapPin, ShieldCheck, Truck, ArrowLeft, Trash2 } from "lucide-react";

export const Route = createFileRoute("/p/$id")({
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Listing | null>(null);
  const [related, setRelated] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [liked, setLiked] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    const reload = () => getProduct(id).then(async (p) => {
      if (cancel) return;
      setProduct(p);
      if (p) {
        const rel = await listProducts({ category: p.category, limit: 8 });
        if (!cancel) setRelated(rel.filter((r) => r.id !== p.id).slice(0, 4));
      }
    });
    reload().catch(() => {}).finally(() => { if (!cancel) setLoading(false); });
    const ch = supabase
      .channel(`product:${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "products", filter: `id=eq.${id}` }, () => void reload())
      .subscribe();
    return () => { cancel = true; void supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => {
    if (!user || !product) return;
    supabase.from("wishlists").select("product_id").eq("user_id", user.id).eq("product_id", product.id).maybeSingle()
      .then(({ data }) => setLiked(!!data));
  }, [user, product]);

  const toggleLike = async () => {
    if (!user) { void navigate({ to: "/login", search: { redirect: `/p/${id}` } }); return; }
    if (!product) return;
    if (liked) { setLiked(false); await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", product.id); }
    else {
      setLiked(true);
      const { error } = await supabase.from("wishlists").insert({ user_id: user.id, product_id: product.id });
      if (error) { setLiked(false); toast.error(error.message); }
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: product?.title, url });
      else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
    } catch {}
  };

  const removeListing = async () => {
    if (!product || !confirm("Delete this listing?")) return;
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Listing deleted");
    void navigate({ to: "/" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-10 grid md:grid-cols-2 gap-8">
          <div className="aspect-square rounded-3xl bg-secondary animate-pulse" />
          <div className="space-y-3">
            <div className="h-8 w-2/3 bg-secondary rounded animate-pulse" />
            <div className="h-6 w-1/3 bg-secondary rounded animate-pulse" />
            <div className="h-24 w-full bg-secondary rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background text-foreground"><Navbar />
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="font-display text-3xl">Listing not found</h1>
          <p className="text-sm text-muted-foreground mt-2">It may have been sold or removed.</p>
          <Link to="/" className="inline-flex mt-6 rounded-full bg-foreground text-background px-5 py-2.5 text-sm">Back to feed</Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === product.seller_id;
  const cover = product.images[activeImg] ?? product.images[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 md:px-6 py-6 md:py-10 pb-32 md:pb-14">
        <button onClick={() => navigate({ to: "/" })} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="grid md:grid-cols-2 gap-6 md:gap-10">
          <div>
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-secondary">
              {cover && <img src={cover} alt={product.title} className="h-full w-full object-cover" />}
              <span className="absolute top-3 left-3 rounded-full bg-background/90 backdrop-blur px-3 py-1 text-xs font-medium uppercase tracking-wide">{product.condition}</span>
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {product.images.map((src, i) => (
                  <button key={src} onClick={() => setActiveImg(i)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition ${i === activeImg ? "border-foreground" : "border-transparent opacity-70 hover:opacity-100"}`}>
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight">{product.title}</h1>
            <p className="font-display text-3xl mt-2">{formatNPR(product.price)}</p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {product.brand && <Badge>{product.brand}</Badge>}
              {product.size && <Badge>Size {product.size}</Badge>}
              <Badge>{product.category}</Badge>
              <Badge><MapPin className="h-3 w-3 inline mr-1" />{product.location}</Badge>
            </div>

            {product.description && (
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{product.description}</p>
            )}

            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border p-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-foreground text-background text-sm font-bold overflow-hidden">
                {product.seller?.avatar_url
                  ? <img src={product.seller.avatar_url} alt="" className="h-full w-full object-cover" />
                  : (product.seller?.display_name ?? "U").slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium flex items-center gap-1">
                  {product.seller?.display_name ?? "Seller"}
                  {product.seller?.verified && <BadgeCheck className="h-4 w-4 text-accent" />}
                </p>
                <p className="text-xs text-muted-foreground truncate">{product.seller?.handle ?? ""}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-[1fr_auto_auto] gap-2">
              {isOwner ? (
                <button onClick={removeListing} className="inline-flex items-center justify-center gap-2 rounded-full bg-destructive text-destructive-foreground py-3 text-sm font-medium hover:opacity-90">
                  <Trash2 className="h-4 w-4" /> Delete listing
                </button>
              ) : (
                <button onClick={() => setCheckoutOpen(true)} disabled={product.status !== "active"}
                  className="rounded-full bg-foreground text-background py-3 text-sm font-medium hover:opacity-90 disabled:opacity-50">
                  {product.status === "active" ? "Buy now · COD" : product.status === "reserved" ? "Reserved" : "Sold"}
                </button>
              )}
              <button onClick={toggleLike} className="grid h-12 w-12 place-items-center rounded-full border border-border hover:bg-secondary">
                <Heart className={`h-4 w-4 ${liked ? "fill-destructive text-destructive" : ""}`} />
              </button>
              <button onClick={share} className="grid h-12 w-12 place-items-center rounded-full border border-border hover:bg-secondary">
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-border p-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><Truck className="h-3.5 w-3.5" /> Delivery in 2–5 days inside the valley</div>
              <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> Inspect before you pay (COD)</div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl md:text-3xl mb-6">More in {product.category}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10">
              {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </section>
        )}
      </main>
      <Footer />
      <MobileNav />
      <CheckoutDialog product={product} open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-border bg-card/60 px-3 py-1">{children}</span>;
}
