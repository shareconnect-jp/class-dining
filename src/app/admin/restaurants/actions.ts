"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { restaurantFormSchema } from "@/lib/zod-schemas";

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function createRestaurant(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return {
      ok: false as const,
      error: "Supabase が未設定です。.env.local を設定してください。",
    };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = restaurantFormSchema.safeParse({
    ...raw,
    private_room: raw.private_room === "on",
    vip_available: raw.vip_available === "on",
    business_trip_friendly: raw.business_trip_friendly === "on",
    is_published: raw.is_published === "on",
    customer_types:
      typeof raw.customer_types === "string" && raw.customer_types
        ? (raw.customer_types as string)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues.map((i) => i.message).join(" / "),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("restaurants")
    .insert(parsed.data);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/admin/restaurants");
  revalidatePath("/restaurants");
  redirect("/admin/restaurants");
}

export async function updateRestaurant(id: string, formData: FormData) {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, error: "Supabase が未設定です。" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = restaurantFormSchema.safeParse({
    ...raw,
    private_room: raw.private_room === "on",
    vip_available: raw.vip_available === "on",
    business_trip_friendly: raw.business_trip_friendly === "on",
    is_published: raw.is_published === "on",
    customer_types:
      typeof raw.customer_types === "string" && raw.customer_types
        ? (raw.customer_types as string)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues.map((i) => i.message).join(" / "),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("restaurants")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/admin/restaurants");
  revalidatePath(`/restaurants/${parsed.data.slug}`);
  revalidatePath("/restaurants");
  redirect("/admin/restaurants");
}

export async function deleteRestaurant(id: string) {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, error: "Supabase が未設定です。" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("restaurants").delete().eq("id", id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/admin/restaurants");
  revalidatePath("/restaurants");
  redirect("/admin/restaurants");
}
