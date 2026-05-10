import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * 現在デプロイされているビルドの識別子を返す。
 * クライアント側の VersionChecker が定期的に叩いて、
 * SHA が変わっていたら「新バージョンあります」バナーを出す。
 */
export async function GET() {
  return NextResponse.json(
    {
      version:
        process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ??
        process.env.NEXT_PUBLIC_BUILD_VERSION ??
        "dev",
      builtAt:
        process.env.VERCEL_DEPLOYMENT_ID ??
        new Date().toISOString(),
      env: process.env.VERCEL_ENV ?? "local",
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "CDN-Cache-Control": "no-store",
      },
    },
  );
}
