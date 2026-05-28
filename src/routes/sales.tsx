import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { MobileNav } from "@/components/site/MobileNav";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { formatNPR } from "@/lib/listings";
import { Package, ChevronLeft, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/sales")({
  head: () => ({ meta: [{ title: "Your sales — Made in Chitwan" }] }),
  component: SalesPage,
});

type Order = {
  id: string;
  user_id: string;
  product_id: string;
  product_title: string;
  product_image: string | null;
  total: number;
  quantity: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  full_name: string;
  phone: string;
  address: string;
  city: string;
  notes: string | null;
  created_at: string;
};

const NEXT: Record<Order["status"], Order["status"][]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

function statusColor(s: string) {
  return ({
    pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    confirmed: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    shipped: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    delivered: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    cancelled: "bg-destructive/15 text-destructive",
  } as Record<string, string>)[s] ?? "bg-secondary";
}

function SalesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login", search: { redirect: "/sales" } });
  }, [user, authLoading, navigate]);

  const load = async () => {
    if (!user) return;
    // RLS now lets sellers see orders for their products
    const { data: myProducts } = await supabase.from("products").select("id").eq("seller_id", user.id);
    const ids = (myProducts ?? []).map((p) => p.id);
    if (ids.length === 0) { setOrders([]); setLoading(false); return; }
    const { data } = await supabase
      .from("orders")
      .select("*")
      .in("product_id", ids)
      .order("created_at", { ascending: false });
    setOrders((data as Order[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { if (user) { setLoading(true); void load(); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const advance = async (o: Order, to: Order["status"]) => {
    const { error } = await supabase.from("orders").update({ status: to }).eq("id", o.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked ${to}`);
    void load();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 md:px-6 py-10 pb-32 md:pb-14">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="font-display text-4xl md:text-5xl">Your sales</h1>
        <p className="text-muted-foreground mt-1">Orders placed for your listings.</p>

        <div className="mt-8 space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && orders.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center">
              <Package className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-3 font-medium">No sales yet</p>
              <p className="text-sm text-muted-foreground mt-1">When someone buys one of your listings, it'll show up here.</p>
              <Link to="/sell" className="inline-block mt-4 rounded-full bg-foreground text-background px-5 py-2 text-sm">List an item</Link>
            </div>
          )}
          {orders.map((o) => (
            <article key={o.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex gap-4">
                {o.product_image && <img src={o.product_image} alt={o.product_title} className="h-20 w-20 rounded-xl object-cover" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium line-clamp-1">{o.product_title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Order #{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full font-medium ${statusColor(o.status)}`}>{o.status}</span>
                  </div>
                  <div className="mt-2 text-sm grid sm:grid-cols-2 gap-x-4 gap-y-1">
                    <span><span className="text-muted-foreground">Buyer:</span> {o.full_name}</span>
                    <span><span className="text-muted-foreground">Phone:</span> {o.phone}</span>
                    <span className="sm:col-span-2"><span className="text-muted-foreground">Ship to:</span> {o.address}, {o.city}</span>
                    {o.notes && <span className="sm:col-span-2"><span className="text-muted-foreground">Notes:</span> {o.notes}</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold mr-auto">{formatNPR(o.total)}</span>
                    <Link
                      to="/m/$pid/$peer"
                      params={{ pid: o.product_id, peer: o.user_id }}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Message buyer
                    </Link>
                    {NEXT[o.status].map((s) => (
                      <button key={s} onClick={() => advance(o, s)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium ${s === "cancelled" ? "border border-destructive/40 text-destructive hover:bg-destructive/10" : "bg-foreground text-background hover:opacity-90"}`}>
                        Mark {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
