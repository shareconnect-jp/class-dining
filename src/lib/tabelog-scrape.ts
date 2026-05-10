/**
 * 食べログの店舗ページから OG メタや構造化データを抽出する。
 * ToS 上の配慮:
 *   - レート制限なし、人手の操作トリガで1ページずつ取得 (大量クロールしない)
 *   - 抽出データはユーザー側 admin の補助 (公開ページに転載しない)
 *   - 取得後も店名・住所等は管理画面で人が編集可能
 */

import { genreSlugToName } from "./types";

export type TabelogScrapeResult = {
  ok: boolean;
  url?: string;
  name?: string;
  area?: string;
  prefecture?: string;
  genre?: string;
  genreSlug?: string;
  description?: string;
  mainImage?: string;
  address?: string;
  rating?: number;
  priceRangeText?: string;
  error?: string;
};

const PREF_MAP: Record<string, string> = {
  hokkaido: "北海道",
  aomori: "青森県",
  iwate: "岩手県",
  miyagi: "宮城県",
  akita: "秋田県",
  yamagata: "山形県",
  fukushima: "福島県",
  ibaraki: "茨城県",
  tochigi: "栃木県",
  gunma: "群馬県",
  saitama: "埼玉県",
  chiba: "千葉県",
  tokyo: "東京都",
  kanagawa: "神奈川県",
  niigata: "新潟県",
  toyama: "富山県",
  ishikawa: "石川県",
  fukui: "福井県",
  yamanashi: "山梨県",
  nagano: "長野県",
  gifu: "岐阜県",
  shizuoka: "静岡県",
  aichi: "愛知県",
  mie: "三重県",
  shiga: "滋賀県",
  kyoto: "京都府",
  osaka: "大阪府",
  hyogo: "兵庫県",
  nara: "奈良県",
  wakayama: "和歌山県",
  tottori: "鳥取県",
  shimane: "島根県",
  okayama: "岡山県",
  hiroshima: "広島県",
  yamaguchi: "山口県",
  tokushima: "徳島県",
  kagawa: "香川県",
  ehime: "愛媛県",
  kochi: "高知県",
  fukuoka: "福岡県",
  saga: "佐賀県",
  nagasaki: "長崎県",
  kumamoto: "熊本県",
  oita: "大分県",
  miyazaki: "宮崎県",
  kagoshima: "鹿児島県",
  okinawa: "沖縄県",
};

// ジャンル名から本サイト genre slug への雑マップ (取れなかった時のヒント用)
const GENRE_KEYWORD_MAP: Array<{ keywords: string[]; slug: string }> = [
  { keywords: ["寿司", "鮨", "すし"], slug: "sushi" },
  { keywords: ["焼肉", "焼き肉", "ホルモン"], slug: "yakiniku" },
  { keywords: ["フレンチ", "フランス料理"], slug: "french" },
  { keywords: ["イタリアン", "イタリア料理"], slug: "italian" },
  { keywords: ["ピザ", "ピッツァ"], slug: "pizza" },
  { keywords: ["パスタ"], slug: "pasta" },
  { keywords: ["居酒屋"], slug: "izakaya" },
  { keywords: ["バー", "Bar", "ラウンジ"], slug: "bar" },
  { keywords: ["鉄板焼", "鉄板"], slug: "teppanyaki" },
  { keywords: ["焼鳥", "焼き鳥"], slug: "yakitori" },
  { keywords: ["串揚げ", "串カツ"], slug: "kushiage" },
  {
    keywords: ["懐石", "割烹", "和食", "日本料理", "京料理"],
    slug: "washoku",
  },
];

function inferGenreSlug(text: string | undefined): string | undefined {
  if (!text) return undefined;
  for (const { keywords, slug } of GENRE_KEYWORD_MAP) {
    if (keywords.some((k) => text.includes(k))) return slug;
  }
  return undefined;
}

function extractMeta(html: string, prop: string): string | undefined {
  // og:xx 系メタタグ
  const m1 = new RegExp(
    `<meta[^>]*property=["']${prop}["'][^>]*content=["']([^"']+)["']`,
  ).exec(html);
  if (m1) return decodeHtmlEntities(m1[1]);
  // 順序逆
  const m2 = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${prop}["']`,
  ).exec(html);
  if (m2) return decodeHtmlEntities(m2[1]);
  return undefined;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parsePathInfo(url: string): { prefecture?: string } {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("tabelog.com")) return {};
    const seg = u.pathname.split("/").filter(Boolean);
    if (seg.length < 1) return {};
    const prefSlug = seg[0].toLowerCase();
    const prefecture = PREF_MAP[prefSlug];
    return { prefecture };
  } catch {
    return {};
  }
}

export async function scrapeTabelog(
  inputUrl: string,
): Promise<TabelogScrapeResult> {
  const url = inputUrl.trim();
  if (!url) return { ok: false, error: "URL が空です" };

  if (!/^https?:\/\/(s\.)?tabelog\.com\//.test(url)) {
    return { ok: false, error: "tabelog.com のURLではありません" };
  }

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ja-JP,ja;q=0.9",
      },
      cache: "no-store",
    });
  } catch (e) {
    return {
      ok: false,
      error: `取得失敗: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }

  if (!res.ok) {
    return { ok: false, error: `HTTP ${res.status}` };
  }

  const html = await res.text();

  // og:title 例: "鮨 さいとう (麻布十番/寿司) - 食べログ"
  const ogTitle = extractMeta(html, "og:title");
  let name: string | undefined;
  let area: string | undefined;
  let genre: string | undefined;
  if (ogTitle) {
    const m = ogTitle.match(/^(.+?)\s*\(([^/]+)\/([^)]+)\)/);
    if (m) {
      name = m[1].trim();
      area = m[2].trim();
      genre = m[3].trim();
    } else {
      // フォールバック: " - 食べログ" を除去
      name = ogTitle.replace(/\s*-\s*食べログ.*$/, "").trim();
    }
  }

  const ogDesc = extractMeta(html, "og:description");
  const ogImage = extractMeta(html, "og:image");

  // 住所 (構造化データ or meta)
  let address: string | undefined;
  const jsonLdMatch = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/,
  );
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1].trim());
      const arr = Array.isArray(data) ? data : [data];
      for (const item of arr) {
        if (item?.address?.streetAddress) {
          address =
            (item.address.addressRegion ?? "") +
            (item.address.addressLocality ?? "") +
            item.address.streetAddress;
          break;
        }
        if (typeof item?.address === "string") {
          address = item.address;
          break;
        }
      }
    } catch {
      // ignore
    }
  }

  // 評価 (rdheader-rating__score-val 等のクラスから抽出)
  let rating: number | undefined;
  const ratingMatch = html.match(
    /rdheader-rating__score-val[^>]*>\s*<span[^>]*>(\d+\.\d+)<\/span>/,
  );
  if (ratingMatch) rating = parseFloat(ratingMatch[1]);

  const { prefecture } = parsePathInfo(url);

  const genreSlug = inferGenreSlug(genre) ?? inferGenreSlug(ogDesc);
  // genre 表示名 (slug あればそちらを優先)
  const genreDisplay = genreSlug ? genreSlugToName(genreSlug) : genre;

  return {
    ok: true,
    url,
    name,
    area,
    prefecture,
    genre: genreDisplay,
    genreSlug,
    description: ogDesc,
    mainImage: ogImage,
    address,
    rating,
  };
}
