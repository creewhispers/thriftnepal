import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { createListing, uploadListingImages, CATEGORIES, CITIES, CONDITIONS, type Condition } from "@/lib/listings";
import { toast } from "sonner";
import { Navbar } from "@/components/site/Navbar";
import { MobileNav } from "@/components/site/MobileNav";
import { Footer } from "@/components/site/Footer";
import { UploadCloud, X, Loader2 } from "lucide-react";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Sell on thriftdepo.np" },
      { name: "description", content: "List your closet on Nepal's online thrift marketplace. Free to list, COD supported." },
    ],
  }),
  component: SellPage,
});

const MAX_IMAGES = 8;
const MAX_BYTES = 6 * 1024 * 1024;

function SellPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: CATEGORIES[0], brand: "", size: "",
    condition: "Good" as Condition, price: "", location: "Kathmandu",
  });

  if (!loading && !user) {
    void navigate({ to: "/login", search: { redirect: "/sell" } });
  }

  const addFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    const valid: File[] = [];
    for (const f of arr) {
      if (f.size > MAX_BYTES) { toast.error(`${f.name} is over 6MB`); continue; }
      valid.push(f);
    }
    const next = [...files, ...valid].slice(0, MAX_IMAGES);
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const removeFile = (i: number) => {
    const next = files.filter((_, idx) => idx !== i);
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (files.length === 0) { toast.error("Add at least one photo"); return; }
    const price = Number(form.price);
    if (!price || price < 1) { toast.error("Enter a valid price"); return; }
    setBusy(true);
    try {
      const images = await uploadListingImages(user.id, files);
      const id = await createListing(user.id, {
        title: form.title,
        description: form.description,
        category: form.category,
        brand: form.brand,
        size: form.size,
        condition: form.condition,
        price,
        location: form.location,
        images,
      });
      toast.success("Listing is live");
      void navigate({ to: "/p/$id", params: { id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not publish listing");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 md:px-6 py-8 md:py-14 pb-32 md:pb-14">
        <h1 className="font-display text-4xl md:text-5xl tracking-tight">Drop a new listing</h1>
        <p className="text-sm text-muted-foreground mt-2">Free to list. Sell with COD across Nepal.</p>

        <form onSubmit={submit} className="mt-8 space-y-6">
          {/* Image dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-3xl border-2 border-dashed p-8 text-center cursor-pointer transition ${dragOver ? "border-accent bg-accent/5" : "border-border bg-card/40 hover:bg-card"}`}
          >
            <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Drag & drop photos or tap to upload</p>
            <p className="text-xs text-muted-foreground mt-1">Up to {MAX_IMAGES} photos · max 6MB each</p>
            <input
              ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {previews.map((src, i) => (
                <div key={src} className="relative aspect-square rounded-xl overflow-hidden bg-secondary group">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  {i === 0 && <span className="absolute top-1 left-1 rounded-full bg-foreground text-background text-[10px] px-2 py-0.5">Cover</span>}
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 opacity-0 group-hover:opacity-100 transition">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Field label="Title">
            <input required minLength={3} maxLength={140} value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Vintage Levi's denim jacket"
              className="input" />
          </Field>

          <Field label="Description">
            <textarea rows={4} maxLength={4000} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Condition, fit, flaws, measurements…"
              className="input resize-none" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Condition">
              <select required value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value as Condition })} className="input">
                {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Brand">
              <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Levi's, Nike, Vintage…" className="input" />
            </Field>
            <Field label="Size">
              <input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="S, M, 42, OS…" className="input" />
            </Field>
            <Field label="Price (NPR)">
              <input required type="number" min={1} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="2499" className="input" />
            </Field>
            <Field label="Location">
              <select required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input">
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <button type="submit" disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "Publishing…" : "Publish listing"}
          </button>
        </form>
      </main>
      <Footer />
      <MobileNav />

      <style>{`.input { width: 100%; border-radius: 0.75rem; border: 1px solid hsl(var(--border)); background: hsl(var(--background)); padding: 0.625rem 1rem; font-size: 0.875rem; outline: none; }
.input:focus { border-color: hsl(var(--accent)); }`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}
