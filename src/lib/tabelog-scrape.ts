/**
 * 食べログの店舗ページから OG メタ・構造化データ・店舗情報テーブルを抽出。
 * ToS 配慮: レート制限なし、人手の操作トリガで1ページずつ取得。
 */

import { genreSlugToName } from "./types";

export type TabelogScrapeResult = {
  ok: boolean;
  url?: string;
  // 基本
  name?: string;
  area?: string;
  prefecture?: string;
  genre?: string;
  genreSlug?: string;
  description?: string;
  mainImage?: string;
  galleryImages?: string[];
  address?: string;
  rating?: number;
  ratingCount?: number;
  // 店舗情報テーブル
  phone?: string;
  openingHours?: string;
  closedDays?: string;
  seats?: string;
  privateRoom?: boolean;
  smoking?: string;
  cardsAccepted?: string;
  parking?: string;
  accessText?: string;
  dinnerBudget?: string;
  lunchBudget?: string;
  // 推定
  priceMin?: number;
  priceMax?: number;
  error?: string;
};

const PREF_MAP: Record<string, string> = {
  hokkaido: "北海道", aomori: "青森県", iwate: "岩手県", miyagi: "宮城県",
  akita: "秋田県", yamagata: "山形県", fukushima: "福島県", ibaraki: "茨城県",
  tochigi: "栃木県", gunma: "群馬県", saitama: "埼玉県", chiba: "千葉県",
  tokyo: "東京都", kanagawa: "神奈川県", niigata: "新潟県", toyama: "富山県",
  ishikawa: "石川県", fukui: "福井県", yamanashi: "山梨県", nagano: "長野県",
  gifu: "岐阜県", shizuoka: "静岡県", aichi: "愛知県", mie: "三重県",
  shiga: "滋賀県", kyoto: "京都府", osaka: "大阪府", hyogo: "兵庫県",
  nara: "奈良県", wakayama: "和歌山県", tottori: "鳥取県", shimane: "島根県",
  okayama: "岡山県", hiroshima: "広島県", yamaguchi: "山口県", tokushima: "徳島県",
  kagawa: "香川県", ehime: "愛媛県", kochi: "高知県", fukuoka: "福岡県",
  saga: "佐賀県", nagasaki: "長崎県", kumamoto: "熊本県", oita: "大分県",
  miyazaki: "宮崎県", kagoshima: "鹿児島県", okinawa: "沖縄県",
};

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
  { keywords: ["懐石", "割烹", "和食", "日本料理", "京料理"], slug: "washoku" },
];

function inferGenreSlug(text: string | undefined): string | undefined {
  if (!text) return undefined;
  for (const { keywords, slug } of GENRE_KEYWORD_MAP) {
    if (keywords.some((k) => text.includes(k))) return slug;
  }
  return undefined;
}

function extractMeta(html: string, prop: string): string | undefined {
  const m1 = new RegExp(
    `<meta[^>]*property=["']${prop}["'][^>]*content=["']([^"']+)["']`,
  ).exec(html);
  if (m1) return decodeHtmlEntities(m1[1]);
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

function cleanHtml(s: string): string {
  return decodeHtmlEntities(
    s
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/[ \t]*\n[ \t]*/g, "\n")
      .replace(/\n{2,}/g, "\n")
      .trim(),
  );
}

/**
 * Tabelog 店舗情報テーブル <th>ラベル</th><td>値</td> を抽出。
 * th の中に <a> がある場合と無い場合の両方をハンドル。
 */
function extractTableValue(html: string, label: string): string | undefined {
  // パターン1: <th>...ラベル...</th><td>...</td>
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `<th[^>]*>(?:[\\s\\S]*?)${escaped}(?:[\\s\\S]*?)</th>\\s*<td[^>]*>([\\s\\S]*?)</td>`,
    "i",
  );
  const m = re.exec(html);
  if (!m) return undefined;
  const cleaned = cleanHtml(m[1]);
  return cleaned || undefined;
}

function parsePathInfo(url: string): { prefecture?: string } {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("tabelog.com")) return {};
    const seg = u.pathname.split("/").filter(Boolean);
    if (seg.length < 1) return {};
    const prefSlug = seg[0].toLowerCase();
    return { prefecture: PREF_MAP[prefSlug] };
  } catch {
    return {};
  }
}

