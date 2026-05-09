import { createSupabaseServerClient } from "./supabase-server";
import { DUMMY_RESTAURANTS } from "./dummy-data";
import type { Restaurant } from "./types";

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function fetchPublishedRestaurants(filters?: {
  prefecture?: string;
  genre?: string;
}): Promise<Restaurant[]> {
  if (!isSupabaseConfigured()) {
    return DUMMY_RESTAURANTS.filter((r) => {
      if (filters?.prefecture && r.prefecture !== filters.prefecture)
        return false;
      if (filters?.genre && r.genre !== filters.genre) return false;
      return r.is_published;
    });
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("restaurants")
    .select("*")
    .eq("is_published", true)
    .order("business_dining_score", { ascending: false });

  if (filters?.prefecture) query = query.eq("prefecture", filters.prefecture);
  if (filters?.genre) query = query.eq("genre", filters.genre);

  const { data, error } = await query;
  if (error) {
    console.error("[fetchPublishedRestaurants]", error);
    return [];
  }
  return (data ?? []) as Restaurant[];
}

export async function fetchRestaurantBySlug(
  slug: string,
): Promise<Restaurant | null> {
  if (!isSupabaseConfigured()) {
    return DUMMY_RESTAURANTS.find((r) => r.slug === slug) ?? null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("[fetchRestaurantBySlug]", error);
    return null;
  }
  return data as Restaurant | null;
}

export async function fetchAllRestaurants(): Promise<Restaurant[]> {
  if (!isSupabaseConfigured()) return DUMMY_RESTAURANTS;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchAllRestaurants]", error);
    return [];
  }
  return (data ?? []) as Restaurant[];
}
