import type { Restaurant } from "./types";

/**
 * 店舗情報ページへの導線URLを構築する。
 *
 * - tabelog_url が個別店舗ページらしい (検索系URLではない specific URL) → そのまま使う
 * - 含む or 未設定 → 「店名 食べログ エリア」の Google 検索URLにフォールバック
 *   - Google検索結果のトップに該当店舗の食べログページがほぼ確実に表示される
 *   - 食べログ自身の検索URL (`/rstLst/?sw=`) は内部リダイレクトで挙動が不安定なため使わない
 *
 * 関数名は歴史的経緯で残しているが、実態は「店舗情報サーチURL」のフォールバック付きビルダー。
 */
export function buildTabelogVisitUrl(r: Restaurant): string | null {
  const url = r.tabelog_url?.trim();
  if (
    url &&
    !url.includes("/rstLst/") &&
    !url.includes("/rstsearch") &&
    !url.includes("google.com/search")
  ) {
    return url;
  }

  const queryParts = [r.name, "食べログ", r.area].filter(Boolean);
  if (queryParts.length === 0) return url || null;

  // I'm Feeling Lucky: 1番目の検索結果に直接リダイレクト
  // (Tabelog の店舗ページがほぼ確実にトップなのでそのまま到達する)
  const q = encodeURIComponent(queryParts.join(" "));
  return `https://www.google.com/search?q=${q}&btnI=I`;
}
