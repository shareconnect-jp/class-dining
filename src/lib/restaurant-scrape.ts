/**
 * 店舗URL → フォーム値 を抽出する統合モジュール。
 *
 * 法務・運用上の注意:
 *   - 食べログのスクレイピングは利用規約上グレーなので、
 *     本機能は内部管理者専用 (admin layout で auth) かつ手動トリガ専用とする。
 *     (= バッチ・大量クロールはしない / 公開ページに転載しない)
 *   - 取得データは「下書き」扱い。保存前に管理者が確認・修正する前提。
 *   - キャッシュは現状実装していないが、過剰アクセスを避けるため
 *     ルートハンドラ側で IP 単位のレート制限 (10 req/min) を適用している。
 *   - Google マップ側は公式 Places API (New) を利用 (HTML スクレイピングはしない)。
 */
import * as cheerio from "cheerio";
import {
  GENRES,
  PREFECTURES,
  type Restaurant,
} from "./types";

export type RestaurantScrapeData = Partial<{
  name: string;
  address: string;
  postal_code: string;
  phone: string;
  category: string;
  genre_slug: string;
  prefecture: string;
  area: string;
  opening_hours: string;
  closed_days: string;
  lat: number;
  lng: number;
  website: string;
  price_range: string;
  price_min: number;
  price_max: number;
  image_url: string;
  rating: number;
  source_url: string;
}>;

export type ScrapeErrorCode =
  | "invalid_url"
  | "fetch_failed"
  | "parse_failed"
  | "config_missing"
  | "rate_limited"
  | "timeout";

export type RestaurantScrapeResult =
  | {
      ok: true;
      source: "tabelog" | "google_maps";
      data: RestaurantScrapeData;
      warnings?: string[];
    }
  | { ok: false; error: string; code: ScrapeErrorCode };

const TIMEOUT_MS = 10_000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const PREF_NAMES = PREFECTURES.map((p) => p.name);

const PREF_SLUG_TO_NAME: Record<string, string> = {
  hokkaido: "北海道", aomori: "青森県", iwate: "岩手県", miyagi: "宮城県",
  akita: "秋田県", yamagata: "山形県", fukushima: "福島県", ibaraki: "茨城県",
  tochigi: "栃木県", gunma: "群馬県", saitama: "埼玉県", chiba: "千葉県",
  tokyo: "東京都", kanagawa: "神奈川県", niigata: "新潟県", toyama: "富山県",
  ishikawa: "石川県", fukui: "福井県", yamanashi: "山梨県", nagano: "長野県",
  gifu: "岐阜県", shizuoka: "静岡県", aichi: "愛知県", mie: "三重県",
  shiga: "滋賀県", kyoto: "京都府", osaka: "大阪府", hyogo: "兵庫県",
  nara: "奈良県", wakayama: "和歌山県", tottori: "鳥取県", shimane: "島根県",
  okayama: "岡山県", hiroshima: "広島県", yamaguchi: "山口県",
  tokushima: "徳島県", kagawa: "香川県", ehime: "愛媛県", kochi: "高知県",
  fukuoka: "福岡県", saga: "佐賀県", nagasaki: "長崎県", kumamoto: "熊本県",
  oita: "大分県", miyazaki: "宮崎県", kagoshima: "鹿児島県", okinawa: "沖縄県",
};

const GENRE_KEYWORD_MAP: Array<{ keywords: string[]; slug: string }> = [
  { keywords: ["寿司", "鮨", "すし", "Sushi"], slug: "sushi" },
  { keywords: ["焼肉", "焼き肉", "ホルモン", "Korean BBQ", "Yakiniku"], slug: "yakiniku" },
  { keywords: ["フレンチ", "フランス料理", "French"], slug: "french" },
  { keywords: ["イタリアン", "イタリア料理", "Italian"], slug: "italian" },
  { keywords: ["ピザ", "ピッツァ", "Pizza"], slug: "pizza" },
  { keywords: ["パスタ", "Pasta"], slug: "pasta" },
  { keywords: ["居酒屋", "Izakaya"], slug: "izakaya" },
  { keywords: ["バー", "Bar", "ラウンジ", "Lounge"], slug: "bar" },
  { keywords: ["鉄板焼", "鉄板", "Teppanyaki"], slug: "teppanyaki" },
  { keywords: ["焼鳥", "焼き鳥", "Yakitori"], slug: "yakitori" },
  { keywords: ["串揚げ", "串カツ", "Kushiage"], slug: "kushiage" },
  {
    keywords: ["懐石", "割烹", "和食", "日本料理", "京料理", "Japanese", "Kaiseki"],
    slug: "washoku",
  },
];

