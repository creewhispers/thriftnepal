import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { formatNPR } from "@/lib/products";
import { Navbar } from "@/components/site/Navbar";
import { MobileNav } from "@/components/site/MobileNav";
import { Footer } from "@/components/site/Footer";
import { Package, ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "My Orders — thriftdepo.np" },
      { name: "description", content: "Track your thriftdepo.np orders, delivery status, and history." },
    ],
  }),
  component: OrdersPage,
});

type Order = {
  id: string;
  product_title: string;
  product_image: string | null;
  total: number;
  quantity: number;
  status: string;
  payment_method: string;
  full_name: string;
  city: string;
  created_at: string;
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

function OrdersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { redirect: "/orders" } });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const loadOrders = async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      setOrders((data as Order[]) ?? []);
      setLoadingOrders(false);
    };
    void loadOrders();
    const ch = supabase
      .channel("my-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` }, () => {
        void loadOrders();
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 md:px-6 py-10">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4" /> Continue shopping
        </Link>
        <h1 className="font-display text-4xl md:text-5xl">Your orders</h1>
        <p className="text-muted-foreground mt-1">All your thrift hauls in one place.</p>

        <div className="mt-8 space-y-3">
          {loadingOrders && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loadingOrders && orders.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center">
              <Package className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-3 font-medium">No orders yet</p>
              <p className="text-sm text-muted-foreground mt-1">Find something you'll rewear forever.</p>
              <Link to="/" className="inline-block mt-4 rounded-full bg-foreground text-background px-5 py-2 text-sm">Browse the feed</Link>
            </div>
          )}
          {orders.map((o) => (
            <article key={o.id} className="flex gap-4 rounded-2xl border border-border bg-card p-3 md:p-4">
              {o.product_image && (
                <img src={o.product_image} alt={o.product_title} className="h-20 w-20 md:h-24 md:w-24 rounded-xl object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium line-clamp-1">{o.product_title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Order #{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full font-medium ${statusColor(o.status)}`}>
                    {o.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Qty {o.quantity} · {o.city} · {o.payment_method.toUpperCase()}</span>
                  <span className="font-semibold">{formatNPR(o.total)}</span>
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
