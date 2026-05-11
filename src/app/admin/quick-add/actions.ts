"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { scrapeTabelog } from "@/lib/tabelog-scrape";
import { scrapeRestaurantUrl } from "@/lib/restaurant-scrape";
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
  // 旧呼び出し互換: tabelog 専用の従来関数を残す
  return scrapeTabelog(url);
}

/**
 * 統合 URL スクレイパ。tabelog / google maps / instagram / x / tiktok / line 対応。
 * quick-add の STEP1 から呼び出される。
 */
export async function fetchRestaurantInfoAction(url: string) {
  return scrapeRestaurantUrl(url);
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
  google_map_url?: string;
  instagram_url?: string;
  x_url?: string;
  tiktok_url?: string;
  line_url?: string;
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
      google_map_url: payload.google_map_url || null,
      instagram_url: payload.instagram_url || null,
      x_url: payload.x_url || null,
      tiktok_url: payload.tiktok_url || null,
      line_url: payload.line_url || null,
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
