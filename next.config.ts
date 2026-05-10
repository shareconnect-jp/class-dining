import type { NextConfig } from "next";

const BUILD_VERSION =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ??
  process.env.NEXT_PUBLIC_BUILD_VERSION ??
  "dev";

const nextConfig: NextConfig = {
  // クライアント側からも参照できるバージョン識別子
  env: {
    NEXT_PUBLIC_BUILD_VERSION: BUILD_VERSION,
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "tblg.k-img.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "lh4.googleusercontent.com" },
      { protocol: "https", hostname: "lh5.googleusercontent.com" },
      { protocol: "https", hostname: "lh6.googleusercontent.com" },
    ],
  },

  // HTML/JSON のキャッシュを抑制 (古いクライアントが残らないように)
  async headers() {
    return [
      {
        // app/admin/* はとくに古さが致命的なので no-store
        source: "/admin/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        ],
      },
      {
        // version エンドポイントは絶対キャッシュさせない
        source: "/api/version",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "CDN-Cache-Control", value: "no-store" },
          { key: "Vercel-CDN-Cache-Control", value: "no-store" },
        ],
      },
      {
        // ルート HTML 全般: 中間 CDN キャッシュは抑制、ブラウザは短命
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
