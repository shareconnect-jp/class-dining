import { NextResponse } from "next/server";
import { fetchQuotes } from "@/lib/quotes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/quotes?symbols=^GSPC,^IXIC,7203.T
// クライアントの定期ポーリング用。価格は都度 Yahoo から取得。
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("symbols") ?? "";
  const symbols = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json(
      { quotes: [], fetchedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const quotes = await fetchQuotes(symbols);

  return NextResponse.json(
    { quotes, fetchedAt: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "CDN-Cache-Control": "no-store",
      },
    },
  );
}
