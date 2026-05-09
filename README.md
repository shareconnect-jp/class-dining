# CLASS DINING

経営者・士業のための、接待・出張グルメメディア。

- 公開URL: 未デプロイ
- 事業主体: 株式会社シェアコネクト

## スタック

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Supabase (DB / Auth)
- react-hook-form + zod
- Vercel (デプロイ予定)

## ローカル起動

```bash
npm install
npm run dev
# → http://localhost:3000
```

Supabaseの環境変数が未設定の場合、`src/lib/dummy-data.ts` のフォールバックで5店舗が表示されます。

## ディレクトリ

```
src/
  app/
    page.tsx                          # トップLP
    restaurants/page.tsx              # 店舗一覧
    restaurants/[slug]/page.tsx       # 店舗詳細
    [prefectureSlug]/[genreSlug]/     # SEOページ (例: /tokyo/sushi)
    features/                         # 特集 (Phase 2)
    login/                            # 管理者ログイン
    admin/                            # 管理画面 (CRUD)
  components/
    site-header.tsx, site-footer.tsx
    restaurant-card.tsx, score-bar.tsx
  lib/
    types.ts                          # 型 + ジャンル/都道府県マスタ
    data.ts                           # 取得ロジック (Supabase or dummy)
    dummy-data.ts                     # フォールバック5店舗
    supabase-browser.ts, supabase-server.ts
    zod-schemas.ts                    # フォームバリデーション
db/
  schema.sql                          # Supabase に流す DDL
  seed.sql                            # ダミーデータ
proxy.ts                              # Auth セッションリフレッシュ (旧 middleware)
```

## Supabase接続手順

`SUPABASE_SETUP.md` を参照。

## デプロイ

`DEPLOY.md` を参照。

## ルート一覧

| パス | 説明 |
|---|---|
| `/` | トップLP |
| `/restaurants` | 店舗一覧 |
| `/restaurants/[slug]` | 店舗詳細 |
| `/[pref]/[genre]` | SEOページ (例: /tokyo/sushi) |
| `/features` | 特集一覧 (準備中) |
| `/features/[slug]` | 特集詳細 (準備中) |
| `/login` | 管理者ログイン |
| `/admin` | 管理ダッシュボード |
| `/admin/restaurants` | 店舗一覧 (admin) |
| `/admin/restaurants/new` | 店舗新規作成 |
| `/admin/restaurants/[id]/edit` | 店舗編集 |
| `/admin/genres` | ジャンル管理 |
| `/admin/features` | 特集管理 (準備中) |

## 評価軸

接待向き / 静謐性 / 個室 / VIP対応 / 出張対応 / 会話のしやすさ / 客層 / 予算
