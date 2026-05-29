import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";

/**
 * Web Notifications via realtime — works while the tab is open or in the
 * background. Falls back to in-app toasts when permission is denied.
 */
export function useLiveNotifications() {
  const { user } = useAuth();
  const startedAt = useRef<string>(new Date().toISOString());

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    // Ask once (silently ignored if already decided)
    if (Notification.permission === "default") {
      void Notification.requestPermission().catch(() => {});
    }

    const notify = (title: string, body: string, tag?: string, url?: string) => {
      if (typeof document !== "undefined" && !document.hidden) {
        toast(title, { description: body });
      }
      if (Notification.permission === "granted") {
        try {
          const n = new Notification(title, { body, tag, icon: "/favicon.ico" });
          if (url) n.onclick = () => { window.focus(); window.location.href = url; };
        } catch { /* noop */ }
      }
    };

    // 1. New messages
    const msgCh = supabase
      .channel(`notify-msg:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` },
        async (payload) => {
          const m = payload.new as { sender_id: string; product_id: string; body: string; created_at: string };
          if (m.created_at < startedAt.current) return;
          const { data: prof } = await supabase
            .from("profiles").select("display_name, handle").eq("user_id", m.sender_id).maybeSingle();
          const who = prof?.display_name ?? prof?.handle ?? "Someone";
          notify(`New message from ${who}`, m.body.slice(0, 120), `msg:${m.sender_id}:${m.product_id}`, `/m/${m.product_id}/${m.sender_id}`);
        },
      )
      .subscribe();

    // 2. Buyer: my order status changed
    const buyerCh = supabase
      .channel(`notify-buyer:${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const o = payload.new as { id: string; status: string; product_title: string };
          const old = payload.old as { status?: string };
          if (old?.status === o.status) return;
          notify(`Order ${o.status}`, o.product_title, `order:${o.id}`, `/orders`);
        },
      )
      .subscribe();

    // 3. Seller: new sale — listen to all order inserts, filter client-side by seller
    const sellerCh = supabase
      .channel(`notify-seller:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        async (payload) => {
          const o = payload.new as { id: string; product_id: string; product_title: string; total: number };
          const { data: prod } = await supabase
            .from("products").select("seller_id").eq("id", o.product_id).maybeSingle();
          if (!prod || prod.seller_id !== user.id) return;
          notify(`New sale: NPR ${o.total.toLocaleString()}`, o.product_title, `sale:${o.id}`, `/sales`);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(msgCh);
      void supabase.removeChannel(buyerCh);
      void supabase.removeChannel(sellerCh);
    };
  }, [user]);
}
