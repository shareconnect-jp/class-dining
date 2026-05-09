import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

/**
 * /go/r/[slug] — 食べログ詳細ページへの直接リダイレクト
 *
 * 動作:
 * 1. restaurants から該当店舗を取得
 * 2. tabelog_url が個別店舗 URL ならそれにリダイレクト
 * 3. それ以外なら Google 検索結果から1番目の Tabelog 店舗URLを抽出
 * 4. 抽出成功 → DB に書き戻し (次回以降キャッシュヒット) → そのURLにリダイレクト
 * 5. 失敗 → Google検索ページへフォールバック
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    return NextResponse.redirect("https://www.google.com/", 302);
  }

  const supabase = createSupabaseAdminClient();
  const { data: r, error } = await supabase
    .from("restaurants")
    .select("id, name, area, prefecture, tabelog_url")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !r) {
    return NextResponse.redirect("https://www.google.com/", 302);
  }

  // 既存 URL が個別店舗 URL ならそのまま
  const stored = r.tabelog_url?.trim();
  if (
    stored &&
    !stored.includes("/rstLst/") &&
    !stored.includes("/rstsearch") &&
    !stored.includes("google.com")
  ) {
    return NextResponse.redirect(stored, 302);
  }

  // DuckDuckGo HTML で検索 → 最頻出 Tabelog 店舗URL を抽出
  // (Google は server-side fetch をブロックしてくる、Bing は JP 検索精度が低い)
  const query = [r.name, "食べログ", r.area].filter(Boolean).join(" ");
  let resolvedUrl: string | null = null;

  try {
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "ja-JP,ja;q=0.9",
        },
        cache: "no-store",
      },
    );

    if (res.ok) {
      const html = await res.text();
      // Tabelog 標準店舗URL: /{pref}/A{4}/A{6}/{店舗ID}/
      const matches = html.match(
        /tabelog\.com\/[a-z]+\/A\d{4}\/A\d{6}\/\d+\/?/g,
      );
      if (matches && matches.length > 0) {
        const counts = new Map<string, number>();
        for (const m of matches) {
          const normalized = (m.endsWith("/") ? m : m + "/").replace(
            /^/,
            "https://",
          );
          counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
        }
        // 出現回数最多 → 最有力
        resolvedUrl = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      }
    }
  } catch (e) {
    console.error("[/go/r] search fetch failed", e);
  }

  if (resolvedUrl) {
    // DB キャッシュ (次回は1番目の早期 return で即リダイレクト)
    await supabase
      .from("restaurants")
      .update({ tabelog_url: resolvedUrl })
      .eq("id", r.id);
    return NextResponse.redirect(resolvedUrl, 302);
  }

  // フォールバック: Google検索結果ページ
  return NextResponse.redirect(
    `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    302,
  );
}
