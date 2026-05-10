export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  prefecture: string | null;
  area: string | null;
  genre: string | null;
  description: string | null;
  address: string | null;
  postal_code: string | null;
  phone: string | null;
  opening_hours: string | null;
  closed_days: string | null;
  lat: number | null;
  lng: number | null;
  price_min: number | null;
  price_max: number | null;
  price_range: string | null;
  tabelog_url: string | null;
  official_url: string | null;
  google_map_url: string | null;
  main_image_url: string | null;
  gallery_image_urls: string[];
  private_room: boolean;
  vip_available: boolean;
  business_trip_friendly: boolean;
  business_dining_score: number;
  quietness_score: number;
  conversation_score: number;
  access_score: number;
  customer_types: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type Genre = {
  id: string;
  slug: string;
  name: string;
  display_order: number;
};

export type Feature = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  hero_image_url: string | null;
  body_md: string | null;
  restaurant_ids: string[];
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export const GENRES: Array<{ slug: string; name: string }> = [
  { slug: "sushi", name: "寿司" },
  { slug: "yakiniku", name: "焼肉" },
  { slug: "washoku", name: "和食" },
  { slug: "french", name: "フレンチ" },
  { slug: "italian", name: "イタリアン" },
  { slug: "pizza", name: "ピザ" },
  { slug: "pasta", name: "パスタ" },
  { slug: "izakaya", name: "居酒屋" },
  { slug: "bar", name: "バー" },
  { slug: "teppanyaki", name: "鉄板焼き" },
  { slug: "yakitori", name: "焼鳥" },
  { slug: "kushiage", name: "串揚げ" },
];

export const PREFECTURES: Array<{ slug: string; name: string }> = [
  { slug: "tokyo", name: "東京都" },
  { slug: "osaka", name: "大阪府" },
  { slug: "aichi", name: "愛知県" },
  { slug: "fukuoka", name: "福岡県" },
  { slug: "kyoto", name: "京都府" },
  { slug: "kanagawa", name: "神奈川県" },
  { slug: "hokkaido", name: "北海道" },
];

export function genreSlugToName(slug: string): string {
  return GENRES.find((g) => g.slug === slug)?.name ?? slug;
}

export function prefectureSlugToName(slug: string): string {
  return PREFECTURES.find((p) => p.slug === slug)?.name ?? slug;
}

export function prefectureNameToSlug(name: string): string {
  return PREFECTURES.find((p) => p.name === name)?.slug ?? "";
}