function inferGenreSlug(...texts: Array<string | undefined>): string | undefined {
  for (const text of texts) {
    if (!text) continue;
    for (const { keywords, slug } of GENRE_KEYWORD_MAP) {
      if (keywords.some((k) => text.toLowerCase().includes(k.toLowerCase()))) {
        return slug;
      }
    }
  }
  return undefined;
}

function inferPrefectureFromAddress(address: string | undefined): string | undefined {
  if (!address) return undefined;
  return PREF_NAMES.find((name) => address.startsWith(name));
}

function extractPostalCode(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const m = text.match(/〒?\s*(\d{3}-?\d{4})/);
  if (!m) return undefined;
  const raw = m[1].replace("-", "");
  return `${raw.slice(0, 3)}-${raw.slice(3)}`;
}

function stripPostalFromAddress(address: string): string {
  return address.replace(/〒?\s*\d{3}-?\d{4}\s*/, "").trim();
}

// ============================================================
// URL judge
// ============================================================
export type UrlSource = "tabelog" | "google_maps_long" | "google_maps_short";

export function detectUrlSource(input: string): UrlSource | null {
  let host: string;
  try {
    host = new URL(input).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (host === "tabelog.com" || host.endsWith(".tabelog.com")) return "tabelog";
  if (host === "maps.app.goo.gl" || host === "goo.gl") return "google_maps_short";
  if (host === "google.com" || host.endsWith(".google.com")) {
    // /maps/ 配下のみ許可
    try {
      const u = new URL(input);
      if (u.pathname.startsWith("/maps") || u.pathname.startsWith("/maps/")) {
        return "google_maps_long";
      }
    } catch {
      return null;
    }
  }
  return null;
}

// ============================================================
// fetch wrapper (timeout)
// ============================================================
async function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const { timeoutMs = TIMEOUT_MS, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================
// TABELOG
// ============================================================
type JsonLd = {
  "@type"?: string | string[];
  name?: string;
  telephone?: string;
  address?:
    | string
    | {
        streetAddress?: string;
        addressLocality?: string;
        addressRegion?: string;
        postalCode?: string;
      };
  geo?: { latitude?: number | string; longitude?: number | string };
  url?: string;
  image?: string | string[];
  priceRange?: string;
  openingHours?: string | string[];
  aggregateRating?: { ratingValue?: number | string };
  servesCuisine?: string | string[];
};

function parseJsonLdBlocks($: cheerio.CheerioAPI): JsonLd[] {
  const blocks: JsonLd[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text().trim();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of arr) {
        if (item && typeof item === "object") blocks.push(item as JsonLd);
        if (item && Array.isArray(item["@graph"])) {
          for (const g of item["@graph"]) {
            if (g && typeof g === "object") blocks.push(g as JsonLd);
          }
        }
      }
    } catch {
      // 末尾カンマ等の不正 JSON は無視
    }
  });
  return blocks;
}

function pickRestaurantJsonLd(blocks: JsonLd[]): JsonLd | undefined {
  return (
    blocks.find((b) => {
      const t = b["@type"];
      if (!t) return false;
      if (typeof t === "string") return /restaurant|foodestablishment/i.test(t);
      return t.some((x) => /restaurant|foodestablishment/i.test(x));
    }) ?? blocks.find((b) => Boolean(b.address || b.telephone || b.geo))
  );
}

function tabelogPrefectureFromUrl(url: string): string | undefined {
  try {
    const u = new URL(url);
    const seg = u.pathname.split("/").filter(Boolean);
    const slug = seg[0]?.toLowerCase();
    if (slug && PREF_SLUG_TO_NAME[slug]) return PREF_SLUG_TO_NAME[slug];
  } catch {
    // ignore
  }
  return undefined;
}

function parseTabelogTitle(title: string): {
  name?: string;
  area?: string;
  category?: string;
} {
  // 例: "鮨 さいとう (麻布十番/寿司) - 食べログ"
  const m = title.match(/^(.+?)\s*\(([^/]+)\/([^)]+)\)/);
  if (m) {
    return { name: m[1].trim(), area: m[2].trim(), category: m[3].trim() };
  }
  return { name: title.replace(/\s*-\s*食べログ.*$/, "").trim() };
}

