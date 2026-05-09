import type { Restaurant } from "./types";

/**
 * 店舗の「食べログ詳細」リンク用URLを構築する。
 *
 * - tabelog_url が個別店舗ページらしい (`/rstLst/` を含まない) → そのまま使う
 * - 含む or 未設定 → 店名 + エリアで食べログ内検索URLに変換
 *
 * 店名+エリアが食べログの検索ボックスにそのまま渡されるため、
 * 該当店舗が結果トップに来る確率が高い。
 */
export function buildTabelogVisitUrl(r: Restaurant): string | null {
  const url = r.tabelog_url?.trim();
  if (url && !url.includes("/rstLst/")) return url;

  const queryParts = [r.name, r.area, r.prefecture].filter(Boolean);
  if (queryParts.length === 0) return url || null;

  const q = encodeURIComponent(queryParts.join(" "));
  return `https://tabelog.com/rst/rstsearch/?sw=${q}`;
}
