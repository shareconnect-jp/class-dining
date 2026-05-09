"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { featureFormSchema } from "@/lib/zod-schemas";

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function parseFormData(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  // restaurant_ids は複数 checkbox で送られる
  const restaurantIds = formData.getAll("restaurant_ids").map(String);
  return featureFormSchema.safeParse({
    ...raw,
    is_published: raw.is_published === "on",
    restaurant_ids: restaurantIds,
  });
}

export async function createFeature(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, error: "Supabase が未設定です。" };
  }

  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues.map((i) => i.message).join(" / "),
    };
  }

  const data = parsed.data;
  const payload = {
    ...data,
    published_at: data.is_published ? new Date().toISOString() : null,
  };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("features").insert(payload);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/admin/features");
  revalidatePath("/features");
  redirect("/admin/features");
}

export async function updateFeature(id: string, formData: FormData) {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, error: "Supabase が未設定です。" };
  }

  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues.map((i) => i.message).join(" / "),
    };
  }

  const data = parsed.data;
  const supabase = await createSupabaseServerClient();

  // 既存レコードの published_at を保持しつつ、is_published が新たに立った時のみ now() を入れる
  const { data: prev } = await supabase
    .from("features")
    .select("is_published, published_at")
    .eq("id", id)
    .maybeSingle();

  let published_at: string | null = prev?.published_at ?? null;
  if (data.is_published && !prev?.is_published) {
    published_at = new Date().toISOString();
  } else if (!data.is_published) {
    published_at = null;
  }

  const { error } = await supabase
    .from("features")
    .update({ ...data, published_at })
    .eq("id", id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/admin/features");
  revalidatePath(`/features/${data.slug}`);
  revalidatePath("/features");
  redirect("/admin/features");
}

export async function deleteFeature(id: string) {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, error: "Supabase が未設定です。" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("features").delete().eq("id", id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/admin/features");
  revalidatePath("/features");
  redirect("/admin/features");
}
