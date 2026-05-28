import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { MobileNav } from "@/components/site/MobileNav";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { getSellerListings, type Listing, CITIES } from "@/lib/listings";
import { BadgeCheck, LogOut, Pencil, Save, Camera } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/me")({
  head: () => ({ meta: [{ title: "Your profile — Made in Chitwan" }] }),
  component: MePage,
});

type Profile = {
  display_name: string | null;
  handle: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  verified: boolean;
  rating: number;
  rating_count: number;
};

function MePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ display_name: "", bio: "", location: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login", search: { redirect: "/me" } });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    void supabase.from("profiles").select("display_name, handle, bio, location, avatar_url, verified, rating, rating_count").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        setProfile(data as Profile | null);
        if (data) setForm({ display_name: data.display_name ?? "", bio: data.bio ?? "", location: data.location ?? "" });
      });
    void getSellerListings(user.id).then(setListings);
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: form.display_name.trim() || null,
      bio: form.bio.trim() || null,
      location: form.location.trim() || null,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
    setEditing(false);
    setProfile((p) => p ? { ...p, ...form, display_name: form.display_name || null, bio: form.bio || null, location: form.location || null } : p);
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (error) { toast.error(error.message); return; }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: upErr } = await supabase.from("profiles").update({ avatar_url: pub.publicUrl }).eq("user_id", user.id);
    if (upErr) { toast.error(upErr.message); return; }
    setProfile((p) => p ? { ...p, avatar_url: pub.publicUrl } : p);
    toast.success("Avatar updated");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 md:px-6 py-10 pb-32 md:pb-14">
        <section className="rounded-3xl border border-border bg-card/40 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <label className="relative group cursor-pointer">
              <div className="h-24 w-24 rounded-full bg-foreground text-background grid place-items-center text-2xl font-bold overflow-hidden">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  : (profile?.display_name ?? user?.email ?? "U").slice(0, 1).toUpperCase()}
              </div>
              <span className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 grid place-items-center text-white text-xs">
                <Camera className="h-5 w-5" />
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
            </label>

            <div className="flex-1 min-w-0 w-full">
              {!editing ? (
                <>
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-3xl">{profile?.display_name ?? "Your profile"}</h1>
                    {profile?.verified && <BadgeCheck className="h-5 w-5 text-accent" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{profile?.handle} · {profile?.location ?? "Add your city"}</p>
                  {profile?.bio && <p className="mt-3 text-sm whitespace-pre-wrap">{profile.bio}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">
                    ⭐ {profile?.rating?.toFixed(1) ?? "—"} · {profile?.rating_count ?? 0} reviews · {listings.length} listings
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary">
                      <Pencil className="h-3.5 w-3.5" /> Edit profile
                    </button>
                    <Link to="/sales" className="rounded-full bg-foreground text-background px-4 py-2 text-sm hover:opacity-90">Your sales</Link>
                    <Link to="/orders" className="rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary">Your orders</Link>
                    <button onClick={() => supabase.auth.signOut().then(() => navigate({ to: "/" }))}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm text-destructive hover:bg-destructive/10">
                      <LogOut className="h-3.5 w-3.5" /> Sign out
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="Display name"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm" />
                  <select value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm">
                    <option value="">Choose your city</option>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell buyers about your closet" rows={3} maxLength={280}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm resize-none" />
                  <div className="flex gap-2">
                    <button onClick={save} disabled={saving} className="inline-flex items-center gap-1 rounded-full bg-foreground text-background px-5 py-2 text-sm disabled:opacity-50">
                      <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
                    </button>
                    <button onClick={() => setEditing(false)} className="rounded-full border border-border px-5 py-2 text-sm">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Your listings</h2>
            <Link to="/sell" className="rounded-full bg-foreground text-background px-4 py-2 text-sm">+ New listing</Link>
          </div>
          {listings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center mt-6">
              <p className="font-medium">No listings yet</p>
              <p className="text-sm text-muted-foreground mt-1">List your first thrift piece in under a minute.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 mt-6">
              {listings.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </section>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
