import { createSupabaseServerClient } from "./supabase-server";
import { DUMMY_RESTAURANTS } from "./dummy-data";
import type { Feature, Restaurant } from "./types";

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

// ============================================================
// Features
// ============================================================
export async function fetchPublishedFeatures(): Promise<Feature[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("features")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchPublishedFeatures]", error);
    return [];
  }
  return (data ?? []) as Feature[];
}

export async function fetchFeatureBySlug(
  slug: string,
): Promise<{ feature: Feature; restaurants: Restaurant[] } | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const { data: feature, error: fErr } = await supabase
    .from("features")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (fErr || !feature) {
    if (fErr) console.error("[fetchFeatureBySlug]", fErr);
    return null;
  }

  const ids = (feature as Feature).restaurant_ids ?? [];
  let restaurants: Restaurant[] = [];
  if (ids.length > 0) {
    const { data: rs, error: rErr } = await supabase
      .from("restaurants")
      .select("*")
      .in("id", ids);
    if (rErr) console.error("[fetchFeatureBySlug] restaurants", rErr);
    // 元の restaurant_ids の順序を保つ
    const map = new Map((rs ?? []).map((r) => [r.id, r as Restaurant]));
    restaurants = ids
      .map((id) => map.get(id))
      .filter((r): r is Restaurant => Boolean(r));
  }

  return { feature: feature as Feature, restaurants };
}

export async function fetchAllFeatures(): Promise<Feature[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("features")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchAllFeatures]", error);
    return [];
  }
  return (data ?? []) as Feature[];
}
