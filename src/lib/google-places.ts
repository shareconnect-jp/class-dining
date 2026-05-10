/**
 * Google Places API (New) を使った店舗情報取得。
 * Tabelog スクレイプの cross-validate / 補完用。
 *
 * https://developers.google.com/maps/documentation/places/web-service/text-search
 */

export type GooglePlaceResult = {
  ok: boolean;
  placeId?: string;
  name?: string;
  address?: string;
  phone?: string;
  internationalPhone?: string;
  rating?: number;
  ratingCount?: number;
  priceLevel?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  openingHours?: string[];
  photos?: string[]; // 解決済み Photo URL の配列
  error?: string;
};

const ENDPOINT = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.regularOpeningHours",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.photos",
].join(",");

function getKey(): string | null {
  return process.env.GOOGLE_PLACES_API_KEY ?? null;
}

/** Text Search で 1 件目の店舗情報を取得 */
export async function lookupGooglePlace(
  query: string,
): Promise<GooglePlaceResult> {
  const key = getKey();
  if (!key)
    return { ok: false, error: "GOOGLE_PLACES_API_KEY が未設定です" };
  if (!query.trim()) return { ok: false, error: "検索クエリが空です" };

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query.trim(),
        languageCode: "ja",
        regionCode: "JP",
        maxResultCount: 3,
      }),
      cache: "no-store",
    });
  } catch (e) {
    return {
      ok: false,
      error: `fetch失敗: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
  }

  type PlaceResponse = {
    places?: Array<{
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      nationalPhoneNumber?: string;
      internationalPhoneNumber?: string;
      rating?: number;
      userRatingCount?: number;
      priceLevel?: string;
      regularOpeningHours?: { weekdayDescriptions?: string[] };
      websiteUri?: string;
      googleMapsUri?: string;
      photos?: Array<{ name: string; widthPx?: number; heightPx?: number }>;
    }>;
  };
  const data = (await res.json()) as PlaceResponse;
  const place = data.places?.[0];
  if (!place) return { ok: false, error: "該当店舗なし" };

  // Photos: 各 photo.name から実画像URLを並列取得
  let photoUrls: string[] = [];
  if (place.photos && place.photos.length > 0) {
    const photos = place.photos.slice(0, 8); // 最大8枚
    const urls = await Promise.all(
      photos.map(async (p) => {
        try {
          const photoRes = await fetch(
            `https://places.googleapis.com/v1/${p.name}/media?maxHeightPx=1200&skipHttpRedirect=true`,
            {
              headers: { "X-Goog-Api-Key": key },
              cache: "no-store",
            },
          );
          if (!photoRes.ok) return null;
          const j = (await photoRes.json()) as { photoUri?: string };
          return j.photoUri ?? null;
        } catch {
          return null;
        }
      }),
    );
    photoUrls = urls.filter((u): u is string => Boolean(u));
  }

  return {
    ok: true,
    placeId: place.id,
    name: place.displayName?.text,
    address: place.formattedAddress,
    phone: place.nationalPhoneNumber,
    internationalPhone: place.internationalPhoneNumber,
    rating: place.rating,
    ratingCount: place.userRatingCount,
    priceLevel: place.priceLevel,
    websiteUri: place.websiteUri,
    googleMapsUri: place.googleMapsUri,
    openingHours: place.regularOpeningHours?.weekdayDescriptions,
    photos: photoUrls,
  };
}
