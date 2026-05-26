import { supabase } from "@/integrations/supabase/client";

export type Condition = "New" | "Like New" | "Good" | "Worn";
export type ListingStatus = "active" | "sold" | "reserved" | "draft";

export type SellerInfo = {
  user_id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
  verified: boolean;
  rating: number;
  rating_count: number;
};

export type Listing = {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  category: string;
  brand: string | null;
  size: string | null;
  condition: Condition;
  price: number;
  location: string;
  images: string[];
  tags: string[];
  status: ListingStatus;
  views: number;
  created_at: string;
  seller?: SellerInfo | null;
};

export const formatNPR = (n: number) => "रू " + n.toLocaleString("en-IN");

const SELECT_WITH_SELLER = `
  id, seller_id, title, description, category, brand, size, condition,
  price, location, images, tags, status, views, created_at,
  seller:profiles!products_seller_id_fkey(user_id, handle, display_name, avatar_url, verified, rating, rating_count)
`;

// profiles has user_id FK to auth.users, products.seller_id → auth.users — relation must be manual via two queries
async function attachSellers(rows: Omit<Listing, "seller">[]): Promise<Listing[]> {
  if (rows.length === 0) return [];
  const sellerIds = Array.from(new Set(rows.map((r) => r.seller_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, handle, display_name, avatar_url, verified, rating, rating_count")
    .in("user_id", sellerIds);
  const map = new Map((profiles ?? []).map((p) => [p.user_id, p as SellerInfo]));
  return rows.map((r) => ({ ...r, seller: map.get(r.seller_id) ?? null }));
}

export type ListFilters = {
  search?: string;
  category?: string;
  condition?: Condition;
  size?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "trending";
  sellerId?: string;
  limit?: number;
};

export async function listProducts(filters: ListFilters = {}): Promise<Listing[]> {
  let q = supabase
    .from("products")
    .select("id, seller_id, title, description, category, brand, size, condition, price, location, images, tags, status, views, created_at")
    .eq("status", "active");

  if (filters.sellerId) q = q.eq("seller_id", filters.sellerId);
  if (filters.category) q = q.eq("category", filters.category);
  if (filters.condition) q = q.eq("condition", filters.condition);
  if (filters.size) q = q.eq("size", filters.size);
  if (filters.location) q = q.eq("location", filters.location);
  if (typeof filters.minPrice === "number") q = q.gte("price", filters.minPrice);
  if (typeof filters.maxPrice === "number") q = q.lte("price", filters.maxPrice);
  if (filters.search?.trim()) {
    const s = filters.search.trim().replace(/[%_]/g, "");
    q = q.or(`title.ilike.%${s}%,brand.ilike.%${s}%,description.ilike.%${s}%`);
  }
  switch (filters.sort) {
    case "price_asc": q = q.order("price", { ascending: true }); break;
    case "price_desc": q = q.order("price", { ascending: false }); break;
    case "trending": q = q.order("views", { ascending: false }); break;
    default: q = q.order("created_at", { ascending: false });
  }
  q = q.limit(filters.limit ?? 48);

  const { data, error } = await q;
  if (error) throw error;
  return attachSellers((data ?? []) as Omit<Listing, "seller">[]);
}

export async function getProduct(id: string): Promise<Listing | null> {
  const { data, error } = await supabase
    .from("products")
    .select("id, seller_id, title, description, category, brand, size, condition, price, location, images, tags, status, views, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  // fire-and-forget view bump
  void supabase.rpc("noop").then(() => {}).catch(() => {});
  void supabase.from("products").update({ views: (data.views ?? 0) + 1 }).eq("id", id).then(() => {});
  const [withSeller] = await attachSellers([data as Omit<Listing, "seller">]);
  return withSeller;
}

export async function getSellerListings(sellerId: string): Promise<Listing[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, seller_id, title, description, category, brand, size, condition, price, location, images, tags, status, views, created_at")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return attachSellers((data ?? []) as Omit<Listing, "seller">[]);
}

export type NewListingInput = {
  title: string;
  description: string;
  category: string;
  brand: string;
  size: string;
  condition: Condition;
  price: number;
  location: string;
  images: string[];
  tags?: string[];
};

export async function createListing(userId: string, input: NewListingInput) {
  const { data, error } = await supabase
    .from("products")
    .insert({
      seller_id: userId,
      title: input.title.trim(),
      description: input.description.trim() || null,
      category: input.category,
      brand: input.brand.trim() || null,
      size: input.size.trim() || null,
      condition: input.condition,
      price: Math.round(input.price),
      location: input.location,
      images: input.images,
      tags: input.tags ?? [],
      status: "active",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateListingStatus(id: string, status: ListingStatus) {
  const { error } = await supabase.from("products").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteListing(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadListingImages(userId: string, files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

export const CATEGORIES = [
  "Hoodies", "Vintage Tees", "Sneakers", "Cargo Pants",
  "Jackets", "Jewelry", "Bags", "Handmade", "Women's", "Men's",
];

export const CITIES = [
  "Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Biratnagar",
  "Birgunj", "Butwal", "Dharan", "Other",
];

export const CONDITIONS: Condition[] = ["New", "Like New", "Good", "Worn"];
