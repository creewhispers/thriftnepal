import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { type Product, formatNPR } from "@/lib/products";
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";
import { Truck, ShieldCheck, MapPin } from "lucide-react";

export function CheckoutDialog({
  product, open, onOpenChange,
}: { product: Product | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "", phone: "", address: "", city: "Kathmandu", notes: "",
  });

  if (!product) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenChange(false);
      navigate({ to: "/login", search: { redirect: "/" } });
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      product_id: product.id,
      product_title: product.title,
      product_image: product.image,
      unit_price: product.price,
      quantity: 1,
      total: product.price,
      payment_method: "cod",
      status: "pending",
      ...form,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Order placed! You'll pay on delivery.");
    onOpenChange(false);
    navigate({ to: "/orders" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Checkout</DialogTitle>
          <DialogDescription>Cash on Delivery — pay when your item arrives.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 rounded-2xl bg-secondary p-3">
          <img src={product.image} alt={product.title} className="h-16 w-16 rounded-xl object-cover" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium line-clamp-1">{product.title}</p>
            <p className="text-xs text-muted-foreground">{product.seller.handle} · Size {product.size}</p>
            <p className="text-sm font-semibold mt-1">{formatNPR(product.price)}</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input required placeholder="Full name" value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent" />
          <input required placeholder="Phone (98XXXXXXXX)" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent" />
          <textarea required placeholder="Delivery address" rows={2} value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent resize-none" />
          <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent">
            {["Kathmandu","Lalitpur","Bhaktapur","Pokhara","Biratnagar","Birgunj","Butwal","Dharan","Other"].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <textarea placeholder="Order notes (optional)" rows={2} value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent resize-none" />

          <div className="rounded-2xl border border-border p-3 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><Truck className="h-3.5 w-3.5" /> Delivery in 2–5 days inside the valley</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> Inspect before you pay</div>
            <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> Ships from {product.location}</div>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-foreground text-background p-4">
            <div>
              <p className="text-xs uppercase tracking-wide opacity-70">Total (COD)</p>
              <p className="font-display text-2xl">{formatNPR(product.price)}</p>
            </div>
            <button disabled={busy} type="submit"
              className="rounded-full bg-background text-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
              {busy ? "Placing…" : "Place order"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
