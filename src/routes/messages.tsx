import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { MobileNav } from "@/components/site/MobileNav";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — Made in Chitwan" }] }),
  component: MessagesPage,
});

type ThreadRow = {
  product_id: string;
  peer_id: string;
  product_title: string;
  product_image: string | null;
  peer_name: string;
  peer_avatar: string | null;
  last_body: string;
  last_at: string;
  unread: number;
};

function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login", search: { redirect: "/messages" } });
  }, [user, authLoading, navigate]);

  const refresh = async (uid: string) => {
    type Row = { id: string; product_id: string; sender_id: string; recipient_id: string; body: string; read_at: string | null; created_at: string };
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, product_id, sender_id, recipient_id, body, read_at, created_at")
      .or(`sender_id.eq.${uid},recipient_id.eq.${uid}`)
      .order("created_at", { ascending: false })
      .limit(500);

    const byThread = new Map<string, { product_id: string; peer_id: string; last: Row; unread: number }>();
    ((msgs ?? []) as Row[]).forEach((m) => {
      const peer = m.sender_id === uid ? m.recipient_id : m.sender_id;
      const key = `${m.product_id}:${peer}`;
      const entry = byThread.get(key);
      const unreadInc = m.recipient_id === uid && !m.read_at ? 1 : 0;
      if (!entry) byThread.set(key, { product_id: m.product_id, peer_id: peer, last: m, unread: unreadInc });
      else entry.unread += unreadInc;
    });

    const arr = Array.from(byThread.values());
    if (arr.length === 0) { setThreads([]); setLoading(false); return; }

    const productIds = Array.from(new Set(arr.map((t) => t.product_id)));
    const peerIds = Array.from(new Set(arr.map((t) => t.peer_id)));
    const [{ data: prods }, { data: profs }] = await Promise.all([
      supabase.from("products").select("id, title, images").in("id", productIds),
      supabase.from("profiles").select("user_id, display_name, handle, avatar_url").in("user_id", peerIds),
    ]);
    const prodMap = new Map((prods ?? []).map((p) => [p.id, p]));
    const profMap = new Map((profs ?? []).map((p) => [p.user_id, p]));

    setThreads(arr.map((t) => {
      const prod = prodMap.get(t.product_id);
      const prof = profMap.get(t.peer_id);
      return {
        product_id: t.product_id,
        peer_id: t.peer_id,
        product_title: prod?.title ?? "Listing",
        product_image: prod?.images?.[0] ?? null,
        peer_name: prof?.display_name ?? prof?.handle ?? "User",
        peer_avatar: prof?.avatar_url ?? null,
        last_body: t.last.body,
        last_at: t.last.created_at,
        unread: t.unread,
      };
    }).sort((a, b) => b.last_at.localeCompare(a.last_at)));
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    void refresh(user.id);
    const ch = supabase
      .channel("inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => { void refresh(user.id); })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 md:px-6 py-10 pb-32 md:pb-14">
        <h1 className="font-display text-4xl md:text-5xl">Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">Chat with buyers and sellers about a listing.</p>

        <div className="mt-8 space-y-2">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && threads.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center">
              <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-3 font-medium">No conversations yet</p>
              <p className="text-sm text-muted-foreground mt-1">Message a seller from any listing to start a chat.</p>
            </div>
          )}
          {threads.map((t) => (
            <Link
              key={`${t.product_id}:${t.peer_id}`}
              to="/m/$pid/$peer"
              params={{ pid: t.product_id, peer: t.peer_id }}
              className="flex gap-3 rounded-2xl border border-border bg-card p-3 hover:bg-secondary/40 transition"
            >
              {t.product_image && <img src={t.product_image} alt="" className="h-14 w-14 rounded-xl object-cover" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{t.peer_name}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">{new Date(t.last_at).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{t.product_title}</p>
                <p className="text-sm mt-1 line-clamp-1">{t.last_body}</p>
              </div>
              {t.unread > 0 && (
                <span className="self-center h-5 min-w-5 px-1.5 rounded-full bg-accent text-accent-foreground text-[10px] font-semibold grid place-items-center">{t.unread}</span>
              )}
            </Link>
          ))}
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
