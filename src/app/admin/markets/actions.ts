"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/holdings";

const holdingSchema = z.object({
  account: z.enum(["company", "personal"]),
  symbol: z.string().min(1, "シンボルは必須です").max(40),
  name: z.string().min(1, "銘柄名は必須です").max(120),
  quantity: z.coerce.number().min(0, "数量は0以上"),
  cost_basis: z.coerce.number().min(0).optional(),
  memo: z.string().max(200).optional().or(z.literal("")),
});

type Result = { ok: true } | { ok: false; error: string };

function parse(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return holdingSchema.safeParse({
    account: raw.account,
    symbol: typeof raw.symbol === "string" ? raw.symbol.trim() : raw.symbol,
    name: raw.name,
    quantity: raw.quantity,
    cost_basis:
      raw.cost_basis === "" || raw.cost_basis == null
        ? undefined
        : raw.cost_basis,
    memo: raw.memo,
  });
}

export async function createHolding(formData: FormData): Promise<Result> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase が未設定です。.env.local を設定してください。" };
  }
  const parsed = parse(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(" / ") };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("holdings").insert({
    account: parsed.data.account,
    symbol: parsed.data.symbol,
    name: parsed.data.name,
    quantity: parsed.data.quantity,
    cost_basis: parsed.data.cost_basis ?? null,
    memo: parsed.data.memo || null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/markets");
  return { ok: true };
}

export async function updateHolding(
  id: string,
  formData: FormData,
): Promise<Result> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase が未設定です。" };
  }
  const parsed = parse(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(" / ") };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("holdings")
    .update({
      account: parsed.data.account,
      symbol: parsed.data.symbol,
      name: parsed.data.name,
      quantity: parsed.data.quantity,
      cost_basis: parsed.data.cost_basis ?? null,
      memo: parsed.data.memo || null,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/markets");
  return { ok: true };
}

export async function deleteHolding(id: string): Promise<Result> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase が未設定です。" };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("holdings").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/markets");
  return { ok: true };
}
