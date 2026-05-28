import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { MobileNav } from "@/components/site/MobileNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { ChevronLeft, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/m/$pid/$peer")({
  component: ThreadPage,
});

type Msg = { id: string; sender_id: string; recipient_id: string; body: string; created_at: string; read_at: string | null };

function ThreadPage() {
  const { pid, peer } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [peerProfile, setPeerProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [product, setProduct] = useState<{ title: string; images: string[]; price: number } | null>(null);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login", search: { redirect: `/m/${pid}/${peer}` } });
  }, [user, authLoading, navigate, pid, peer]);

  useEffect(() => {
    if (!user) return;
    void supabase.from("profiles").select("display_name, avatar_url").eq("user_id", peer).maybeSingle()
      .then(({ data }) => setPeerProfile(data));
    void supabase.from("products").select("title, images, price").eq("id", pid).maybeSingle()
      .then(({ data }) => setProduct(data));
  }, [user, pid, peer]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, recipient_id, body, created_at, read_at")
      .eq("product_id", pid)
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${peer}),and(sender_id.eq.${peer},recipient_id.eq.${user.id})`)
      .order("created_at", { ascending: true });
    setMessages((data as Msg[]) ?? []);
    // mark unread as read
    void supabase.from("messages").update({ read_at: new Date().toISOString() })
      .eq("product_id", pid).eq("sender_id", peer).eq("recipient_id", user.id).is("read_at", null);
  };

  useEffect(() => {
    if (!user) return;
    void load();
    const ch = supabase
      .channel(`thread:${pid}:${peer}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `product_id=eq.${pid}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pid, peer]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !body.trim() || sending) return;
    setSending(true);
    const text = body.trim().slice(0, 2000);
    setBody("");
    const { error } = await supabase.from("messages").insert({
      product_id: pid, sender_id: user.id, recipient_id: peer, body: text,
    });
    setSending(false);
    if (error) { toast.error(error.message); setBody(text); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <div className="border-b border-border bg-card/40">
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-3 flex items-center gap-3">
          <Link to="/messages" className="text-muted-foreground hover:text-foreground"><ChevronLeft className="h-5 w-5" /></Link>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background text-xs font-bold overflow-hidden">
            {peerProfile?.avatar_url
              ? <img src={peerProfile.avatar_url} alt="" className="h-full w-full object-cover" />
              : (peerProfile?.display_name ?? "U").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{peerProfile?.display_name ?? "User"}</p>
            {product && <p className="text-xs text-muted-foreground truncate">About: {product.title}</p>}
          </div>
          <Link to="/p/$id" params={{ id: pid }} className="text-xs underline text-muted-foreground hover:text-foreground">View listing</Link>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pb-32 md:pb-24">
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-6 space-y-2">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-12">Say hi 👋 — ask about size, condition, or pickup.</p>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words ${mine ? "bg-foreground text-background" : "bg-secondary"}`}>
                  {m.body}
                  <span className={`block mt-0.5 text-[10px] ${mine ? "opacity-60" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </main>

      <form onSubmit={send} className="fixed bottom-0 inset-x-0 md:bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-3 pb-20 md:pb-3 flex items-center gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            placeholder="Type a message…"
            className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          <button type="submit" disabled={!body.trim() || sending} className="grid h-11 w-11 place-items-center rounded-full bg-foreground text-background disabled:opacity-50">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
      <MobileNav />
    </div>
  );
}
