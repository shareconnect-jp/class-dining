import { createSupabaseServerClient } from "./supabase-server";

export type Account = "company" | "personal";

export type Holding = {
  id: string;
  account: Account;
  symbol: string;
  name: string;
  quantity: number;
  cost_basis: number | null;
  memo: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function fetchHoldings(): Promise<Holding[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("holdings")
    .select("*")
    .order("account", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[fetchHoldings]", error);
    return [];
  }
  return (data ?? []) as Holding[];
}