function parsePriceRange(text: string | undefined): {
  price_range?: string;
  price_min?: number;
  price_max?: number;
} {
  if (!text) return {};
  // 例: "￥30,000～￥39,999" / "30000 - 50000 JPY" / "¥¥¥¥"
  const range = text.replace(/[,，]/g, "");
  const m = range.match(/(\d{3,7})\s*[-~〜～]\s*(\d{3,7})/);
  if (m) {
    return {
      price_range: text.trim(),
      price_min: Number(m[1]),
      price_max: Number(m[2]),
    };
  }
  const single = range.match(/(\d{3,7})/);
  if (single) {
    return { price_range: text.trim(), price_min: Number(single[1]) };
  }
  return { price_range: text.trim() };
}

async function scrapeTabelogV2(url: string): Promise<RestaurantScrapeResult> {
  let res: Response;
  try {
    res = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": UA,
        "Accept-Language": "ja-JP,ja;q=0.9",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      cache: "no-store",
      redirect: "follow",
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return { ok: false, code: "timeout", error: "食べログの取得がタイムアウトしました" };
    }
    return {
      ok: false,
      code: "fetch_failed",
      error: `食べログの取得に失敗しました: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      code: "fetch_failed",
      error: `食べログから HTTP ${res.status} が返りました`,
    };
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const data: RestaurantScrapeData = { source_url: url };
  const warnings: string[] = [];

  // ---------- og:* ----------
  const ogTitle = $('meta[property="og:title"]').attr("content") ?? undefined;
  const ogImage = $('meta[property="og:image"]').attr("content") ?? undefined;
  if (ogImage) data.image_url = ogImage;

  if (ogTitle) {
    const parsed = parseTabelogTitle(ogTitle);
    if (parsed.name) data.name = parsed.name;
    if (parsed.area) data.area = parsed.area;
    if (parsed.category) data.category = parsed.category;
  }

  // ---------- JSON-LD (最優先) ----------
  const blocks = parseJsonLdBlocks($);
  const ld = pickRestaurantJsonLd(blocks);
  if (ld) {
    if (ld.name) data.name = data.name ?? ld.name;
    if (ld.telephone) data.phone = String(ld.telephone).trim();
    if (typeof ld.address === "string") {
      data.address = ld.address;
    } else if (ld.address) {
      const a = ld.address;
      const composed = [a.addressRegion, a.addressLocality, a.streetAddress]
        .filter(Boolean)
        .join("");
      if (composed) data.address = composed;
      if (a.postalCode) data.postal_code = a.postalCode;
    }
    if (ld.geo?.latitude && ld.geo?.longitude) {
      const lat = Number(ld.geo.latitude);
      const lng = Number(ld.geo.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        data.lat = lat;
        data.lng = lng;
      }
    }
    if (typeof ld.image === "string") data.image_url = data.image_url ?? ld.image;
    else if (Array.isArray(ld.image) && ld.image[0])
      data.image_url = data.image_url ?? ld.image[0];
    if (ld.priceRange) {
      const parsed = parsePriceRange(ld.priceRange);
      Object.assign(data, parsed);
    }
    if (ld.openingHours) {
      const oh = Array.isArray(ld.openingHours)
        ? ld.openingHours.join(" / ")
        : ld.openingHours;
      data.opening_hours = oh;
    }
    if (ld.aggregateRating?.ratingValue) {
      const r = Number(ld.aggregateRating.ratingValue);
      if (Number.isFinite(r)) data.rating = r;
    }
    if (typeof ld.servesCuisine === "string") {
      data.category = data.category ?? ld.servesCuisine;
    } else if (Array.isArray(ld.servesCuisine) && ld.servesCuisine[0]) {
      data.category = data.category ?? ld.servesCuisine[0];
    }
  }

  // ---------- フォールバック (rdheader / rstinfo-table) ----------
  if (!data.address) {
    const addrText = $("p.rstinfo-table__address, .rstinfo-table__address")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();
    if (addrText) data.address = addrText;
  }
  if (!data.phone) {
    const tel = $('strong.rstinfo-table__tel-num, .rstinfo-table__tel-num, p.rstinfo-table__tel-num')
      .first()
      .text()
      .trim();
    if (tel) data.phone = tel;
  }
  if (!data.opening_hours) {
    const hoursText = $(".rstinfo-table__open-hours-text, p.rstinfo-table__open-hours-text")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();
    if (hoursText) data.opening_hours = hoursText;
  }
  if (!data.rating) {
    const ratingText = $(
      "span.rdheader-rating__score-val-dtl, .rdheader-rating__score-val span",
    )
      .first()
      .text()
      .trim();
    const r = Number(ratingText);
    if (Number.isFinite(r) && r > 0) data.rating = r;
  }

  // ---------- 派生 ----------
  if (data.address) {
    const postal = extractPostalCode(data.address);
    if (postal && !data.postal_code) data.postal_code = postal;
    data.address = stripPostalFromAddress(data.address);
  }
  if (!data.prefecture) {
    data.prefecture =
      tabelogPrefectureFromUrl(url) ?? inferPrefectureFromAddress(data.address);
  }
  if (!data.genre_slug) {
    data.genre_slug = inferGenreSlug(data.category, ogTitle);
  }

  if (!data.name) {
    warnings.push("店名を取得できませんでした");
  }
  if (!data.address) {
    warnings.push("住所を取得できませんでした");
  }

  return { ok: true, source: "tabelog", data, warnings };
}

// ============================================================
// GOOGLE MAPS
// ============================================================

/**
 * Google マップの短縮URL (maps.app.goo.gl) を最終 URL に展開する。
 * 通常 fetch redirect:'follow' で最終 URL が response.url に入る。
 */
async function expandGoogleShortUrl(shortUrl: string): Promise<string> {
  const res = await fetchWithTimeout(shortUrl, {
    method: "GET",
    headers: { "User-Agent": UA },
    redirect: "follow",
    cache: "no-store",
  });
  return res.url || shortUrl;
}

/**
 * /maps/place/<NAME>/@<lat>,<lng>,...,data=...!1s<hex1>:<hex2>!... のような長い URL から
 * - 表示名 (place name)
 * - 緯度経度
 * - FtID (1s<hex>:<hex>) があれば返す
 */
function parseGoogleMapsLongUrl(input: string): {
  name?: string;
  lat?: number;
  lng?: number;
  ftid?: string;
} {
  try {
    const u = new URL(input);
    const segments = u.pathname.split("/").filter(Boolean);
    const placeIdx = segments.indexOf("place");
    let name: string | undefined;
    if (placeIdx !== -1 && segments[placeIdx + 1]) {
      name = decodeURIComponent(segments[placeIdx + 1].replace(/\+/g, " "));
    }

    let lat: number | undefined;
    let lng: number | undefined;
    const atSegment = segments.find((s) => s.startsWith("@"));
    if (atSegment) {
      const m = atSegment.slice(1).match(/(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (m) {
        lat = Number(m[1]);
        lng = Number(m[2]);
      }
    }

    // ftid: 1s0xHEX:0xHEX (fullText のどこかに含まれる)
    let ftid: string | undefined;
    const ftidMatch = input.match(/!1s(0x[0-9a-fA-F]+:0x[0-9a-fA-F]+)/);
    if (ftidMatch) ftid = ftidMatch[1];

    return { name, lat, lng, ftid };
  } catch {
    return {};
  }
}

type PlacesApiResponse = {
  places?: Array<{
    displayName?: { text?: string; languageCode?: string };
    formattedAddress?: string;
    internationalPhoneNumber?: string;
    nationalPhoneNumber?: string;
    location?: { latitude?: number; longitude?: number };
    regularOpeningHours?: {
      weekdayDescriptions?: string[];
    };
    websiteUri?: string;
    priceLevel?: string;
    types?: string[];
    photos?: Array<{ name?: string }>;
    addressComponents?: Array<{
      longText?: string;
      shortText?: string;
      types?: string[];
    }>;
  }>;
};

async function callPlacesSearchText(
  apiKey: string,
  textQuery: string,
  locationBias?: { lat: number; lng: number },
): Promise<PlacesApiResponse> {
  const body: Record<string, unknown> = {
    textQuery,
    languageCode: "ja",
    regionCode: "JP",
    maxResultCount: 1,
  };
  if (locationBias) {
    body.locationBias = {
      circle: {
        center: {
          latitude: locationBias.lat,
          longitude: locationBias.lng,
        },
        radius: 500,
      },
    };
  }

  const res = await fetchWithTimeout(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": [
          "places.displayName",
          "places.formattedAddress",
          "places.addressComponents",
          "places.internationalPhoneNumber",
          "places.nationalPhoneNumber",
          "places.location",
          "places.regularOpeningHours",
          "places.websiteUri",
          "places.priceLevel",
          "places.types",
          "places.photos",
        ].join(","),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error(`Places API HTTP ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as PlacesApiResponse;
}

async function fetchPhotoUri(
  apiKey: string,
  photoName: string,
): Promise<string | undefined> {
  // photoName 例: "places/PLACE_ID/photos/PHOTO_ID"
  // mediaUri を取るだけなら skipHttpRedirect=true で JSON を受ける。
  try {
    const res = await fetchWithTimeout(
      `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1600&skipHttpRedirect=true&key=${apiKey}`,
      { cache: "no-store" },
    );
    if (!res.ok) return undefined;
    const json = (await res.json()) as { photoUri?: string };
    return json.photoUri ?? undefined;
  } catch {
    return undefined;
  }
}

const GOOGLE_PRICE_LEVEL: Record<string, string> = {
  PRICE_LEVEL_FREE: "無料",
  PRICE_LEVEL_INEXPENSIVE: "¥",
  PRICE_LEVEL_MODERATE: "¥¥",
  PRICE_LEVEL_EXPENSIVE: "¥¥¥",
  PRICE_LEVEL_VERY_EXPENSIVE: "¥¥¥¥",
};

async function scrapeGoogleMaps(
  inputUrl: string,
  source: UrlSource,
): Promise<RestaurantScrapeResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      code: "config_missing",
      error:
        "GOOGLE_MAPS_API_KEY が未設定です。Vercel または .env.local に設定してください。",
    };
  }

  // 短縮URLは展開してから処理
  let url = inputUrl;
  if (source === "google_maps_short") {
    try {
      url = await expandGoogleShortUrl(inputUrl);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        return {
          ok: false,
          code: "timeout",
          error: "短縮URLの展開がタイムアウトしました",
        };
      }
      return {
        ok: false,
        code: "fetch_failed",
        error: `短縮URLの展開に失敗しました: ${e instanceof Error ? e.message : "unknown"}`,
      };
    }
  }

  const parsed = parseGoogleMapsLongUrl(url);
  const query = parsed.name?.trim();
  if (!query) {
    return {
      ok: false,
      code: "parse_failed",
      error: "Google マップ URL から店舗名を抽出できませんでした",
    };
  }

  let api: PlacesApiResponse;
  try {
    api = await callPlacesSearchText(
      apiKey,
      query,
      parsed.lat && parsed.lng ? { lat: parsed.lat, lng: parsed.lng } : undefined,
    );
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return {
        ok: false,
        code: "timeout",
        error: "Places API の応答がタイムアウトしました",
      };
    }
    return {
      ok: false,
      code: "fetch_failed",
      error: `Places API の呼び出しに失敗しました: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }

  const place = api.places?.[0];
  if (!place) {
    return {
      ok: false,
      code: "parse_failed",
      error: "Google Places で該当の店舗が見つかりませんでした",
    };
  }

  const data: RestaurantScrapeData = { source_url: url };
  const warnings: string[] = [];

  if (place.displayName?.text) data.name = place.displayName.text;
  if (place.formattedAddress) {
    const postal = extractPostalCode(place.formattedAddress);
    if (postal) data.postal_code = postal;
    data.address = stripPostalFromAddress(place.formattedAddress)
      // "日本、〒…" のような前置詞を削除
      .replace(/^日本、?\s*/, "")
      .trim();
  }
  if (place.internationalPhoneNumber || place.nationalPhoneNumber) {
    data.phone = place.nationalPhoneNumber ?? place.internationalPhoneNumber;
  }
  if (place.location?.latitude != null && place.location?.longitude != null) {
    data.lat = place.location.latitude;
    data.lng = place.location.longitude;
  } else if (parsed.lat && parsed.lng) {
    data.lat = parsed.lat;
    data.lng = parsed.lng;
  }
  if (place.regularOpeningHours?.weekdayDescriptions?.length) {
    data.opening_hours = place.regularOpeningHours.weekdayDescriptions.join("\n");
  }
  if (place.websiteUri) data.website = place.websiteUri;
  if (place.priceLevel) {
    data.price_range = GOOGLE_PRICE_LEVEL[place.priceLevel] ?? place.priceLevel;
  }

  // 都道府県・市区
  if (place.addressComponents?.length) {
    const region = place.addressComponents.find((c) =>
      c.types?.includes("administrative_area_level_1"),
    );
    const locality = place.addressComponents.find((c) =>
      c.types?.includes("locality"),
    );
    if (region?.longText) data.prefecture = region.longText;
    if (locality?.longText) data.area = locality.longText;
  }
  if (!data.prefecture) {
    data.prefecture = inferPrefectureFromAddress(data.address);
  }

  // ジャンル推定
  const cuisineTypes = (place.types ?? [])
    .filter((t) => /restaurant|food|bar|cafe/i.test(t))
    .join(" ");
  data.category = cuisineTypes || data.category;
  data.genre_slug = inferGenreSlug(cuisineTypes, place.displayName?.text);

  // 画像 URL は Photo media を 1 枚だけ展開
  if (place.photos?.[0]?.name) {
    const photoUri = await fetchPhotoUri(apiKey, place.photos[0].name);
    if (photoUri) data.image_url = photoUri;
  }

  if (!data.name) warnings.push("Places から店舗名を取得できませんでした");
  if (!data.address) warnings.push("住所を取得できませんでした");

  return { ok: true, source: "google_maps", data, warnings };
}

// ============================================================
// Public entrypoint
// ============================================================
export async function scrapeRestaurantUrl(
  rawUrl: string,
): Promise<RestaurantScrapeResult> {
  const url = rawUrl.trim();
  if (!url) {
    return { ok: false, code: "invalid_url", error: "URL が空です" };
  }
  const source = detectUrlSource(url);
  if (!source) {
    return {
      ok: false,
      code: "invalid_url",
      error:
        "対応していない URL です。食べログ または Google マップの店舗 URL を入力してください",
    };
  }

  if (source === "tabelog") return scrapeTabelogV2(url);
  return scrapeGoogleMaps(url, source);
}

// ============================================================
// 既存フォーム値への整形ヘルパ
// ============================================================
export type RestaurantFormApply = Partial<
  Pick<
    Restaurant,
    | "name"
    | "address"
    | "prefecture"
    | "area"
    | "genre"
    | "main_image_url"
    | "official_url"
    | "tabelog_url"
    | "google_map_url"
    | "price_min"
    | "price_max"
  >
> & {
  postal_code?: string;
  phone?: string;
  opening_hours?: string;
  closed_days?: string;
  lat?: number;
  lng?: number;
  price_range?: string;
};

/**
 * scrape 結果 + 入力URLから、フォームに反映可能な値に整形する。
 * 既存のフィールド名 (RestaurantForm が name 属性で持つもの) と一致させる。
 */
export function toFormApply(
  result: Extract<RestaurantScrapeResult, { ok: true }>,
  inputUrl: string,
): RestaurantFormApply {
  const d = result.data;
  const apply: RestaurantFormApply = {};
  if (d.name) apply.name = d.name;
  if (d.address) apply.address = d.address;
  if (d.prefecture) apply.prefecture = d.prefecture;
  if (d.area) apply.area = d.area;
  if (d.genre_slug && GENRES.some((g) => g.slug === d.genre_slug)) {
    apply.genre = d.genre_slug;
  }
  if (d.image_url) apply.main_image_url = d.image_url;
  if (d.website) apply.official_url = d.website;
  if (d.price_min) apply.price_min = d.price_min;
  if (d.price_max) apply.price_max = d.price_max;
  if (d.postal_code) apply.postal_code = d.postal_code;
  if (d.phone) apply.phone = d.phone;
  if (d.opening_hours) apply.opening_hours = d.opening_hours;
  if (d.lat != null) apply.lat = d.lat;
  if (d.lng != null) apply.lng = d.lng;
  if (d.price_range) apply.price_range = d.price_range;

  if (result.source === "tabelog") apply.tabelog_url = inputUrl;
  if (result.source === "google_maps") apply.google_map_url = inputUrl;
  return apply;
}
