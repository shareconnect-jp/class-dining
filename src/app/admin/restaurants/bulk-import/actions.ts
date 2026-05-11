"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  scrapeRestaurantUrl,
  toFormApply,
} from "@/lib/restaurant-scrape";
import { generateSlugFromName } from "@/lib/slug";
import type { BulkImportRow } from "./parse";

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export type BulkImportRowResult = {
  inputName: string;
  inputUrl: string;
  status: "ok" | "skipped" | "duplicate" | "error";
  reason?: string;
  slug?: string;
  id?: string;
};

const POLITE_DELAY_MS = 400;

function extractTabelogId(url: string): string | undefined {
  // https://tabelog.com/aichi/A2301/A230103/23068153/  -> 23068153
  const m = url.match(/tabelog\.com\/[^/]+\/[^/]+\/[^/]+\/(\d+)\/?/);
  return m?.[1];
}

async function ensureUniqueSlug(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  base: string,
): Promise<string> {
  let candidate = base;
  let suffix = 1;
  // 5 回まで衝突したらタイムスタンプで決着
  for (let i = 0; i < 5; i++) {
    const { data, error } = await supabase
      .from("restaurants")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return `${base}-${Date.now()}`;
}

export async function bulkImportRestaurants(
  rows: BulkImportRow[],
): Promise<
  | { ok: true; results: BulkImportRowResult[] }
  | { ok: false; error: string }
> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase が未設定です" };
  }
  const supabase = await createSupabaseServerClient();
  const results: BulkImportRowResult[] = [];

  for (const row of rows) {
    const inputUrl = row.url;
    const inputName = row.name;

    // グループ URL など個別店舗ページではないものをスキップ
    if (/tabelog\.com\/group\//i.test(inputUrl)) {
      results.push({
        inputName,
        inputUrl,
        status: "skipped",
        reason: "グループ一覧 URL は個別店舗ではないため未対応",
      });
      continue;
    }

    // 既存重複チェック (tabelog_url 完全一致)
    const { data: dup } = await supabase
      .from("restaurants")
      .select("id, slug")
      .eq("tabelog_url", inputUrl)
      .maybeSingle();
    if (dup) {
      results.push({
        inputName,
        inputUrl,
        status: "duplicate",
        reason: "同じ tabelog_url で既に登録済み",
        slug: dup.slug,
        id: dup.id,
      });
      continue;
    }

    try {
      const scrape = await scrapeRestaurantUrl(inputUrl);
      if (!scrape.ok) {
        results.push({
          inputName,
          inputUrl,
          status: "error",
          reason: scrape.error,
        });
        await new Promise((r) => setTimeout(r, POLITE_DELAY_MS));
        continue;
      }
      const apply = toFormApply(scrape, inputUrl);

      // 名前: 入力 > スクレイプ
      const name = inputName && inputName !== "(無名)" ? inputName : apply.name;
      if (!name) {
        results.push({
          inputName,
          inputUrl,
          status: "error",
          reason: "店名が取得できず、入力にも名前がありません",
        });
        continue;
      }

      // slug 生成: 名前 + エリア。ASCII 化できない場合は tabelog ID を採用
      let slugBase = generateSlugFromName(name, apply.area ?? undefined);
      if (!slugBase || slugBase.length < 3) {
        const id = extractTabelogId(inputUrl);
        slugBase = id ? `tabelog-${id}` : `restaurant-${Date.now()}`;
      }
      const slug = await ensureUniqueSlug(supabase, slugBase);

      // ジャンル必須 (DB で not null)。推定不可なら washoku をデフォルト
      const genre = apply.genre ?? "washoku";
      // 都道府県必須。tabelog URL から都道府県は scraper が埋めてくれる想定
      const prefecture = apply.prefecture ?? "";
      if (!prefecture) {
        results.push({
          inputName,
          inputUrl,
          status: "error",
          reason: "都道府県を取得できませんでした",
        });
        continue;
      }

      const insertPayload: Record<string, unknown> = {
        name,
        slug,
        prefecture,
        area: apply.area ?? null,
        genre,
        address: apply.address ?? null,
        postal_code: apply.postal_code ?? null,
        phone: apply.phone ?? null,
        opening_hours: apply.opening_hours ?? null,
        closed_days: apply.closed_days ?? null,
        lat: apply.lat ?? null,
        lng: apply.lng ?? null,
        price_min: apply.price_min ?? null,
        price_max: apply.price_max ?? null,
        price_range: apply.price_range ?? null,
        tabelog_url: inputUrl,
        official_url: apply.official_url ?? null,
        google_map_url: apply.google_map_url ?? null,
        main_image_url: apply.main_image_url ?? null,
        gallery_image_urls: apply.gallery_image_urls ?? [],
        // デフォルト値 (公開前提でなく下書きに)
        private_room: false,
        vip_available: false,
        business_trip_friendly: false,
        business_dining_score: 4,
        quietness_score: 4,
        conversation_score: 4,
        access_score: 4,
        customer_types: [],
        is_published: false,
      };

      const { data: inserted, error: insErr } = await supabase
        .from("restaurants")
        .insert(insertPayload)
        .select("id, slug")
        .maybeSingle();

      if (insErr || !inserted) {
        results.push({
          inputName,
          inputUrl,
          status: "error",
          reason: insErr?.message ?? "insert に失敗しました",
        });
      } else {
        results.push({
          inputName,
          inputUrl,
          status: "ok",
          slug: inserted.slug,
          id: inserted.id,
        });
      }
    } catch (e) {
      results.push({
        inputName,
        inputUrl,
        status: "error",
        reason: e instanceof Error ? e.message : "不明なエラー",
      });
    }

    await new Promise((r) => setTimeout(r, POLITE_DELAY_MS));
  }

  revalidatePath("/admin/restaurants");
  revalidatePath("/restaurants");
  return { ok: true, results };
}
