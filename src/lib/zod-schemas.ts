import { z } from "zod";

const optionalNumber = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    schema.optional(),
  );

export const restaurantFormSchema = z.object({
  name: z.string().min(1, "店名は必須です"),
  slug: z
    .string()
    .min(1, "slugは必須です")
    .regex(/^[a-z0-9-]+$/, "英小文字・数字・ハイフンのみ"),
  prefecture: z.string().min(1, "都道府県は必須です"),
  area: z.string().optional().or(z.literal("")),
  genre: z.string().min(1, "ジャンルは必須です"),
  description: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  postal_code: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  opening_hours: z.string().optional().or(z.literal("")),
  closed_days: z.string().optional().or(z.literal("")),
  lat: optionalNumber(z.coerce.number().min(-90).max(90)),
  lng: optionalNumber(z.coerce.number().min(-180).max(180)),
  price_min: optionalNumber(z.coerce.number().int().min(0)),
  price_max: optionalNumber(z.coerce.number().int().min(0)),
  price_range: z.string().optional().or(z.literal("")),
  tabelog_url: z.string().url().optional().or(z.literal("")),
  official_url: z.string().url().optional().or(z.literal("")),
  google_map_url: z.string().url().optional().or(z.literal("")),
  instagram_url: z.string().url().optional().or(z.literal("")),
  x_url: z.string().url().optional().or(z.literal("")),
  tiktok_url: z.string().url().optional().or(z.literal("")),
  line_url: z.string().url().optional().or(z.literal("")),
  main_image_url: z.string().url().optional().or(z.literal("")),
  gallery_image_urls: z.array(z.string().url()).default([]),
  private_room: z.boolean().default(false),
  vip_available: z.boolean().default(false),
  business_trip_friendly: z.boolean().default(false),
  business_dining_score: z.coerce.number().int().min(1).max(5).default(3),
  quietness_score: z.coerce.number().int().min(1).max(5).default(3),
  conversation_score: z.coerce.number().int().min(1).max(5).default(3),
  access_score: z.coerce.number().int().min(1).max(5).default(3),
  customer_types: z.array(z.string()).default([]),
  is_published: z.boolean().default(false),
});

export type RestaurantFormValues = z.infer<typeof restaurantFormSchema>;

export const featureFormSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  slug: z
    .string()
    .min(1, "slugは必須です")
    .regex(/^[a-z0-9-]+$/, "英小文字・数字・ハイフンのみ"),
  subtitle: z.string().optional().or(z.literal("")),
  hero_image_url: z.string().url().optional().or(z.literal("")),
  body_md: z.string().optional().or(z.literal("")),
  restaurant_ids: z.array(z.string().uuid()).default([]),
  is_published: z.boolean().default(false),
});

export type FeatureFormValues = z.infer<typeof featureFormSchema>;