/** 「¥30,000〜¥50,000」「30000〜50000」等から min/max 数値を抽出 */
function parseBudget(text: string | undefined): {
  min?: number;
  max?: number;
} {
  if (!text) return {};
  const nums = text
    .replace(/[¥￥,，円]/g, "")
    .match(/\d+/g);
  if (!nums || nums.length === 0) return {};
  const parsed = nums.map((n) => parseInt(n, 10)).filter((n) => n > 0);
  if (parsed.length === 0) return {};
  if (parsed.length === 1) return { min: parsed[0] };
  return { min: parsed[0], max: parsed[parsed.length - 1] };
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

  // ===== OG メタ =====
  const ogTitle = extractMeta(html, "og:title");
  let name: string | undefined;
  let area: string | undefined;
  let genre: string | undefined;
  if (ogTitle) {
    const m = ogTitle.match(/^(.+?)\s*[((]\s*([^/]+)\s*\/\s*([^)]+?)\s*[))]/);
    if (m) {
      name = m[1].trim();
      area = m[2].trim();
      genre = m[3].trim();
    } else {
      name = ogTitle.replace(/\s*-\s*食べログ.*$/, "").trim();
    }
  }

  const ogDesc = extractMeta(html, "og:description");
  const ogImage = extractMeta(html, "og:image");

  // ===== JSON-LD 構造化データ =====
  let address: string | undefined;
  let rating: number | undefined;
  let ratingCount: number | undefined;
  const jsonLdMatches = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g,
  );
  for (const ldMatch of jsonLdMatches) {
    try {
      const data = JSON.parse(ldMatch[1].trim());
      const arr = Array.isArray(data) ? data : [data];
      for (const item of arr) {
        if (!address && item?.address) {
          if (typeof item.address === "string") {
            address = item.address;
          } else if (item.address.streetAddress) {
            address =
              (item.address.addressRegion ?? "") +
              (item.address.addressLocality ?? "") +
              item.address.streetAddress;
          }
        }
        if (!rating && item?.aggregateRating?.ratingValue) {
          rating = parseFloat(item.aggregateRating.ratingValue);
        }
        if (!ratingCount && item?.aggregateRating?.reviewCount) {
          ratingCount = parseInt(item.aggregateRating.reviewCount, 10);
        }
      }
    } catch {
      // ignore
    }
  }

  // 評価の HTML 抽出 fallback
  if (!rating) {
    const ratingMatch = html.match(
      /rdheader-rating__score-val[^>]*>\s*<span[^>]*>(\d+\.\d+)<\/span>/,
    );
    if (ratingMatch) rating = parseFloat(ratingMatch[1]);
  }
  if (!ratingCount) {
    const reviewMatch = html.match(/口コミ\s*<em[^>]*>(\d+)<\/em>/);
    if (reviewMatch) ratingCount = parseInt(reviewMatch[1], 10);
  }

  // ===== 店舗情報テーブル =====
  const phoneMatch = html.match(/href=["']tel:([\d\-+]+)["']/);
  let phone = phoneMatch?.[1];

  const phoneFromTable = extractTableValue(html, "電話番号");
  if (!phone && phoneFromTable) {
    const m = phoneFromTable.match(/[\d\-+()]+/);
    phone = m?.[0];
  }

  // 住所 fallback
  if (!address) {
    address = extractTableValue(html, "住所");
  }

  const openingHours =
    extractTableValue(html, "営業時間") ?? undefined;
  const closedDays =
    extractTableValue(html, "定休日") ?? undefined;

  // 予算: 別ラベルで取れる場合と統合の場合
  let dinnerBudget = extractTableValue(html, "予算（夜）");
  let lunchBudget = extractTableValue(html, "予算（昼）");
  if (!dinnerBudget && !lunchBudget) {
    const both = extractTableValue(html, "予算");
    if (both) {
      // "¥30,000〜¥50,000 / ¥10,000〜¥15,000" 等の表記分岐
      const parts = both.split(/[\/／]/);
      dinnerBudget = parts[0]?.trim();
      lunchBudget = parts[1]?.trim();
    }
  }

  const seats = extractTableValue(html, "席数") ?? undefined;
  const privateRoomText = extractTableValue(html, "個室");
  const privateRoom = privateRoomText
    ? /有|あり|完全個室/.test(privateRoomText)
    : undefined;

  const smoking =
    extractTableValue(html, "禁煙・喫煙") ??
    extractTableValue(html, "喫煙") ??
    undefined;
  const cardsAccepted =
    extractTableValue(html, "カード") ??
    extractTableValue(html, "クレジットカード") ??
    undefined;
  const parking = extractTableValue(html, "駐車場") ?? undefined;
  const accessText =
    extractTableValue(html, "交通手段") ??
    extractTableValue(html, "アクセス") ??
    undefined;

  // ===== 写真ギャラリー =====
  // 1) 店舗トップページの tblg.k-img.com 画像
  // 2) /dtlphotolst/ (写真一覧) からも追加で取得 (もりもり化)
  // 3) より高解像度版があるなら (150x150 → 600x600) URL を昇格
  const allImages = html.match(
    /https:\/\/tblg\.k-img\.com\/[^"'\s)<>]+\.(?:jpg|jpeg|png|webp)/gi,
  );
  let galleryImages: string[] = [];
  if (allImages) {
    galleryImages = [...new Set(allImages)].filter((u) => u !== ogImage);
  }

  // /dtlphotolst/ も取りに行く (二段fetch、最大限の写真集約)
  const photoListUrl = (() => {
    const m = url.match(
      /^(https:\/\/(?:s\.)?tabelog\.com\/[a-z]+\/A\d{4}\/A\d{6}\/\d+)\/?/,
    );
    return m ? `${m[1]}/dtlphotolst/` : null;
  })();
  if (photoListUrl) {
    try {
      const photoRes = await fetch(photoListUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "ja-JP,ja;q=0.9",
        },
        cache: "no-store",
      });
      if (photoRes.ok) {
        const photoHtml = await photoRes.text();
        const photoMatches = photoHtml.match(
          /https:\/\/tblg\.k-img\.com\/[^"'\s)<>]+\.(?:jpg|jpeg|png|webp)/gi,
        );
        if (photoMatches) {
          const more = [...new Set(photoMatches)].filter(
            (u) => u !== ogImage && !galleryImages.includes(u),
          );
          galleryImages = [...galleryImages, ...more];
        }
      }
    } catch {
      // ignore — トップページの分だけで進める
    }
  }

  // サムネイルサイズを高解像度に昇格 (150x150 → 600x600 等)
  // Tabelog の URL フォーマット: /150x150_square_xxxxxx.jpg
  galleryImages = galleryImages.map((u) =>
    u.replace(
      /\/(\d+)x(\d+)_(square|rect)_/g,
      (match, w, h, kind) => {
        const wn = parseInt(w, 10);
        if (wn < 480) return `/480x480_${kind}_`;
        return match;
      },
    ),
  );

  // 重複除去 (高解像度化で同じURLになる可能性)
  galleryImages = [...new Set(galleryImages)].slice(0, 36); // 最大36枚

  const { prefecture } = parsePathInfo(url);

  const genreSlug =
    inferGenreSlug(genre) ??
    inferGenreSlug(ogDesc) ??
    inferGenreSlug(ogTitle);
  const genreDisplay = genreSlug ? genreSlugToName(genreSlug) : genre;

  // 予算の数値化 (dinnerを優先)
  const dinnerNums = parseBudget(dinnerBudget);
  const lunchNums = parseBudget(lunchBudget);
  const priceMin =
    dinnerNums.min ?? lunchNums.min ?? undefined;
  const priceMax =
    dinnerNums.max ?? lunchNums.max ?? dinnerNums.min ?? undefined;

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
    galleryImages,
    address,
    rating,
    ratingCount,
    phone,
    openingHours,
    closedDays,
    seats,
    privateRoom,
    smoking,
    cardsAccepted,
    parking,
    accessText,
    dinnerBudget,
    lunchBudget,
    priceMin,
    priceMax,
  };
}
