import type { Restaurant } from "./types";

/**
 * 店舗詳細(食べログ)へのリンクURLを構築する。
 *
 * - 個別店舗ページの URL が DB に保存済み → そのURLを直接返す
 * - そうでない (一覧URL or Google URL or 未設定) → 内部ルート `/go/r/[slug]` を返す
 *
 * 内部ルートでは server-side で Google を経由して実URLを取得 → DBキャッシュ → リダイレクトする。
 * 2回目以降のクリックは DB に保存済みの実URLが返るため即座に飛ぶ。
 */
export function buildTabelogVisitUrl(r: Restaurant): string | null {
  const url = r.tabelog_url?.trim();
  if (
    url &&
    !url.includes("/rstLst/") &&
    !url.includes("/rstsearch") &&
    !url.includes("google.com")
  ) {
    return url;
  }

  if (!r.slug) return url || null;
  return `/go/r/${r.slug}`;
}
