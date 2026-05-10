"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { scrapeTabelog } from "@/lib/tabelog-scrape";
import { lookupGooglePlace } from "@/lib/google-places";
import {
  generateDescription,
  inferScores,
  type GenerationInput,
} from "@/lib/description-gen";
import { generateSlugFromName } from "@/lib/slug";

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function fetchTabelogInfoAction(url: string) {
  return scrapeTabelog(url);
}

export async function lookupGooglePlaceAction(query: string) {
  return lookupGooglePlace(query);
}

export type AutoFillResult = {
  ok: true;
  description: string;
  descriptionSource: "ai" | "rule-based";
  business_dining_score: number;
  quietness_score: number;
  conversation_score: number;
  access_score: number;
  customer_types: string[];
  suggestedSlug?: string;
};

export async function autoFillAction(
  input: GenerationInput,
): Promise<AutoFillResult> {
  const [desc, scores] = await Promise.all([
    generateDescription(input),
    Promise.resolve(inferScores(input)),
  ]);
  const suggestedSlug = generateSlugFromName(input.name, input.area);
  return {
    ok: true,
    description: desc.text,
    descriptionSource: desc.source,
    ...scores,
    suggestedSlug,
  };
}

type SavePayload = {
  name: string;
  slug: string;
  prefecture: string;
  area?: string;
  genre: string;
  description?: string;
  address?: string;
  price_min?: number | null;
  price_max?: number | null;
  tabelog_url?: string;
  official_url?: string;
  google_map_url?: string;
  main_image_url?: string;
  gallery_image_urls?: string[];
  gallery_video_urls?: string[];
  private_room?: boolean;
  vip_available?: boolean;
  business_trip_friendly?: boolean;
  business_dining_score?: number;
  quietness_score?: number;
  conversation_score?: number;
  access_score?: number;
  customer_types?: string[];
  editorial_note?: string;
  is_published?: boolean;
  // 拡張フィールド
  phone?: string;
  opening_hours?: string;
  closed_days?: string;
  seats?: string;
  smoking?: string;
  cards_accepted?: string;
  parking?: string;
  access_text?: string;
  dinner_budget?: string;
  lunch_budget?: string;
  rating?: number | null;
  rating_count?: number | null;
  instagram_url?: string;
};

export async function saveQuickRestaurant(payload: SavePayload) {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, error: "Supabase が未設定です。" };
  }
  if (!payload.name || !payload.slug || !payload.prefecture || !payload.genre) {
    return {
      ok: false as const,
      error: "店名・slug・都道府県・ジャンルは必須です。",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("restaurants")
    .insert({
      name: payload.name,
      slug: payload.slug,
      prefecture: payload.prefecture,
      area: payload.area || null,
      genre: payload.genre,
      description: payload.description || null,
      address: payload.address || null,
      price_min: payload.price_min ?? null,
      price_max: payload.price_max ?? null,
      tabelog_url: payload.tabelog_url || null,
      main_image_url: payload.main_image_url || null,
      gallery_image_urls: payload.gallery_image_urls ?? [],
      gallery_video_urls: payload.gallery_video_urls ?? [],
      private_room: payload.private_room ?? false,
      vip_available: payload.vip_available ?? false,
      business_trip_friendly: payload.business_trip_friendly ?? false,
      business_dining_score: payload.business_dining_score ?? 4,
      quietness_score: payload.quietness_score ?? 4,
      conversation_score: payload.conversation_score ?? 4,
      access_score: payload.access_score ?? 4,
      customer_types: payload.customer_types ?? [],
      editorial_note: payload.editorial_note || null,
      is_published: payload.is_published ?? false,
      official_url: payload.official_url || null,
      google_map_url: payload.google_map_url || null,
      phone: payload.phone || null,
      opening_hours: payload.opening_hours || null,
      closed_days: payload.closed_days || null,
      seats: payload.seats || null,
      smoking: payload.smoking || null,
      cards_accepted: payload.cards_accepted || null,
      parking: payload.parking || null,
      access_text: payload.access_text || null,
      dinner_budget: payload.dinner_budget || null,
      lunch_budget: payload.lunch_budget || null,
      rating: payload.rating ?? null,
      rating_count: payload.rating_count ?? null,
      instagram_url: payload.instagram_url || null,
    })
    .select("id, slug")
    .maybeSingle();

  if (error) return { ok: false as const, error: error.message };
  if (!data) return { ok: false as const, error: "保存に失敗しました" };

  revalidatePath("/admin/restaurants");
  revalidatePath("/restaurants");
  if (payload.is_published) {
    revalidatePath(`/restaurants/${data.slug}`);
  }

  return {
    ok: true as const,
    id: data.id as string,
    slug: data.slug as string,
  };
}
