import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  detectUrlSource,
  scrapeRestaurantUrl,
  toFormApply,
} from "@/lib/restaurant-scrape";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// シンプルな in-memory レート制限 (per-IP, 10 req / 60s)
// Vercel の serverless 各インスタンスごとにリセットされる前提でよい (低頻度ユースのみ)
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateBuckets = new Map<string, number[]>();

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (rateBuckets.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (arr.length >= RATE_LIMIT_MAX) {
    rateBuckets.set(ip, arr);
    return true;
  }
  arr.push(now);
  rateBuckets.set(ip, arr);
  return false;
}

export async function POST(req: NextRequest) {
  // ---------- auth ----------
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseAnon) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, code: "unauthorized", error: "ログインが必要です" },
        { status: 401 },
      );
    }
  }
  // 未設定環境 (ダミーモード) ではローカル動作確認のため通す

  // ---------- rate limit ----------
  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json(
      {
        ok: false,
        code: "rate_limited",
        error: "短時間に多くのリクエストが送られました。少し待ってから再試行してください",
      },
      { status: 429 },
    );
  }

  // ---------- body ----------
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid_url", error: "JSON パースに失敗しました" },
      { status: 400 },
    );
  }

  const url =
    body && typeof body === "object" && "url" in body
      ? String((body as { url: unknown }).url ?? "")
      : "";

  if (!url) {
    return NextResponse.json(
      { ok: false, code: "invalid_url", error: "URL が必要です" },
      { status: 400 },
    );
  }

  // ホワイトリスト判定 (詳細チェックは scrape 内でも行うが、無関係 URL を早期に弾く)
  if (!detectUrlSource(url)) {
    return NextResponse.json(
      {
        ok: false,
        code: "invalid_url",
        error:
          "食べログ (tabelog.com) または Google マップ (google.com/maps, maps.app.goo.gl) の URL のみ受け付けます",
      },
      { status: 400 },
    );
  }

  // ---------- scrape ----------
  const result = await scrapeRestaurantUrl(url);
  if (!result.ok) {
    const status =
      result.code === "config_missing"
        ? 503
        : result.code === "rate_limited"
          ? 429
          : result.code === "timeout"
            ? 504
            : result.code === "invalid_url"
              ? 400
              : 502;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json({
    ...result,
    apply: toFormApply(result, url),
  });
}
