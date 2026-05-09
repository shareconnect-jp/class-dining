import type { Restaurant } from "./types";

/**
 * 店舗の「食べログ詳細」リンク用URLを構築する。
 *
 * - tabelog_url が個別店舗ページらしい (rstLst/rstsearch を含まない) → そのまま使う
 * - 含む or 未設定 → 店名 + エリアで食べログ内検索URLに変換
 *
 * 検索エンドポイントは `/rstLst/?sw=KEYWORD` (食べログ TOP の検索フォーム送信先)。
 * `/rst/rstsearch/` 経由は内部リダイレクトで sw パラメータが落ちるので使わない。
 */
export function buildTabelogVisitUrl(r: Restaurant): string | null {
  const url = r.tabelog_url?.trim();
  if (
    url &&
    !url.includes("/rstLst/") &&
    !url.includes("/rstsearch")
  ) {
    return url;
  }

  const queryParts = [r.name, r.area].filter(Boolean);
  if (queryParts.length === 0) return url || null;

  const keyword = queryParts.join(" ");
  const q = encodeURIComponent(keyword);
  // sw + sk 両方に同じキーワード、sa は空でも形式上必要
  return `https://tabelog.com/rstLst/?sa=&sk=${q}&sw=${q}`;
}
