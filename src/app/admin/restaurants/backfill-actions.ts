"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  scrapeRestaurantUrl,
  toFormApply,
} from "@/lib/restaurant-scrape";

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export type BackfillResult = {
  id: string;
  name: string;
  status: "ok" | "skipped" | "no_photos" | "error";
  added: number;
  reason?: string;
};

const MIN_PHOTOS = 5;
const POLITE_DELAY_MS = 250;

/**
 * 既存店舗の gallery_image_urls を URL から自動取得して埋める。
 * 5 枚以上ある店舗はスキップ。tabelog_url > google_map_url の優先順で
 * 1 ソースだけ叩く (1 店舗あたり外部リクエストを抑えるため)。
 */
export async function backfillAllGalleries(): Promise<
  | { ok: true; results: BackfillResult[] }
  | { ok: false; error: string }
> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase が未設定です" };
  }
  const supabase = await createSupabaseServerClient();
  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, tabelog_url, google_map_url, gallery_image_urls")
    .order("created_at", { ascending: true });
  if (error) return { ok: false, error: error.message };

  const results: BackfillResult[] = [];
  for (const r of restaurants ?? []) {
    const existing = ((r.gallery_image_urls as string[] | null) ?? []).filter(
      (u) => typeof u === "string" && u.length > 0,
    );
    if (existing.length >= MIN_PHOTOS) {
      results.push({
        id: r.id,
        name: r.name,
        status: "skipped",
        added: 0,
        reason: `既に ${existing.length} 枚あります`,
      });
      continue;
    }
    const sourceUrl =
      (r.tabelog_url as string | null) ||
      (r.google_map_url as string | null) ||
      null;
    if (!sourceUrl) {
      results.push({
        id: r.id,
        name: r.name,
        status: "skipped",
        added: 0,
        reason: "tabelog / Google Map URL がありません",
      });
      continue;
    }

    let added = 0;
    try {
      const res = await scrapeRestaurantUrl(sourceUrl);
      if (!res.ok) {
        results.push({
          id: r.id,
          name: r.name,
          status: "error",
          added: 0,
          reason: res.error,
        });
      } else {
        const apply = toFormApply(res, sourceUrl);
        const fetched = apply.gallery_image_urls ?? [];
        if (fetched.length === 0) {
          results.push({
            id: r.id,
            name: r.name,
            status: "no_photos",
            added: 0,
            reason: "URL から写真を取得できませんでした",
          });
        } else {
          const merged = Array.from(new Set([...existing, ...fetched]));
          added = merged.length - existing.length;
          if (added === 0) {
            results.push({
              id: r.id,
              name: r.name,
              status: "no_photos",
              added: 0,
              reason: "取得した写真はすべて既存と重複していました",
            });
          } else {
            const { error: upErr } = await supabase
              .from("restaurants")
              .update({ gallery_image_urls: merged })
              .eq("id", r.id);
            if (upErr) {
              results.push({
                id: r.id,
                name: r.name,
                status: "error",
                added: 0,
                reason: upErr.message,
              });
            } else {
              results.push({
                id: r.id,
                name: r.name,
                status: "ok",
                added,
              });
              if (r.slug) revalidatePath(`/restaurants/${r.slug}`);
            }
          }
        }
      }
    } catch (e) {
      results.push({
        id: r.id,
        name: r.name,
        status: "error",
        added: 0,
        reason: e instanceof Error ? e.message : "不明なエラー",
      });
    }

    // 食べログ等への負荷を避けるため少しウェイト
    await new Promise((resolve) => setTimeout(resolve, POLITE_DELAY_MS));
  }

  revalidatePath("/admin/restaurants");
  revalidatePath("/restaurants");
  return { ok: true, results };
}
