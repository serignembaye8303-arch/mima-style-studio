import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  currency: string;
  category: "robes" | "ensembles" | "chaussures" | "sacs" | "accessoires";
  sizes: string[];
  colors: string[];
  images: string[];
  stock: number;
  is_new: boolean;
  is_featured: boolean;
  rating: number | null;
}

export async function fetchProducts(filters?: {
  category?: string;
  search?: string;
  featured?: boolean;
}): Promise<Product[]> {
  let q = supabase.from("products").select("*").order("created_at", { ascending: false });
  if (filters?.category) q = q.eq("category", filters.category as Product["category"]);
  if (filters?.featured) q = q.eq("is_featured", true);
  if (filters?.search) q = q.ilike("name", `%${filters.search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data as Product | null;
}

export async function fetchWhatsAppNumber(): Promise<string> {
  const { data } = await supabase.from("site_settings").select("whatsapp_number").eq("id", 1).maybeSingle();
  return data?.whatsapp_number ?? "+221770000000";
}
